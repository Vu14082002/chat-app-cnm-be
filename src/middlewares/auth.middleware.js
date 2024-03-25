const createHttpError = require('http-errors');
const jsonwebtoken = require('jsonwebtoken');
const logger = require('../logger');
const checkAuthorized = async(req, resp, next) => {
    try {
        if (!req.headers.authorization) {
            return next(createHttpError.Unauthorized('Please login to continue'));
        }
        const token = req.headers.authorization.split(' ')[1];
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
    } catch (error) {
        next(error)
    }
};

module.exports = { checkAuthorized };