const { request, response } = require('express');
const { StatusCodes } = require('http-status-codes');
const { createMessage, messagePopulate, getConversationMessage } = require('../services/message.service');
const { updateLastMessage } = require('../services/conversation.service');

const sendMessage = async (req = request, resp = response, next) => {
     try {
          const userId = req.user.userId;
          const { messages, files, conversationId } = req.body;
          if ((!messages && files) || !conversationId) {
               resp.status(StatusCodes.BAD_REQUEST).json('Please provide a conversationId and message');
          }

          const messageData = {
               sender: userId,
               messages,
               conversation: conversationId,
               files: files || [],
          };
          const messageSaved = await createMessage(messageData);
          const messagepopo = await messagePopulate(messageSaved._id);
          await updateLastMessage(conversationId, messageSaved);
          resp.status(StatusCodes.OK).json(messagepopo);
     } catch (error) {
          next(error);
     }
};
const getMessage = async (req = request, resp = response, next) => {
     try {
          const page = +req.query.page || 1;
          const size = +req.query.size || 20;
          const conversationId = req.params.conversationId;
          const message = await getConversationMessage(conversationId, page, size);
          resp.status(StatusCodes.OK).json(message);
     } catch (error) {
          next(error);
     }
};

module.exports = { sendMessage, getMessage };
