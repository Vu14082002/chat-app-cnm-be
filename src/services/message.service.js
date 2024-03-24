const createHttpError = require('http-errors');
const { MessageModel } = require('../models/message.model');

const createMessage = async (messageData) => {
     let messageSaved = await MessageModel.create(messageData);
     if (!messageSaved) {
          throw createHttpError.BadRequest(
               'Something wrong, pls Try again later'
          );
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
          });
     if (!message) {
          throw createHttpError.BadRequest(
               'Something wrong, pls Try again later'
          );
     }
     return message;
};

const getConversationMessage = async (conversationId) => {
     const message = await MessageModel.find({
          conversation: conversationId,
     }).populate('sender', 'name avatar status');
     if (!message) {
          throw createHttpError.BadRequest('conversationId is not contain');
     }
     return message;
};

module.exports = { createMessage, messagePopulate, getConversationMessage };