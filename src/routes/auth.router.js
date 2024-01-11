const express = require('express');
const { register, login, logout, refreshToken } = require('../controllers/user.controller');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const router = express.Router();

router.route('/register').post(trimRequest.all, register);
router.route('/login').post(trimRequest.all, login);
router.route('/logout').post(trimRequest.all, logout);
router.route('/refreshtoken').post(trimRequest.all, refreshToken);
router.route('/testauth').get(trimRequest.all, checkAuthorized, (req, res) => {
    res.send(req.user);
});

module.exports = router;
