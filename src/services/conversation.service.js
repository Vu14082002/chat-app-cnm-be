const createHttpError = require('http-errors');
const { ConversationModel } = require('../models/conversation.model');
const { UserModel } = require('../models/user.model');

const checkExistConversation = async (senderUserId, receiverUserId) => {
  let conversationList = await ConversationModel.findOne({
    isGroup: false,
    $and: [
      { users: { $elemMatch: { $eq: senderUserId } } },
      { users: { $elemMatch: { $eq: receiverUserId } } },
    ],
  })
    .populate('users', '-password')
    .populate('lastMessage');
  if (!conversationList) {
    return null;
  }
  conversationList = await UserModel.populate(conversationList, {
    path: 'lastMessage.sender',
    select: 'name avatar status',
  });
  return conversationList[0];
};

const createConversation = async (data) => {
  const conversationSaved = await ConversationModel.create(data);
  if (!conversationSaved) {
    throw createHttpError.BadRequest('Some thing wrong, Try agian');
  }
  return conversationSaved;
};
const populateConversation = async (conversationId, field, fieldRemove) => {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
  }).populate(field, fieldRemove);
  if (!conversation) {
    throw createHttpError.BadRequest('Some thing wrong, Try agian');
  }
  return conversation;
};

const getListUserConversations = async (userId) => {
  let conversations;
  try {
    conversations = await ConversationModel.find({
      users: { $elemMatch: { $eq: userId } },
    })
      .populate('users', [
        '-password',
        '-qrCode',
        '-background',
        '-dateOfBirth',
        '-createdAt',
        '-updatedAt',
      ])
      .populate('admin', [
        '-password',
        '-qrCode',
        '-background',
        '-dateOfBirth',
        '-createdAt',
        '-updatedAt',
      ])
      .populate('lastMessage');

    // Sắp xếp danh sách cuộc trò chuyện dựa trên trường pinBy và updatedAt
    conversations.sort((a, b) => {
      const userAPinned = a.pinBy.includes(userId);
      const userBPinned = b.pinBy.includes(userId);

      if (userAPinned === userBPinned) {
        return b.updatedAt - a.updatedAt;
      }

      return userBPinned - userAPinned;
    });

    conversations = conversations.filter((conv) => conv.delete !== false);

    conversations = await UserModel.populate(conversations, {
      path: 'lastMessage.sender',
      select: 'name avatar status',
    });
  } catch (error) {
    console.error(error);
    throw createHttpError.BadRequest('From getListUserConversations method');
  }
  return conversations;
};

const updateLastMessage = async (conversationId, message) => {
  try {
    const conversationUpdated = await ConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: message,
    });
    if (!conversationUpdated) {
      throw createHttpError.BadRequest('Something wrong, pls Try again later');
    }
    return conversationUpdated;
  } catch (error) {
    throw createHttpError.InternalServerError('updateLastMessage error, Try later');
  }
};

const pinConversationService = async ({ conversationId, userId }) => {
  try {
    const updatedConversation = await ConversationModel.findOneAndUpdate(
      { _id: conversationId, users: { $in: [userId] }, pinBy: { $nin: [userId] } },
      { $addToSet: { pinBy: userId } },
      { new: true }
    );
    if (!updatedConversation) {
      throw createHttpError.BadRequest('Invalid conversation or user is already pinned');
    }
    return true;
  } catch (error) {
    console.error(error);
    throw createHttpError.InternalServerError('Failed to pin conversation', error);
  }
};

module.exports = {
  checkExistConversation,
  createConversation,
  populateConversation,
  getListUserConversations,
  updateLastMessage,
  pinConversationService,
};
