const logger = require('../logger');
const { UserModel } = require('../models/UserModel');
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
} = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');

const register = async (req = request, res = response, next) => {
     try {
          const {
               name,
               phone,
               password,
               dateOfBirth,
               gender,
               avatar,
               background,
               status,
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
          res.cookie('refreshToken', refreshToken, {
               httpOnly: true,
               path: '/api/v1/auth/refreshToken',
               maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
          });
          res.status(201).json({
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
const refreshToken = async (req = request, res = response, next) => {
     try {
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
          res.status(201).json({ accessToken, user });
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
module.exports = {
     login,
     register,
     logout,
     refreshToken,
     authenticateWithEncryptedCredentials,
     findUserByPhone,
     userInfo,
};
