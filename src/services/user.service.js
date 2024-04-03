const httpErrors = require('http-errors');
const { UserModel } = require('../models/user.model');
const { sendNotification } = require('./notification.services');

// find user by id
const findUserByIdService = async (id) => {
  const userFind = await UserModel.findById(id);
  console.log('------------------------');
  console.log(userFind);
  return userFind;
};

const findUserByContactOrNameRegex = async (keyword, userId) => {
  try {
    const userFind = await UserModel.find({
      $and: [
        {
          $or: [
            { _id: { $regex: keyword, $options: 'i' } },
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

// TODO: Lêm thêm gừi notification
const sendFriendRequest = async (senderId, receiverId) => {
  const existingRequest = await FriendModel.findOne({
    sender_id: senderId,
    receiver_id: receiverId,
    status: 'pending',
  });
  const reverseRequest = await FriendModel.findOne({
    sender_id: receiverId,
    receiver_id: senderId,
    status: 'pending',
  });
  if (existingRequest) {
    if (reverseRequest) {
      await FriendModel.updateMany(
        {
          $or: [
            { sender_id: senderId, receiver_id: receiverId },
            { sender_id: receiverId, receiver_id: senderId },
          ],
          status: 'pending',
        },
        { status: 'accepted' }
      );
      sendNotification(receiverId, 'Bạn có môt yêu cầu kết bạn');
      return true;
    }
    return false;
  }

  await FriendModel.create({ sender_id: senderId, receiver_id: receiverId });
  sendNotification(receiverId, 'Bạn có môt yêu cầu kết bạn');

  return true;
};
// TODO: chưa check
const confirmFriendRequest = async (userId, friendId) => {
  try {
    // Tìm yêu cầu kết bạn từ cả hai phía
    const friendRequest = await FriendModel.findOne({
      $or: [
        { sender_id: userId, receiver_id: friendId },
        { sender_id: friendId, receiver_id: userId },
      ],
    });

    if (!friendRequest || friendRequest.status !== 'pending') {
      return null;
    }

    await FriendModel.findByIdAndUpdate(friendRequest._id, { status: 'accepted' });

    return true;
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error('Error confirming friend request:', error);
    throw new Error('Failed to confirm friend request. Please try again later.');
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

const updateUserInfoService = async (user) => {
  const { _id, ...rest } = user;

  await UserModel.findOneAndUpdate({ _id }, { $set: rest });

  return await UserModel.findOne({ _id });
};

module.exports = {
  findUserByIdService,
  findUserByContactOrNameRegex,
  findUserById,
  updateAvatarURL,
  sendFriendRequest,
  deleteFriendById,
  getFriendListSortedByName,
  updateUserInfoService,
  confirmFriendRequest,
};
