const logger = require('../logger');
const { signToken } = require('../utils/tokenJwt.util');

const genToken = async (payload, expiresIn, keySerect) => {
    let token = await signToken(payload, expiresIn, keySerect);
    return token;
};

module.exports = { genToken };
