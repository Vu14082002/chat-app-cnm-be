const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const { error } = require('winston');

const signToken = async (payload, keySerect, expiresIn) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            keySerect,
            {
                expiresIn: expiresIn,
            },
            (error, token) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(token);
                }
            }
        );
    });
};

const verifyToken = async (token, keySerect) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, keySerect, (err, payload) => {
            // token hợp lệ thì err == null
            if (err) {
                resolve(null);
            } else {
                resolve(payload);
            }
        });
    });
};
module.exports = { signToken, verifyToken };
