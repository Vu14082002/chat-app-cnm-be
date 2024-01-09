const { ObjectId } = require('mongodb');
const httpErrors = require('http-errors');
const QRcode = require('qrcode');
const { UserModel } = require('../models');
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

module.exports = { createUser };
