const express = require('express');
// prettier-ignore
const {
  register,
  login,
  logout,
  refreshToken,
  loginAuthenticateWithEncryptedCredentials,
  createOTP,
  verifyOTP,
  forgotPassword,
  changePassword,
  forgotpassword
} = require('../controllers/auth.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const authRoutes = express.Router();

authRoutes.route('/createOTP').post(trimRequest.all, createOTP);
authRoutes.route('/verifyOTP').post(trimRequest.all, verifyOTP);
authRoutes.route('/register').post(trimRequest.all, register);
authRoutes
  .route('/loginWithEncrypted')
  .post(trimRequest.all, loginAuthenticateWithEncryptedCredentials);
authRoutes.route('/login').post(trimRequest.all, login);
authRoutes.route('/forgot-password').post(trimRequest.all, forgotPassword);
authRoutes.route('/forgotpassword').post(trimRequest.all, forgotpassword);
authRoutes.route('/logout').post(trimRequest.all, logout);
authRoutes.route('/refreshToken').post(trimRequest.all, refreshToken);
authRoutes.route('/changePassword').post(trimRequest.all, checkAuthorized, changePassword);

module.exports = { authRoutes };
