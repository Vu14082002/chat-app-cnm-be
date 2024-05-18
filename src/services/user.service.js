const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const httpErrors = require('http-errors');
const { UserModel } = require('../models/user.model');
const { sendNotification, markNotificationAsRead } = require('./notification.services');
const { FriendshipModel } = require('../models/friendship.model');
const { FriendModel, FriendRequestModel } = require('../models/friendRequest.model');
const NotificationModel = require('../models/notification.model');
const { CommandFailedEvent } = require('mongodb');
const { ConversationModel } = require('../models/conversation.model');

// find user by id
const findUserByIdService = async (id) => {
  const userFind = await UserModel.findById(id);
  console.log(userFind);
  return userFind;
};

const findUserByContactOrNameRegex = async (keyword, userId) => {
  try {
    const [userFind, user, sendRequestAddFriend, waitResponseAddFriend] = await Promise.all([
      UserModel.find({
        $and: [
          {
            $or: [
              { _id: { $regex: new RegExp(`^${keyword}$`), $options: 'i' } },
              { name: { $regex: keyword, $options: 'i' } },
            ],
          },
          { _id: { $ne: userId } },
        ],
      }).select('name avatar dateOfBirth gender background'),
      FriendshipModel.findById(userId),
      FriendRequestModel.find({
        sender_id: userId,
      }),
      FriendRequestModel.find({
        receiver_id: userId,
      }),
    ]);

    // Lấy danh sách bạn bè của người dùng hiện tại
    // const user = await FriendshipModel.findById(userId);
    const userFriendIds = new Set(user?.friends.map((friend) => friend.toString()) || []);
    // const sendRequestAddFriend = await FriendRequestModel.find({
    //   sender_id: userId,
    // });
    // const waitResponseAddFriend = await FriendRequestModel.find({
    //   receiver_id: userId,
    // });

    // Thêm thuộc tính isFriend vào từng user trong danh sách tìm được
    // const usersWithFriendStatus = userFind.map((user) => ({
    //   ...user.toObject(),
    //   isFriend: userFriendIds.has(user._id),
    // }));
    const usersWithFriendStatusPromise = userFind.map(async (user) => {
      // status: 0: không phải là bạn bè, 1: đã là bạn bè, 2: đã gửi yêu cầu kết bạn, 3: được gửi yêu cầu kết bạn
      let status = 0;
      if (userFriendIds.has(user._id)) {
        status = 1;
      } else if (sendRequestAddFriend.some((u) => u.receiver_id === user._id)) {
        status = 2;
      } else if (waitResponseAddFriend.some((u) => u.sender_id === user._id)) {
        status = 3;
      } else {
        status = 0;
      }
      const commonGroupCount = await ConversationModel.calculateAmountGroup(userId, user._id);

      return { ...user.toObject(), status, commonGroupCount };
    });
    const usersWithFriendStatus = await Promise.all(usersWithFriendStatusPromise);
    return usersWithFriendStatus;
  } catch (error) {
    console.error(error);
    throw httpErrors.BadRequest('Something went wrong. Please try again later.');
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

const sendFriendRequestService = async ({ senderId, receiverId, message, blockView }) => {
  try {
    const existingFriendship = await FriendshipModel.exists({
      _id: senderId,
      friends: receiverId,
    });
    if (existingFriendship) {
      return { status: false, message: 'Bạn bè đã có trong danh sách kết bạn rồi' };
    }
    const existingRequest = await FriendRequestModel.exists({
      sender_id: senderId,
      receiver_id: receiverId,
      // status: 'pending',
    });
    if (existingRequest) {
      return { status: false, message: 'Bạn đã gửi yêu cầu kết bạn rồi, hãy đợi phản hồi' };
    }
    const res = await FriendRequestModel.create({
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      blockView,
    });

    const data = await FriendRequestModel.findOne({ _id: res._id }).populate({
      path: 'receiver_id',
      select: 'name avatar',
      model: 'UserModel',
    });

    await sendNotification(receiverId, senderId, 'Bạn có một yêu cầu kết bạn');
    return { status: true, message: `Đã gửi yêu cầu kết bạn đến ${receiverId}`, data };
  } catch (error) {
    throw httpErrors.InternalServerError(`Send FriendRequestService from server error ${error}`);
  }
};

// Bạn là A: lấy danh sach các yêu cầu kết bạn mà bạn đã gửi
const listRequestFriendService = async (userId) => {
  try {
    const listRequestFriend = await FriendRequestModel.find({ sender_id: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'receiver_id',
        select: 'name avatar',
        model: 'UserModel',
      });
    return listRequestFriend;
  } catch (error) {
    console.error(error);
    next(error);
  }
};
// Bạn là A: lấy danh sach các yêu cầu kết bạn mà bạn đã được nhận
const listRequestfriendWaitResponeService = async (userId) => {
  try {
    const listRequestFriend = await FriendRequestModel.find({ receiver_id: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'sender_id',
        select: 'name avatar',
        model: 'UserModel',
      });
    return listRequestFriend;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const acceptFriendRequestService = async (userId, senderId) => {
  try {
    const existingRequest = await FriendRequestModel.findOneAndDelete({
      sender_id: senderId,
      receiver_id: userId,
    });

    if (!existingRequest) {
      return { status: false, message: `Người dùng ${senderId} chưa gửi yêu cầu kết bạn tới bạn` };
    }

    await Promise.all([
      FriendshipModel.findOneAndUpdate(
        { _id: userId },
        { $addToSet: { friends: senderId } },
        { upsert: true }
      ),
      FriendshipModel.findOneAndUpdate(
        { _id: senderId },
        { $addToSet: { friends: userId } },
        { upsert: true }
      ),
    ]);

    Promise.all([
      sendNotification(senderId, userId, `Bạn và ${userId} đã trở thành bạn bè`),
      markNotificationAsRead(userId, senderId),
    ]);
    return { status: true, message: `Bạn và ${senderId} đã trở thành bạn bè` };
  } catch (error) {
    throw httpErrors.InternalServerError(`Confirm friend request error`, error);
  }
};

const rejectriendRequestService = async (userId, senderId) => {
  try {
    const result = await FriendRequestModel.findOneAndDelete({
      sender_id: senderId,
      receiver_id: userId,
    });

    if (!result) {
      throw httpErrors.NotFound(`Friend request not found for user: ${friendId}`);
    }
    await markNotificationAsRead(userId, senderId);
    return true;
  } catch (error) {
    if (error instanceof httpErrors.NotFound) {
      throw error;
    }
    throw httpErrors.InternalServerError(`rejectriendRequestService request error ${error}`);
  }
};

const revocationRequestFriendService = async (userId, friendId) => {
  try {
    const result = await FriendRequestModel.findOneAndDelete({
      sender_id: userId,
      receiver_id: friendId,
    });

    if (!result) {
      throw httpErrors.NotFound(`Friend request not found for user: ${friendId}`);
    }

    return true;
  } catch (error) {
    if (error instanceof httpErrors.NotFound) {
      throw error;
    }
    throw httpErrors.InternalServerError(`revocationRequestFriendService request error`, error);
  }
};

const rejectFriendRequestService = async (userId, friendId) => {};

const deleteFriendById = async (userId, friendId) => {
  try {
    const [user] = await Promise.all([
      FriendshipModel.findOneAndUpdate(
        { _id: userId, friends: friendId },
        { $pull: { friends: friendId } },
        { new: true }
      ),
      FriendshipModel.findOneAndUpdate(
        { _id: friendId, friends: userId },
        { $pull: { friends: userId } },
        { new: true }
      ),
    ]);

    if (!user) return { success: false, message: 'User or friend not found' };

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
const getListFriendService = async (userId) => {
  try {
    const listFriend = await FriendshipModel.findById(userId).populate({
      path: 'friends',
      select: 'name avatar',
      options: { sort: { name: 1 } },
    });
    return listFriend;
  } catch (error) {
    throw httpErrors.InternalServerError(`revocationRequestFriendService request error`, error);
  }
};
const getListRecommendFriendService = async (userId) => {
  try {
    // get list friend user
    const listFriend = await FriendshipModel.findById(userId).select('friends');
    return listFriend;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// find friend by userId
const isFriendsService = async (friends, userId) => {
  try {
    const friendObj = await FriendshipModel.findById(userId);
    const friend = new Set(friendObj.friends.map((friend) => friend.toString()));
    for (let i = 0; i < friends.length; i++) {
      if (!friend.has(friends[i])) return false;
    }
    return true;
  } catch (error) {
    throw httpErrors.InternalServerError(`isFriendsService request error`, error);
  }
};

const getSuggestFriendsService = async (userId) => {
  try {
    const [userFind, user, sendRequestAddFriend, waitResponseAddFriend] = await Promise.all([
      ConversationModel.aggregate([
        { $match: { $expr: { $in: [userId, '$users'] } } },
        { $project: { _id: 0, users: 1 } },
        { $unwind: '$users' },
        { $match: { $expr: { $ne: ['$users', userId] } } },
        { $group: { _id: '$users' } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'users' } },
        { $project: { password: 0, deleted: 0, friends: 0, __v: 0 } },
        { $unwind: '$users' },
        { $replaceRoot: { newRoot: '$users' } },
      ]),
      FriendshipModel.findById(userId),
      FriendRequestModel.find({
        sender_id: userId,
      }),
      FriendRequestModel.find({
        receiver_id: userId,
      }),
    ]);

    // const userFind = await UserModel.find({
    //   $and: [
    //     {
    //       $or: [{ _id: { $eq: keyword } }, { name: { $regex: keyword, $options: 'i' } }],
    //     },
    //     { _id: { $ne: userId } },
    //   ],
    // }).select('name avatar');

    // Lấy danh sách bạn bè của người dùng hiện tại
    // const user = await FriendshipModel.findById(userId);
    const userFriendIds = new Set(user?.friends.map((friend) => friend.toString()) || []);
    // const sendRequestAddFriend = await FriendRequestModel.find({
    //   sender_id: userId,
    // });
    // const waitResponseAddFriend = await FriendRequestModel.find({
    //   receiver_id: userId,
    // });

    // Thêm thuộc tính isFriend vào từng user trong danh sách tìm được
    // const usersWithFriendStatus = userFind.map((user) => ({
    //   ...user.toObject(),
    //   isFriend: userFriendIds.has(user._id),
    // }));
    const usersWithFriendStatusPromise = userFind.map(async (user) => {
      // status: 0: không phải là bạn bè, 1: đã là bạn bè, 2: đã gửi yêu cầu kết bạn, 3: được gửi yêu cầu kết bạn
      let status = 0;
      if (userFriendIds.has(user._id)) {
        status = 1;
      } else if (sendRequestAddFriend.some((u) => u.receiver_id === user._id)) {
        status = 2;
      } else if (waitResponseAddFriend.some((u) => u.sender_id === user._id)) {
        status = 3;
      } else {
        status = 0;
      }

      if (status) return Promise.resolve(null);

      const commonGroupCount = await ConversationModel.calculateAmountGroup(userId, user._id);

      return { ...user, status, commonGroupCount };
    });
    const usersWithFriendStatus = await Promise.all(usersWithFriendStatusPromise);
    return usersWithFriendStatus.filter(Boolean);
  } catch (error) {
    throw httpErrors.BadRequest('Something went wrong. Please try again later.');
  }
};

module.exports = {
  findUserByIdService,
  findUserByContactOrNameRegex,
  findUserById,
  updateAvatarURL,
  sendFriendRequestService,
  deleteFriendById,
  getFriendListSortedByName,
  updateUserInfoService,
  acceptFriendRequestService,
  rejectriendRequestService,
  listRequestFriendService,
  revocationRequestFriendService,
  getListFriendService,
  listRequestfriendWaitResponeService,
  getListRecommendFriendService,
  isFriendsService,
  getSuggestFriendsService,
};
