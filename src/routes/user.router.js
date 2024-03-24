const express = require('express');
const {
     findUserByPhone,
     userInfo,
     updateAvatar,
} = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const userRouter = express.Router();
const { upload } = require('../configs/multer.config');

userRouter.route('/').get(trimRequest.all, checkAuthorized, findUserByPhone);
userRouter.route('/info').get(trimRequest.all, checkAuthorized, userInfo);
userRouter
     .route('/updateAvatar')
     .post(checkAuthorized, upload.single('avatar'), updateAvatar);

module.exports = { userRouter };
