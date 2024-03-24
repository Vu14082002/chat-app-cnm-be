const logger = require('../logger');
require('dotenv').config();
const { request, response } = require('express');
const {
     createUser,
     loginUser,
     checkRefreshToken,
} = require('../services/auth.service');
const { genToken } = require('../services/jwtToken.service');
const httpErrors = require('http-errors');
const {
     findUser,
     findUserByPhoneAndPasswordBscrypt,
     findUserByPhoneNumberRegex,
     findUserById,
     updateAvatarURL,
     addNewFriend,
     deleteFriendById,
} = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');
const uuid = require('uuid');
const { s3 } = require('../configs/s3.config');
const register = async (req = request, resp = response, next) => {
     try {
          const {
               name,
               phone,
               password,
               dateOfBirth,
               gender,
               background,
               status,
               avatar,
          } = req.body;

          const user = await createUser({
               name,
               phone,
               password,
               dateOfBirth,
               gender,
               avatar,
               background,
               status,
          });
          const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
          const accessToken = await genToken(
               { userId: user._id },
               ACCESS_TOKEN_KEY,
               '1d'
          );
          const refreshToken = await genToken(
               { userId: user._id },
               REFRESH_TOKEN_KEY,
               '14d'
          );
          // respone
          resp.cookie('refreshToken', refreshToken, {
               httpOnly: true,
               path: '/api/v1/auth/refreshToken',
               maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
          });
          resp.status(201).json({
               message: 'Register success',
               accessToken: accessToken,
               user,
          });
     } catch (error) {
          next(error);
     }
};
const login = async (req = request, resp = response, next) => {
     try {
          const { phone, password } = req.body;
          const user = await loginUser({ phone, password });
          if (user.deleted) {
               resp.status(StatusCodes.OK).json({
                    message: 'Account have delete, You want to restore',
               });
          }
          const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
          const accessToken = await genToken(
               { userId: user._id },
               ACCESS_TOKEN_KEY,
               '7d'
          );
          const refreshToken = await genToken(
               { userId: user._id },
               REFRESH_TOKEN_KEY,
               '14d'
          );
          // respone
          resp.cookie('refreshToken', refreshToken, {
               httpOnly: true,
               path: '/api/v1/auth/refreshToken',
               maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
          });
          resp.status(StatusCodes.OK).json({
               message: 'Login success',
               accessToken,
               user,
          });
     } catch (error) {
          next(error);
     }
};
const logout = async (req = request, res = response, next) => {
     try {
          res.clearCookie('refreshToken', {
               path: '/api/v1/auth/refreshToken',
          });
          res.json({ message: 'Logout success' });
     } catch (error) {
          next(error);
     }
};
const refreshToken = async (req = request, resp = response, next) => {
     console.log(req);
     try {
          console.log(`com innn`);
          console.log(req.cookies);
          const refreshToken = req.cookies.refreshToken;
          if (!refreshToken) {
               throw httpErrors.Unauthorized('Please login to continue');
          }
          const check = await checkRefreshToken(
               refreshToken,
               process.env.REFRESH_TOKEN_KEY
          );
          const user = await findUser(check.userId);
          const accessToken = await genToken(
               { userId: user._id },
               process.env.ACCESS_TOKEN_KEY,
               '7d'
          );
          resp.status(201).json({ accessToken, user });
     } catch (error) {
          next(error);
     }
};
const authenticateWithEncryptedCredentials = async (
     req = request,
     resp = response,
     next
) => {
     try {
          const { phone, password } = req.body;
          const user = await findUserByPhoneAndPasswordBscrypt(phone, password);
          if (!user) {
               resp.status(StatusCodes.BAD_REQUEST).json({
                    phone,
                    password,
                    message: 'Not contain,pleas Try again...',
               });
          }
          resp.status(StatusCodes.OK).json(user);
     } catch (error) {
          next(error);
     }
};

const findUserByPhone = async (req = request, resp = response, next) => {
     try {
          const userId = req.user.userId;
          const keyword = req.query.search;
          const user = await findUserByPhoneNumberRegex(keyword, userId);
          resp.status(StatusCodes.OK).json(user || []);
     } catch (error) {
          next(error);
     }
};

const userInfo = async (req = request, resp = response, next) => {
     try {
          const userId = req.user.userId;
          const user = await findUserById(userId);
          resp.status(StatusCodes.OK).json(user);
     } catch (error) {
          next(error);
     }
};
const updateAvatar = async (req = request, resp = response, next) => {
     try {
          console.log(req.file);
          const userId = req.user.userId;
          const img = req.file.originalname.split('.')[1];
          const avatar = `${uuid.v4()}_${Date.now()}.${img}`;

          const paramsS3 = {
               Bucket: process.env.BUCKET_NAME,
               Key: avatar,
               Body: req.file.buffer,
               ContentType: req.file.mimetype,
          };

          s3.upload(paramsS3, async (error, data) => {
               if (error) {
                    return resp.send('error fromm server: UPLOAD FILE IMG');
               }
               const avatarUrl = data.Location;
               console.log('------------------------------------');
               console.log(userId, '-------------', avatarUrl);
               const user = await updateAvatarURL(userId, avatarUrl);
               resp.status(StatusCodes.OK).json(user);
          });
     } catch (error) {
          next(error);
     }
};

const addfriend = async (req, resp, next) => {
     try {
          const userId = req.user.userId;
          const { friendId } = req.body;
          console.log(`----------------------------`);
          console.log(userId);
          console.log(req);
          const result = await addNewFriend(userId, friendId);
          resp.status(StatusCodes.OK).json(result);
     } catch (error) {
          next(error);
     }
};
const deleteFriend = async (req = request, resp = response, next) => {
     try {
          const userId = req.user.userId;
          const { friendId } = req.body;
          const result = await deleteFriendById(userId, friendId);
          resp.status(StatusCodes.OK).json(result);
     } catch (error) {
          next(error);
     }
};
module.exports = {
     login,
     register,
     logout,
     refreshToken,
     authenticateWithEncryptedCredentials,
     findUserByPhone,
     userInfo,
     updateAvatar,
     addfriend,
     deleteFriend,
};
