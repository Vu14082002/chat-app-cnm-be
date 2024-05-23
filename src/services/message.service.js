const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const { MessageModel } = require('../models/message.model');
const { ConversationModel } = require('../models/conversation.model');
const { updateLastMessage } = require('./conversation.service');
const { messageNotificationType } = require('../constants');
const createMessage = async (messageData) => {
  let messageSaved = await MessageModel.create(messageData);
  if (!messageSaved) {
    throw createHttpError.InternalServerError('Something wrong, pls Try again later');
  }
  return messageSaved;
};

const getMessageDetailChain = ({ query = {} }) => {
  return MessageModel.find(query)
    .populate('sender', 'name avatar')
    .populate({
      path: 'reply',
      select: 'sender messages files sticker statuses deleted',
      populate: {
        path: 'sender',
        select: 'name avatar',
      },
    })
    .populate({
      path: 'conversation',
      select: 'name isGroup users',
      model: 'ConversationModel',
      populate: {
        path: 'users',
        select: 'name avatar',
        model: 'UserModel',
      },
    })
    .populate({
      path: 'notification.users',
      select: 'name avatar',
      model: 'UserModel',
    })
    .populate({
      path: 'notification.conversations',
      select: 'name isGroup users',
      model: 'ConversationModel',
      populate: {
        path: 'users',
        select: 'name avatar',
        model: 'UserModel',
      },
    })
    .populate({
      path: 'notification.message',
      select: 'sender messages files sticker statuses deleted location',
      model: 'MessageModel',
      populate: {
        path: 'sender',
        select: 'name avatar',
        model: 'UserModel',
      },
    });
};

const messagePopulate = async (id) => {
  let message = await getMessageDetailChain({ query: { _id: id } });
  if (!message?.length) {
    throw createHttpError.BadRequest('Something wrong, pls Try again later');
  }
  return message[0];
};

const messageNotificationPopulate = async (id) => {
  const messages = await getMessageDetailChain({ query: { _id: id } });

  if (!messages?.length) throw createHttpError.BadRequest('Something wrong, pls Try again later');

  return messages[0];
};

// TODO Không lấy message notification có type là REMOVE_USER, LEAVE_GROUP của chính mình
const getConversationMessage = async (conversationId, messageId, userId) => {
  const filter = [{ conversation: conversationId }];

  const conversation = await ConversationModel.findById(conversationId);

  if (!conversation) {
    throw createHttpError.NotFound('conversationId is not contain');
  }

  const detail = conversation.details.find((item) => item.userId === userId);

  if (detail?.deletedAt) {
    filter.push({
      createdAt: {
        $gte: detail.deletedAt,
      },
    });
  }

  if (messageId) filter.push({ _id: { $lt: messageId } });
  filter.push({ 'usersDeleted.user': { $nin: [userId] } });
  const messages = await getMessageDetailChain({
    query: {
      $and: filter,
    },
  })
    .sort({ createdAt: -1 })
    .limit(process.env.MESSAGE_PER_PAGE);

  if (!messages) {
    throw createHttpError.NotFound('conversationId is not contain');
  }
  return messages;
};

const getReplyMessages = async (conversationId, replyId, userId) => {
  const messages = await getMessageDetailChain({
    query: {
      $and: [
        { _id: { $gte: replyId } },
        { conversation: conversationId },
        { 'usersDeleted.user': { $nin: [userId] } },
      ],
    },
  }).sort({ createdAt: -1 });

  if (!messages) throw createHttpError.BadRequest('messageId is not contain');

  return messages;
};
// :) tự hiểu
// const deleteMessageForMeService = async (sender, messageId) => {
//   let notFound;
//   try {
//     const messageDelete = await MessageModel.findOneAndUpdate(
//       { sender, _id: messageId, deleted: '0' },
//       { $set: { deleted: '1' } }
//     );
//     if (!messageDelete) {
//       notFound = createHttpError.BadRequest(
//         'senderId or messageId not found or message have been deleted'
//       );
//       throw notFound;
//     }
//     return true;
//   } catch (error) {
//     if (notFound) {
//       throw notFound;
//     }
//     throw createHttpError.InternalServerError('Delete message something wrong', error);
//   }
// };
const deleteMessageForMeService = async (userId, messageId) => {
  try {
    const updatedMessage = await MessageModel.findOneAndUpdate(
      { _id: messageId, 'usersDeleted.user': { $ne: userId } },
      { $addToSet: { usersDeleted: { user: userId, deleted: '1' } } },
      { new: true }
    );
    console.log('Vao day nha');
    console.log(updatedMessage);
    if (!updatedMessage) {
      throw createHttpError.NotFound(`Message: ${messageId} not found`);
    }
    return updatedMessage;
  } catch (error) {
    if (error instanceof createHttpError.NotFound) {
      throw error;
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

const setPinMessageService = async (messageId) => {
  try {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return false;
    }

    const conversation = await ConversationModel.findOne({ _id: message.conversation });

    if (conversation) {
      const index = conversation.pinnedMessages.findIndex((item) => item.toString() === messageId);

      if (index !== -1) conversation.pinnedMessages.splice(index, 1);
      else if (conversation.pinnedMessages.length >= 3) conversation.pinnedMessages.pop();

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
    if (!message) {
      throw createHttpError.NotFound(`Message: ${messageId} can not found`);
    }
    const conversation = await ConversationModel.findOneAndUpdate(
      { _id: message.conversation },
      { $pull: { pinnedMessages: message._id } },
      { new: true }
    );
    if (!conversation) {
      throw createHttpError.NotFound(`This Message: ${messageId} have not pin`);
    }
    return true;
  } catch (error) {
    console.log(error);
    if (error instanceof createHttpError.NotFound) {
      throw error;
    }
    throw createHttpError.InternalServerError(`Unpin message something wrong ${error}`);
  }
};

const reactForMessageService = async (react, userId, messageId) => {
  try {
    const existingMessage = await MessageModel.findById(messageId);
    if (!existingMessage) {
      throw createHttpError.BadRequest('Message not found');
    }

    const existingStatusIndex = existingMessage.statuses.findIndex(
      (status) => status.user === userId
    );

    if (react !== undefined && react !== null) {
      if (existingStatusIndex === -1) {
        existingMessage.statuses.push({
          user: userId,
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
    console.error(error);
    throw createHttpError.InternalServerError(
      `reactForMessageService encountered an error ${error}`
    );
  }
};
const forwardMessageService = async (userId, messageId, conversationIds) => {
  const session = await mongoose.startSession({ readPreference: 'primary' });
  session.startTransaction();
  try {
    const message = await MessageModel.findById(messageId).session(session);
    if (!message) throw createHttpError.NotFound(`Message ${messageId} not found`);

    const messageSend = [];

    await Promise.all(
      conversationIds.map(async (conversationId) => {
        const conversation = await ConversationModel.findById(conversationId);
        if (!conversation)
          throw createHttpError.NotFound(`Conversation ${conversationId} not found`);
        const forwardedMessage = await MessageModel.create({
          sender: userId,
          messages: message.messages,
          conversation: conversationId,
          files: message.files,
          location: message.location,
          sticker: message.sticker,
        });
        messageSend.push(forwardedMessage);
        await updateLastMessage(conversationId, forwardedMessage);
      })
    );
    await session.commitTransaction();
    session.endSession();
    return messageSend;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error instanceof createHttpError.NotFound) throw error;
    throw createHttpError.InternalServerError(`forwardMessageService error: ${error.message}`);
  }
};

const getLastMessage = async ({ conversationId, userId }) => {
  try {
    const message = await MessageModel.findOne(
      {
        conversation: conversationId,
        usersDeleted: {
          $not: {
            $elemMatch: { user: userId },
          },
        },
      },
      {},
      { sort: { createdAt: -1 } }
    );

    return message;
  } catch (error) {
    console.log(error);

    throw createHttpError.InternalServerError('Get last message something wrong', error);
  }
};

const addMessageNotificationService = async ({
  senderId,
  userIds,
  conversationId,
  conversations,
  messageId,
  type,
}) => {
  try {
    let message;
    if (
      [
        messageNotificationType.REMOVE_USER,
        messageNotificationType.ADD_USERS,
        messageNotificationType.ADD_ADMIN,
        messageNotificationType.REMOVE_ADMIN,
        messageNotificationType.CHANGE_OWNER,
        messageNotificationType.CREATE_GROUP,
      ].includes(type)
    ) {
      message = new MessageModel({
        sender: senderId,
        conversation: conversationId,
        notification: {
          users: userIds,
          type,
        },
      });
    } else if (
      [
        messageNotificationType.PUBLIC_GROUP,
        messageNotificationType.PRIVATE_GROUP,
        messageNotificationType.ACCEPT_FRIEND,
        messageNotificationType.LEAVE_GROUP,
      ].includes(type)
    ) {
      message = new MessageModel({
        sender: senderId,
        conversation: conversationId,
        notification: {
          type,
        },
      });
    } else if ([messageNotificationType.INVITE_TO_GROUP].includes(type)) {
      message = new MessageModel({
        sender: senderId,
        conversation: conversationId,
        notification: {
          type,
          conversations,
          users: userIds,
        },
      });
    } else if (
      [messageNotificationType.PIN_MESSAGE, messageNotificationType.UNPIN_MESSAGE].includes(type)
    ) {
      message = new MessageModel({
        sender: senderId,
        conversation: conversationId,
        notification: {
          type,
          message: messageId,
        },
      });
    } else throw createHttpError.BadRequest('Type is not correct');

    await message.save();

    return message;
  } catch (error) {
    throw createHttpError.InternalServerError('Add message notification something wrong', error);
  }
};

const getAttachedFilesService = async (conversationId, userId) => {
  try {
    const files = await MessageModel.aggregate([
      {
        $match: {
          conversation: new mongoose.Types.ObjectId(conversationId),
          files: { $exists: true, $ne: [] },
          deleted: '0',
          usersDeleted: {
            $not: {
              $elemMatch: { user: userId },
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $unwind: '$files',
      },
      {
        $replaceRoot: { newRoot: '$files' },
      },
    ]);

    return files;
  } catch (error) {
    console.log(error);

    throw createHttpError.InternalServerError('Get attached files something wrong', error);
  }
};

module.exports = {
  createMessage,
  messagePopulate,
  getConversationMessage,
  getReplyMessages,
  deleteMessageForMeService,
  deleteMessageAllService,
  setPinMessageService,
  unPinMessageService,
  reactForMessageService,
  forwardMessageService,
  getLastMessage,
  addMessageNotificationService,
  messageNotificationPopulate,
  getAttachedFilesService,
};
