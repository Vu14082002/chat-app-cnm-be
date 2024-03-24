const httpErrors = require('http-errors');
const { UserModel } = require('../models/UserModel');

// find user by id
const findUser = async (id) => {
     const userFind = await UserModel.findOne({ _id: id });
     if (!userFind) {
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
     const user = await UserModel.findOne({ _id: userId }).select(
          '_id name phone dateOfBirth gender avatar background'
     );
     return user;
};
const updateAvatarURL = async (userId, avatarUrl) => {
     try {
          const user = await UserModel.findOneAndUpdate(
               { _id: userId },
               { $set: { avatar: avatarUrl } },
               { new: true }
          ).select('_id name phone dateOfBirth gender avatar background');
          return user;
     } catch (error) {
          throw httpErrors.BadRequest(error);
     }
};

const addNewFriend = async (userId, friendId) => {
     try {
          const user = await UserModel.findOneAndUpdate(
               { _id: userId, friends: { $ne: friendId } },
               { $addToSet: { friends: friendId } },
               { new: true }
          );
          if (!user) {
               return { success: false, message: 'Friend already exists' };
          }

          return user;
     } catch (error) {
          throw httpErrors.BadRequest(error);
     }
};

const deleteFriendById = async (userId, friendId) => {
     try {
          await UserModel.updateOne(
               { _id: userId },
               { $pull: { friends: friendId } }
          );

          return { success: true, message: 'Friend deleted successfully' };
     } catch (error) {
          return { success: false, message: error.message };
     }
};
const getFriendListSortedByName = async (userId) => {
     try {
          const user = await UserModel.findById(userId).populate({
               path: 'friends',
               options: { sort: { name: 1 } },
          });

          return { success: true, friends: user.friends };
     } catch (error) {
          return { success: false, message: error.message };
     }
};

module.exports = {
     findUser,
     findUserByPhoneAndPasswordBscrypt,
     findUserByPhoneNumberRegex,
     findUserById,
     updateAvatarURL,
     addNewFriend,
     deleteFriendById,
     getFriendListSortedByName,
};
