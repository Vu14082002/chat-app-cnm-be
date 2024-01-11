const httpErrors = require('http-errors');
const { UserModel } = require('../models');

// find user by id
const findUser = async (id) => {
    const user = await UserModel.findOne({ _id: id });
    if (!user) {
        throw httpErrors.BadRequest('Please fill out all information in the form');
    }
    return user;
};

module.exports = { findUser };
