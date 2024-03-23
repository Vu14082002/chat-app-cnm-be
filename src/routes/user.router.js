const express = require('express');
const { findUserByPhone } = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const userRouter = express.Router();

userRouter.route('/').get(trimRequest.all, checkAuthorized, findUserByPhone);

module.exports = { userRouter };
