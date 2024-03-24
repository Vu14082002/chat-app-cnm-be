const express = require('express');
const {
     register,
     login,
     logout,
     refreshToken,
     authenticateWithEncryptedCredentials,
} = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const authRoutes = express.Router();

authRoutes.route('/register').post(trimRequest.all, register);
authRoutes
     .route('/loginWithEncrypted')
     .post(trimRequest.all, authenticateWithEncryptedCredentials);
authRoutes.route('/login').post(trimRequest.all, login);
authRoutes.route('/logout').post(trimRequest.all, logout);
authRoutes.route('/refreshToken').post(trimRequest.all, refreshToken);

module.exports = { authRoutes };
