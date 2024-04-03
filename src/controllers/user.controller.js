const logger = require('../logger');
require('dotenv').config();

const {
  findUserByContactOrNameRegex,
  findUserById,
  updateAvatarURL,
  sendFriendRequest,
  deleteFriendById,
  updateUserInfoService,
} = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');
const uuid = require('uuid');
const { s3 } = require('../configs/s3.config');

const findUserByPhone = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const keyword = req.query.search;
    const user = await findUserByContactOrNameRegex(keyword, userId);
    resp.status(StatusCodes.OK).json(user || []);
  } catch (error) {
    next(error);
  }
};

const userInfo = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const user = await findUserById(userId);
    resp.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
};
const updateAvatar = async (req, resp, next) => {
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
    const result = await sendFriendRequest(userId, friendId);
    if (!result) {
      return resp.status(StatusCodes.BAD_REQUEST).json(result);
    }
    resp.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};
const deleteFriend = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.body;
    const result = await deleteFriendById(userId, friendId);
    resp.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const updateUserInfo = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { name, gender, dateOfBirth } = req.body;

    if (!name || !gender || !dateOfBirth)
      return resp.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid data' });

    const user = await updateUserInfoService({ _id: userId, name, gender, dateOfBirth });
    resp.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findUserByPhone,
  userInfo,
  updateAvatar,
  addfriend,
  deleteFriend,
  updateUserInfo,
};
