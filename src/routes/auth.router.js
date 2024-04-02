const express = require('express');
// prettier-ignore
const {
  register,
  login,
  logout,
  refreshToken,
  loginAuthenticateWithEncryptedCredentials,
  createOTPEmail,
  verifyOTP,
  forgotpassword,
} = require('../controllers/auth.controller');
const trimRequest = require('trim-request');
const authRoutes = express.Router();

authRoutes.route('/createOTPEmail').post(trimRequest.all, createOTPEmail);
authRoutes.route('/verifyOTP').post(trimRequest.all, verifyOTP);
// [ ] QRCode
authRoutes.route('/register').post(trimRequest.all, register);
authRoutes
  .route('/loginWithEncrypted')
  .post(trimRequest.all, loginAuthenticateWithEncryptedCredentials);
authRoutes.route('/login').post(trimRequest.all, login);
authRoutes.route('/forgotpassword').post(trimRequest.all, forgotpassword);
authRoutes.route('/logout').post(trimRequest.all, logout);
authRoutes.route('/refreshToken').post(trimRequest.all, refreshToken);

module.exports = { authRoutes };
