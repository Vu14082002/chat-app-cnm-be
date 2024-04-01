const httpErrors = require('http-errors');
const { UserModel } = require('../models/user.model');

// find user by id
const httpErrors = require('http-errors');

const findUserByIdService = async (id) => {
  const userFind = await UserModel.findById(id);
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
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
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
      { avatar: avatarUrl },
      { new: true }
    );
    console.log(user);
    return user;
  } catch (error) {
    throw httpErrors.BadRequest(error);
  }
};

const addNewFriend = async (userId, friendId) => {
  console.log(userId, '--------------------', friendId);
  const session = await UserModel.startSession();
  session.startTransaction();
  try {
    const opts = { session, new: true };
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, friends: { $ne: friendId } },
      { $addToSet: { friends: friendId } },
      opts
    );
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: 'Không thể thêm bạn' };
    }

    const friend = await UserModel.findOneAndUpdate(
      { _id: friendId, friends: { $ne: userId } },
      { $addToSet: { friends: userId } },
      opts
    );
    if (!friend) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: 'Không thể thêm bạn' };
    }

    await session.commitTransaction();
    session.endSession();
    return { success: true, user, friend };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error);
  }
};

const deleteFriendById = async (userId, friendId) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, friends: friendId },
      { $pull: { friends: friendId } },
      { new: true }
    );

    if (!user) {
      return { success: false, message: 'User or friend not found' };
    }

    await UserModel.updateOne({ _id: friendId }, { $pull: { friends: userId } });

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
  findUserByIdService,
  findUserByPhoneNumberRegex,
  findUserById,
  updateAvatarURL,
  addNewFriend,
  deleteFriendById,
  getFriendListSortedByName,
};
