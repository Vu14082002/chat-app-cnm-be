const express = require('express');
// prettier-ignore
const { register, login, logout, refreshToken, loginAuthenticateWithEncryptedCredentials } = require('../controllers/auth.controller');
const trimRequest = require('trim-request');
const authRoutes = express.Router();

authRoutes.route('/register').post(trimRequest.all, register);
authRoutes.route('/loginWithEncrypted').post(trimRequest.all, loginAuthenticateWithEncryptedCredentials);
authRoutes.route('/login').post(trimRequest.all, login);
authRoutes.route('/logout').post(trimRequest.all, logout);
authRoutes.route('/refreshToken').post(trimRequest.all, refreshToken);

module.exports = { authRoutes };