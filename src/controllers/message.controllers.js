const { request, response } = require('express');
const { StatusCodes } = require('http-status-codes');
const {
  createMessage,
  messagePopulate,
  getConversationMessage,
  getReplyMessages: getReplyMessagesService,
} = require('../services/message.service');
const { updateLastMessage } = require('../services/conversation.service');

const sendMessage = async (req = request, resp = response, next) => {
  try {
    const userId = req.user.userId;
    const { messages, files, conversationId, reply, sticker } = req.body;
    if ((!messages && files) || !conversationId) {
      return resp
        .status(StatusCodes.BAD_REQUEST)
        .json('Please provide a conversationId and message');
    }

    const messageData = {
      sender: userId,
      messages: messages || [],
      conversation: conversationId,
      files: files || [],
      reply,
      sticker,
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
    const messageId = req.query.messageId;
    const conversationId = req.params.conversationId;
    const message = await getConversationMessage(conversationId, messageId);
    resp.status(StatusCodes.OK).json(message);
  } catch (error) {
    next(error);
  }
};

const getReplyMessages = async (req = request, resp = response, next) => {
  try {
    const { replyId } = req.params;

    const replyMessages = await getReplyMessagesService(replyId);

    resp.status(StatusCodes.OK).json(replyMessages);
  } catch (error) {
    console.error(error);

    next(error);
  }
};

module.exports = { sendMessage, getMessage, getReplyMessages };
