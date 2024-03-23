const { request, response } = require('express');
const createHttpError = require('http-errors');
const { StatusCodes } = require('http-status-codes');
const {
     createMessage,
     messagePopulate,
     getConversationMessage,
} = require('../services/message.service');
const { updateLastMessage } = require('../services/conversation.service');
const { getConversations } = require('./conversation.controllers');

const sendMessage = async (req = request, resp = response, next) => {
     try {
          const userId = req.user.userId;
          const { message, files, conversationId } = req.body;
          if ((!message && files) || !conversationId) {
               resp.status(StatusCodes.BAD_REQUEST).json(
                    'Please provide a conversationId and message'
               );
          }

          const messageData = {
               sender: userId,
               message,
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
          const conversationId = req.params.conversationId;
          const message = await getConversationMessage(conversationId);
          resp.status(StatusCodes.OK).json(message);
     } catch (error) {
          next(error);
     }
};

module.exports = { sendMessage, getMessage };
