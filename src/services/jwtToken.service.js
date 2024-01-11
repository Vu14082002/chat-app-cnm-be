const logger = require('../logger');
const { signToken } = require('../utils/tokenJwt.util');

const genToken = async (payload, keySerect, expiresIn) => {
    let token = await signToken(payload, keySerect, expiresIn);
    return token;
};

module.exports = { genToken };
