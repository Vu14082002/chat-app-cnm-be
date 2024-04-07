const express = require('express');
const {
  findUserByPhone,
  userInfo,
  updateAvatar,
  addfriend,
  deleteFriend,
  updateUserInfo,
  acceptFriendRequest,
  listRequestfriend,
  revocationRequestFriend,
  getListFriend,
  listRequestfriendWaitRespone,
} = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const multer = require('multer');

const userRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

userRouter.route('/').get(trimRequest.all, checkAuthorized, findUserByPhone);
userRouter.route('/info').get(trimRequest.all, checkAuthorized, userInfo);
userRouter.route('/listFriend').get(trimRequest.all, checkAuthorized, getListFriend);
userRouter.route('/addfriend').post(trimRequest.all, checkAuthorized, addfriend);
// Bạn là A: đay là API lấy danh sách các yêu cầu kể bạn mà A đã gửi
userRouter.route('/listRequestFriend').get(trimRequest.all, checkAuthorized, listRequestfriend);
// Bạn là A: đay là API lấy danh sách các yêu cầu kết bạn mà A đã được nhận
userRouter
  .route('/listRequestfriendWaitRespone')
  .get(trimRequest.all, checkAuthorized, listRequestfriendWaitRespone);
userRouter.route('/acceptfriend').post(trimRequest.all, checkAuthorized, acceptFriendRequest);
userRouter
  .route('/revocationRequestFriend')
  .post(trimRequest.all, checkAuthorized, revocationRequestFriend);
userRouter.route('/deletefriend').delete(trimRequest.all, checkAuthorized, deleteFriend);
userRouter.route('/updateAvatar').post(checkAuthorized, upload.single('avatar'), updateAvatar);
userRouter.route('/').patch(checkAuthorized, trimRequest.all, updateUserInfo);

module.exports = { userRouter };
