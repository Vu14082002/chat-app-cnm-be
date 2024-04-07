const createHttpError = require('http-errors');
const { ConversationModel } = require('../models/conversation.model');
const { UserModel } = require('../models/user.model');
const httpErrors = require('http-errors');

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
      if (userAPinned && userBPinned) {
        return b.lastMessage.updatedAt - a.lastMessage.updatedAt;
      } else if (userAPinned) {
        return -1;
      } else if (userBPinned) {
        return 1;
      } else {
        if (!b.lastMessage || !a.lastMessage) return b.updatedAt - a.updatedAt;

        return b.lastMessage.updatedAt - a.lastMessage.updatedAt;
      }
    });
    conversations = conversations.filter((conv) => conv.delete !== false);
    conversations = await UserModel.populate(conversations, {
      path: 'lastMessage.sender',
      select: 'name avatar status',
    });
  } catch (error) {
    throw httpErrors.InternalServerError(`getListUserConversations from server error${error}`);
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
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError.NotFound('Invalid conversation');
    }
    const pinIndex = conversation.pinBy.indexOf(userId);
    if (pinIndex === -1) {
      await ConversationModel.findByIdAndUpdate(conversationId, { $addToSet: { pinBy: userId } });
    } else {
      await ConversationModel.findByIdAndUpdate(conversationId, { $pull: { pinBy: userId } });
    }
    return true;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to unpin conversation', error);
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
