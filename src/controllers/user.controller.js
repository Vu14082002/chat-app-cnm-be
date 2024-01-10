const { createUser, loginUser } = require('../services/auth.service');
const { genToken } = require('../services/jwtToken.service');

const register = async (req, res, next) => {
    try {
        const { name, phone, password, dateOfBirth, gender, avatar, background, status } = req.body;
        const userSaved = await createUser({ name, phone, password, dateOfBirth, gender, avatar, background, status });
        const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
        console.log(`ACCESS_TOKEN_KEY -->`, ACCESS_TOKEN_KEY);
        const accessToken = await genToken({ userId: userSaved._id }, '1d', ACCESS_TOKEN_KEY);
        const refreshToken = await genToken({ userId: userSaved._id }, '14d', REFRESH_TOKEN_KEY);
        // respone
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/api/v1/auth/refreshToken',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });
        res.status(201).json({ message: 'Register success', accessToken: accessToken, user: { _id: userSaved._id } });
    } catch (error) {
        next(error);
    }
};
const login = async (req, res, next) => {
    try {
        const { phone, password } = req.body;
        const user = await loginUser({ phone, password });
        const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
        const accessToken = await genToken({ userId: user._id }, '1d', ACCESS_TOKEN_KEY);
        const refreshToken = await genToken({ userId: user._id }, '14d', REFRESH_TOKEN_KEY);
        // respone
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            path: '/api/v1/auth/refreshToken',
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
        });
        res.status(201).json({ message: 'Login message', accessToken: accessToken, user });
    } catch (error) {
        next(error);
    }
};
const logout = async (req, res, next) => {
    try {
        res.clearCookie('refreshToken', { path: '/api/v1/auth/refreshToken' });
        res.json({ message: 'Logout success' });
    } catch (error) {
        next(error);
    }
};
const refreshToken = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};

module.exports = { login, register, logout, refreshToken };
