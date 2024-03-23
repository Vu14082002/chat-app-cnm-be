const createHttpError = require('http-errors');
const jsonwebtoken = require('jsonwebtoken');
const logger = require('../logger');
const { logout } = require('../controllers/user.controller');
const { request, response } = require('express');

const checkAuthorized = async (req = request, resp = response, next) => {
    const token = req.headers?.authorization?.split(' ')[1];
    if (!token) {
        return next(createHttpError.Unauthorized('Please login to continue'));
    }
    jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_KEY, (err, payload) => {
        if (err) {
            logger.error(`token don't verify`);
            logger.error(err.name);
            logger.info('from auth.middleware.js');
            next(createHttpError.Unauthorized(err));
        }
        req.user = payload;
        next();
    });
};

module.exports = { checkAuthorized };
