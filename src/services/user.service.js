const httpErrors = require('http-errors');
const { UserModel } = require('../models/UserModel');
const { CommandFailedEvent } = require('mongodb');
const { userInfo } = require('os');

// find user by id
const findUser = async (id) => {
     const userFind = await UserModel.findOne({ _id: id });
     if (!user) {
          throw httpErrors.BadRequest(
               'Please fill out all information in the form'
          );
     }
     return userFind;
};
const findUserByPhoneAndPasswordBscrypt = async (phone, password) => {
     const userFind = await UserModel.findOne({ phone, password });
     return userFind;
};
const findUserByPhoneNumberRegex = async (keyword, userId) => {
     try {
          const userFind = await UserModel.find({
               $and: [
                    {
                         $or: [
                              { phone: { $regex: keyword, $options: 'i' } },
                              { name: { $regex: keyword, $options: 'i' } },
                         ],
                    },
                    { _id: { $ne: userId } },
               ],
          }).select('name avatar');
          return userFind;
     } catch (error) {
          throw httpErrors.BadRequest(
               'Some thing wrong, Please try again late'
          );
     }
};
const findUserById = async (userId) => {
     const user = await UserModel.find({ _id: userId }).select(
          '_id name phone dateOfBirth gender avatar background'
     );
     return user;
};

module.exports = {
     findUser,
     findUserByPhoneAndPasswordBscrypt,
     findUserByPhoneNumberRegex,
     findUserById,
};
