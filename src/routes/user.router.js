const express = require('express');
const { findUserByPhone, userInfo } = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const userRouter = express.Router();

userRouter.route('/').get(trimRequest.all, checkAuthorized, findUserByPhone);
userRouter.route('/info').get(trimRequest.all, checkAuthorized, userInfo);

module.exports = { userRouter };
