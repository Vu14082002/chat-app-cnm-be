const createHttpError = require('http-errors');
const { MessageModel } = require('../models/message.model');

const createMessage = async (messageData) => {
  let messageSaved = await MessageModel.create(messageData);
  if (!messageSaved) {
    throw createHttpError.BadRequest('Something wrong, pls Try again later');
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
    });
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
    .sort({ createdAt: -1 })
    .limit(process.env.MESSAGE_PER_PAGE);
  if (!message) {
    throw createHttpError.BadRequest('conversationId is not contain');
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

module.exports = {
  createMessage,
  messagePopulate,
  getConversationMessage,
  getReplyMessages,
  deleteMessageForMeService,
  deleteMessageAllService,
};
