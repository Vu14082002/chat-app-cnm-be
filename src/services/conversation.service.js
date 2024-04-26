const createHttpError = require('http-errors');
const { ConversationModel } = require('../models/conversation.model');
const { UserModel } = require('../models/user.model');
const httpErrors = require('http-errors');

const checkExistConversation = async (senderUserId, receiverUserId) => {
  let conversationList = await ConversationModel.findOne({
    isGroup: false,
    users: { $all: [senderUserId, receiverUserId] },
  })
    .populate('users', ['-password', '-deleted'])
    .populate('lastMessage')
    .populate({
      path: 'pinnedMessages',
      populate: {
        path: 'sender',
        select: 'name avatar',
      },
    });
  if (!conversationList) {
    return null;
  }

  conversationList = await UserModel.populate(conversationList, {
    path: 'lastMessage.sender',
    select: 'name avatar status',
  });
  // return conversationList[0];
  // const commonGroupCount = await ConversationModel.calculateAmountGroup(
  //   senderUserId,
  //   receiverUserId
  // );
  // return {
  //   conversationList,
  //   commonGroupCount,
  // };
  return conversationList;
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

const getDetailConversations = async ({ query = {}, userId }) => {
  let conversations = await ConversationModel.find(query).populate('users', [
    '-password',
    '-qrCode',
    '-background',
    '-dateOfBirth',
    '-createdAt',
    '-updatedAt',
  ]);

  conversations = conversations.map((conversation) => {
    const detail = conversation.details.find((detail) => detail.userId === userId);
    if (!detail)
      return {
        ...conversation.toObject(),
        unreadMessageCount: 0,
        lastMessage: null,
      };

    const result = {
      ...conversation.toObject(),
      lastMessage: detail.lastMessage,
      unreadMessageCount: detail.unreadMessageCount,
      deletedAt: detail.deletedAt,
    };

    delete result.details;
    delete result.deletedAt;

    return result;
  });

  conversations = await ConversationModel.populate(conversations, [
    {
      path: 'lastMessage',
    },
    {
      path: 'lastMessage.sender',
      select: 'name avatar',
    },
    {
      path: 'pinnedMessages',
    },
    {
      path: 'pinnedMessages.sender',
      select: 'name avatar',
    },
  ]);

  // Sắp xếp danh sách cuộc trò chuyện dựa trên trường pinBy và updatedAt
  conversations.sort((a, b) => {
    const userAPinned = a.pinBy.includes(userId);
    const userBPinned = b.pinBy.includes(userId);
    if (userAPinned && userBPinned) {
      if (!b.lastMessage || !a.lastMessage) return b.updatedAt - a.updatedAt;
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
  conversations = conversations.filter((conv) => !conv.deleted);
  conversations = await UserModel.populate(
    conversations,
    {
      path: 'lastMessage.sender',
      select: 'name avatar status',
    },
    {
      path: 'lastMessage.notification.users',
      select: 'name avatar',
      model: 'UserModel',
    },
    {
      path: 'lastMessage.notification.conversations',
      select: 'name isGroup users',
      model: 'ConversationModel',
    },
    {
      path: 'lastMessage.notification.message',
      select: 'sender messages files sticker statuses deleted',
      model: 'MessageModel',
      populate: {
        path: 'sender',
        select: 'name avatar',
        model: 'UserModel',
      },
    }
  );
  return conversations;
};

const getListUserConversations = async (userId) => {
  try {
    const conversationList = await getDetailConversations({
      query: {
        $and: [{ users: { $elemMatch: { $eq: userId } } }, { deleted: false }],
      },
      userId,
    });

    return conversationList;
  } catch (error) {
    console.error(error);

    throw httpErrors.InternalServerError(`getListUserConversations from server error${error}`);
  }
};
// get conversation group where user is member
const getGroupsService = async (userId) => {
  try {
    return await getDetailConversations({
      query: {
        $and: [{ users: { $elemMatch: { $eq: userId } } }, { isGroup: true }, { deleted: false }],
      },
      userId,
    });
  } catch (error) {
    throw httpErrors.InternalServerError(`getListUserConversations from server error${error}`);
  }
};

const getConversationService = async (conversationId, userId = '') => {
  try {
    let conversation = await ConversationModel.findById(conversationId).populate('users', [
      '-password',
      '-qrCode',
      '-background',
      '-dateOfBirth',
      '-createdAt',
      '-updatedAt',
    ]);

    if (conversation.deleted === true) {
      throw createHttpError.NotFound('Conversation not found');
    }

    const detail = conversation.details.find((detail) => detail.userId === userId);
    if (!detail)
      return {
        ...conversation.toObject(),
        unreadMessageCount: 0,
      };

    const result = {
      ...conversation.toObject(),
      lastMessage: detail.lastMessage,
      unreadMessageCount: detail.unreadMessageCount,
      deletedAt: detail.deletedAt,
    };

    delete result.details;
    delete result.deletedAt;

    conversation = result;

    conversation = await ConversationModel.populate(conversation, [
      {
        path: 'lastMessage',
      },
      {
        path: 'lastMessage.sender',
        select: 'name avatar',
      },
      {
        path: 'pinnedMessages',
      },
      {
        path: 'pinnedMessages.sender',
        select: 'name avatar',
      },
      {
        path: 'lastMessage.notification.users',
        select: 'name avatar',
        model: 'UserModel',
      },
      {
        path: 'lastMessage.notification.conversations',
        select: 'name isGroup users',
        model: 'ConversationModel',
      },
      {
        path: 'lastMessage.notification.message',
        select: 'sender messages files sticker statuses deleted',
        model: 'MessageModel',
        populate: {
          path: 'sender',
          select: 'name avatar',
          model: 'UserModel',
        },
      },
    ]);

    conversation = await UserModel.populate(conversation, {
      path: 'lastMessage.sender',
      select: 'name avatar status',
    });
    return conversation;
  } catch (error) {
    console.error(error);
    throw httpErrors.InternalServerError(`getListUserConversations from server error${error}`);
  }
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

const updateConversationDetailsService = async ({
  conversationId,
  lastMessageId,
  senderId,
  userId,
  type,
}) => {
  try {
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      throw createHttpError.NotFound('Invalid conversation');
    }

    if (conversation.users.length !== conversation.details.length) {
      conversation.users.forEach((userId) => {
        if (!conversation.details.find((detail) => detail.userId === userId)) {
          conversation.details.push({
            userId,
            lastMessage: '',
            unreadMessageCount: 0,
          });
        }
      });
    }

    if (type.startsWith('ADD_MESSAGE')) {
      conversation.details.forEach((detail) => {
        detail.lastMessage = lastMessageId;

        if (type === 'ADD_MESSAGE') {
          if (detail.userId !== senderId) {
            detail.unreadMessageCount = detail.unreadMessageCount + 1;
          } else {
            detail.unreadMessageCount = 0;
          }
        }
      });
    } else if (type === 'GET_MESSAGE') {
      const detail = conversation.details.find((detail) => detail.userId === userId);
      if (detail) {
        detail.unreadMessageCount = 0;
      }
    } else if (type === 'DELETE_MESSAGE_FOR_ME') {
      const detail = conversation.details.find((detail) => detail.userId === userId);

      if (detail) {
        detail.lastMessage = lastMessageId;
      }
    } else if (type === 'DELETE_CONVERSATION') {
      const detail = conversation.details.find((detail) => detail.userId === userId);
      if (detail) {
        detail.unreadMessageCount = 0;
        detail.deletedAt = new Date();
        detail.lastMessage = null;
      }
    } else {
      throw createHttpError.BadRequest('Invalid type');
    }

    await conversation.save();
  } catch (error) {
    console.error(error);

    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to update conversation details', error);
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

const deleteConversationService = async (conversationId, userId) => {
  try {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw createHttpError.NotFound('Invalid conversation');
    const admin = conversation.admin;
    if (userId !== admin)
      throw createHttpError.Forbidden('You are not allowed to delete this conversation');
    conversation.deleted = true;
    await conversation.save();
    // const conversation = await ConversationModel.findByIdAndUpdate(conversationId, {
    //   deleted: true,
    // });
    return conversation;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    if (error instanceof createHttpError.Forbidden) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to delete conversation', error);
  }
};

const addUsersService = async ({ conversationId, userIds, lastMessage }) => {
  try {
    const conversation = await ConversationModel.findByIdAndUpdate(conversationId, {
      $addToSet: { users: userIds },
      $push: {
        details: { $each: userIds.map((userId) => ({ userId, lastMessage: lastMessage?._id })) },
      },
    });
    if (!conversation) throw createHttpError.NotFound('Invalid conversation');

    return conversation;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to add users to conversation', error);
  }
};

const removeUserService = async ({ userId, conversationId, removeUser, blockRejoin }) => {
  try {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw createHttpError.NotFound('Invalid conversation');
    if (conversation.admin !== userId && !conversation.deputy.includes(userId))
      throw createHttpError.Forbidden(
        `You are not allowed to remove user ${removeUser} from this conversation`
      );
    if (conversation.admin === removeUser) {
      throw createHttpError.Forbidden('You cannot remove the owner of the conversation');
    }
    conversation.users.pull(removeUser);
    conversation.deputy.pull(removeUser);
    conversation.details = conversation.details.filter((detail) => detail.userId !== removeUser);
    if (blockRejoin === 'true') {
      conversation.blockRejoin.push(removeUser);
    }
    await conversation.save();
    return conversation;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    if (error instanceof createHttpError.Forbidden) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to remove user from conversation', error);
  }
};

const leaveGroupService = async ({ userId, conversationId }) => {
  try {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw createHttpError.NotFound('Invalid conversation');
    if (conversation.admin === userId) {
      throw createHttpError.Forbidden('You cannot remove the owner of the conversation');
    }
    conversation.users.pull(userId);
    conversation.deputy.pull(userId);
    conversation.details = conversation.details.filter((detail) => detail.userId !== userId);
    await conversation.save();
    return conversation;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    if (error instanceof createHttpError.Forbidden) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to remove user from conversation', error);
  }
};

const setOwnerRoleService = async ({ conversationId, userId }) => {
  try {
    const conversation = await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        admin: userId,
      },
    });
    if (!conversation) throw createHttpError.NotFound('Invalid conversation');

    return conversation;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    throw createHttpError.InternalServerError('Failed to set owner role', error);
  }
};

const addAdminRole = async ({ conversationId, userId }) => {
  try {
    const conversation = await ConversationModel.findByIdAndUpdate(conversationId, {
      $addToSet: { deputy: userId },
    });

    if (!conversation) throw createHttpError.NotFound('Invalid conversation');

    return conversation;
  } catch (error) {
    throw createHttpError.InternalServerError('Failed to add admin role', error);
  }
};

const removeAdminRole = async ({ conversationId, userId }) => {
  try {
    const conversation = await ConversationModel.findByIdAndUpdate(conversationId, {
      $pull: { deputy: userId },
    });

    if (!conversation) throw createHttpError.NotFound('Invalid conversation');

    return conversation;
  } catch (error) {
    throw createHttpError.InternalServerError('Failed to remove admin role', error);
  }
};

module.exports = {
  checkExistConversation,
  createConversation,
  populateConversation,
  getListUserConversations,
  updateLastMessage,
  pinConversationService,
  getGroupsService,
  deleteConversationService,
  addUsersService,
  getConversationService,
  removeUserService,
  setOwnerRoleService,
  addAdminRole,
  removeAdminRole,
  leaveGroupService,
  updateConversationDetailsService,
};
