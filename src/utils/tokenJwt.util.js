const jwt = require('jsonwebtoken');

const signToken = async (payload, expiresIn, keySerect) => {
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

module.exports = { signToken };
