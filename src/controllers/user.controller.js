const logger = require('../logger');
const { createUser } = require('../services/auth.service');

const register = async (req, res, next) => {
    try {
        const { name, phone, password, dateOfBirth, gender, avatar, background, status } = req.body;
        const userSaved = await createUser({ name, phone, password, dateOfBirth, gender, avatar, background, status });
        res.status(201).json(userSaved);
    } catch (error) {
        next(error);
    }
};
const login = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
};
const logout = async (req, res, next) => {
    try {
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
