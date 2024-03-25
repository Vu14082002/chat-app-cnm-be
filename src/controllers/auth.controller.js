const { loginUser, checkRefreshToken, createUser, findUserByPhoneAndPasswordBscrypt, } = require('../services/auth.service');
const { genToken } = require('../services/jwtToken.service');
const { findUser } = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');
const register = async(req, resp, next) => {
    try {
        const { name, phone, password, dateOfBirth, gender, background, status, avatar } = req.body;
        const user = await createUser({
            name,
            phone,
            password,
            dateOfBirth,
            gender,
            avatar,
            background,
            status,
        });
        const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
        const accessToken = await genToken({ userId: user._id }, ACCESS_TOKEN_KEY, '1d');
        const refreshToken = await genToken({ userId: user._id }, REFRESH_TOKEN_KEY, '14d');
        // respone
        resp.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/api/v1/auth/refreshToken',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });
        resp.status(201).json({
            message: 'Register success',
            accessToken: accessToken,
            user,
        });
    } catch (error) {
        next(error);
    }
};
const login = async(req, resp, next) => {
    try {
        const { phone, password } = req.body;
        const user = await loginUser({ phone, password });
        if (user.deleted) {
            resp.status(StatusCodes.OK).json({
                message: 'Account have delete, You want to restore',
            });
        }
        const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
        const accessToken = await genToken({ userId: user._id }, ACCESS_TOKEN_KEY, '7d');
        const refreshToken = await genToken({ userId: user._id }, REFRESH_TOKEN_KEY, '14d');
        // respone
        resp.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/api/v1/auth/refreshToken',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });
        resp.status(StatusCodes.OK).json({
            message: 'Login success',
            accessToken,
            user,
        });
    } catch (error) {
        next(error);
    }
};
const loginAuthenticateWithEncryptedCredentials = async(req, resp, next) => {
    try {
        const { phone, password } = req.body;
        const user = await findUserByPhoneAndPasswordBscrypt({ phone, password });
        if (user.deleted) {
            resp.status(StatusCodes.OK).json({
                message: 'Account have delete, You want to restore',
            });
        }
        const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
        const accessToken = await genToken({ userId: user._id }, ACCESS_TOKEN_KEY, '7d');
        const refreshToken = await genToken({ userId: user._id }, REFRESH_TOKEN_KEY, '14d');
        // respone
        resp.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/api/v1/auth/refreshToken',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });
        resp.status(StatusCodes.OK).json({
            message: 'Login success',
            accessToken,
            user,
        });
    } catch (error) {
        next(error);
    }
};
const logout = async(req, res, next) => {
    try {
        res.clearCookie('refreshToken', {
            path: '/api/v1/auth/refreshToken',
        });
        res.json({ message: 'Logout success' });
    } catch (error) {
        next(error);
    }
};
const refreshToken = async(req, resp, next) => {
    console.log(req);
    try {
        console.log(`com innn`);
        console.log(req.cookies);
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw httpErrors.Unauthorized('Please login to continue');
        }
        const check = await checkRefreshToken(refreshToken, process.env.REFRESH_TOKEN_KEY);
        const user = await findUser(check.userId);
        const accessToken = await genToken({ userId: user._id }, process.env.ACCESS_TOKEN_KEY, '7d');
        resp.status(201).json({ accessToken, user });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register,
    logout,
    refreshToken,
    loginAuthenticateWithEncryptedCredentials,
};