const express = require('express');
const {
  findUserByPhone,
  userInfo,
  updateAvatar,
  addfriend,
  deleteFriend,
  updateUserInfo,
  acceptFriendRequest,
} = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const multer = require('multer');

const userRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

userRouter.route('/').get(trimRequest.all, checkAuthorized, findUserByPhone);
userRouter.route('/info').get(trimRequest.all, checkAuthorized, userInfo);
userRouter.route('/addfriend').post(trimRequest.all, checkAuthorized, addfriend);
userRouter.route('/acceptfriend').post(trimRequest.all, checkAuthorized, acceptFriendRequest);
userRouter.route('/deletefriend').delete(trimRequest.all, checkAuthorized, deleteFriend);
userRouter.route('/updateAvatar').post(checkAuthorized, upload.single('avatar'), updateAvatar);
userRouter.route('/').patch(checkAuthorized, trimRequest.all, updateUserInfo);

module.exports = { userRouter };
