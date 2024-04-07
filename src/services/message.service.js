const createHttpError = require('http-errors');
const { MessageModel } = require('../models/message.model');
const { ConversationModel } = require('../models/conversation.model');
const createMessage = async (messageData) => {
  let messageSaved = await MessageModel.create(messageData);
  if (!messageSaved) {
    throw createHttpError.InternalServerError('Something wrong, pls Try again later');
  }
  return messageSaved;
};
const messagePopulate = async (id) => {
  let message = await MessageModel.findById(id)
    .populate({
      path: 'sender',
      select: 'name avatar',
      model: 'UserModel',
    })
    .populate({
      path: 'conversation',
      select: 'name isGroup users',
      model: 'ConversationModel',
      populate: {
        path: 'users',
        select: 'name avatar status',
        model: 'UserModel',
      },
    })
    .populate({
      path: 'reply',
      select: 'sender messages files sticker statuses deleted',
      model: 'MessageModel',
      populate: {
        path: 'sender',
        select: 'name avatar',
        model: 'UserModel',
      },
    })
    .populate('location');
  if (!message) {
    throw createHttpError.BadRequest('Something wrong, pls Try again later');
  }
  return message;
};

const getConversationMessage = async (conversationId, messageId) => {
  const filter = [{ conversation: conversationId }];

  if (messageId) filter.push({ _id: { $lt: messageId } });

  const message = await MessageModel.find({
    $and: filter,
  })
    .populate('sender', 'name avatar')
    .populate('reply', 'sender messages files')
    .populate({
      path: 'reply',
      populate: {
        path: 'sender',
        select: 'name avatar',
      },
    })
    .populate({
      path: 'conversation',
      select: 'pinnedMessages _id ',
      model: 'ConversationModel',
      populate: {
        path: 'pinnedMessages',
        select: 'sender messages files sticker -_id',
        populate: {
          path: 'sender',
          select: 'name',
          model: 'UserModel',
        },
      },
    })
    .sort({ createdAt: -1 })
    .limit(process.env.MESSAGE_PER_PAGE);
  if (!message) {
    throw createHttpError.NotFound('conversationId is not contain');
  }
  return message;
};

const getReplyMessages = async (replyId) => {
  const messages = await MessageModel.find({ _id: { $gte: replyId } })
    .populate('sender', 'name avatar')
    .populate('reply', 'sender messages files')
    .populate({
      path: 'reply',
      populate: {
        path: 'sender',
        select: 'name avatar',
      },
    })
    .sort({ createdAt: -1 });

  if (!messages) throw createHttpError.BadRequest('messageId is not contain');

  return messages;
};

const deleteMessageForMeService = async (sender, messageId) => {
  let notFound;
  try {
    const messageDelete = await MessageModel.findOneAndUpdate(
      { sender, _id: messageId, deleted: '0' },
      { $set: { deleted: '1' } }
    );
    if (!messageDelete) {
      notFound = createHttpError.BadRequest(
        'senderId or messageId not found or message have been deleted'
      );
      throw notFound;
    }
    return true;
  } catch (error) {
    if (notFound) {
      throw notFound;
    }
    throw createHttpError.InternalServerError('Delete message something wrong', error);
  }
};

const deleteMessageAllService = async (sender, messageId) => {
  let notFound;
  try {
    const messageDelete = await MessageModel.findOneAndUpdate(
      { sender, _id: messageId, deleted: { $ne: '2' } },
      { $set: { deleted: '2' } }
    );

    if (!messageDelete) {
      notFound = createHttpError.BadRequest(
        'senderId or messageId not found or message have been deleted'
      );
      throw notFound;
    }
    return true;
  } catch (error) {
    if (notFound) {
      throw notFound;
    }
    throw createHttpError.InternalServerError('Delete message something wrong', error);
  }
};

const setPinMesssageService = async (messageId) => {
  try {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return false;
    }

    const conversation = await ConversationModel.findOne({ _id: message.conversation });

    if (conversation) {
      if (conversation.pinnedMessages.length >= 3) {
        conversation.pinnedMessages.pop();
      }
      conversation.pinnedMessages.unshift(message);
      await conversation.save();

      return conversation;
    } else {
      throw createHttpError.NotFound('Conversation not found');
    }
  } catch (error) {
    throw createHttpError.InternalServerError('Pin message something wrong', error);
  }
};

const unPinMessageService = async (messageId) => {
  try {
    const message = await MessageModel.findById(messageId);
    const conversation = await ConversationModel.findOneAndUpdate(
      { _id: message.conversation },
      { $pull: { pinnedMessages: message._id } },
      { new: true }
    );
    if (!conversation) {
      throw createHttpError.NotFound('Message', messageId, ' have not pin');
    }
    return true;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    throw createHttpError.InternalServerError('Pin message something wrong', error);
  }
};

const reactForMessageService = async (messageId) => {
  try {
    const existingMessage = await MessageModel.findById(messageId);
    if (!existingMessage) {
      throw createHttpError.BadRequest('Message not found');
    }

    const existingStatusIndex = existingMessage.statuses.findIndex(
      (status) => status.user === userReact
    );

    if (react !== undefined && react !== null) {
      if (existingStatusIndex === -1) {
        existingMessage.statuses.push({
          user: userReact,
          react: react,
        });
      } else {
        existingMessage.statuses[existingStatusIndex].react = react;
      }
    } else {
      if (existingStatusIndex !== -1) {
        existingMessage.statuses.splice(existingStatusIndex, 1);
      }
    }
    const updatedMessage = await existingMessage.save();
    return updatedMessage;
  } catch (error) {
    throw createHttpError.InternalServerError(
      `reactForMessageService encountered an error ${error}`
    );
  }
};

module.exports = {
  createMessage,
  messagePopulate,
  getConversationMessage,
  getReplyMessages,
  deleteMessageForMeService,
  deleteMessageAllService,
  setPinMesssageService,
  unPinMessageService,
  reactForMessageService,
};
