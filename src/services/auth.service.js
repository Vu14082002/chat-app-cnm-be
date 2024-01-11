const { ObjectId } = require('mongodb');
const httpErrors = require('http-errors');
const bcrypt = require('bcrypt');
const QRcode = require('qrcode');
const { UserModel } = require('../models');
const { verifyToken } = require('../utils/tokenJwt.util');
const createUser = async (userInfo) => {
    const { name, phone, password, dateOfBirth, gender, avatar, background, status } = userInfo;
    // validator here
    if (!userInfo.name || !userInfo.phone || !userInfo.password || !userInfo.dateOfBirth || !userInfo.gender) {
        throw httpErrors.BadRequest('Please fill out all information in the form');
    }
    //  ------------------------------------
    // check phone already exist
    const userFromDb = await UserModel.findOne({ phone: userInfo.phone });
    if (userFromDb) {
        throw httpErrors.BadRequest('Phone number has been registered');
    }
    // save user
    // genarate QRCODE String
    const newId = new ObjectId();
    console.log(`-----------ID---------`, newId);
    const qrCodeData = await QRcode.toDataURL(newId.toString());
    const userSaved = await new UserModel({
        _id: newId,
        name,
        phone,
        password,
        dateOfBirth,
        gender,
        avatar: avatar || process.env.DEFAULT_AVATAR,
        background: background || process.env.DEFAULT_BACKGROUND,
        status,
        qrCode: qrCodeData,
    }).save();

    return userSaved;
};

const loginUser = async (userLogin) => {
    const { phone, password } = userLogin;
    const user = await UserModel.findOne({ phone });
    if (!user) {
        throw httpErrors.BadRequest('The phone or password you entered is incorrect');
    }
    // compare password
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
        throw httpErrors.BadRequest('The phone or password you entered is incorrect');
    }

    return user;
};
const checkRefreshToken = async (token, key) => {
    const check = await verifyToken(token, key);
    return check;
};

module.exports = { createUser, loginUser, checkRefreshToken };
