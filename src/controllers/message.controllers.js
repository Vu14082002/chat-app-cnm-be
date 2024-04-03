const { request, response } = require('express');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const {
  createMessage,
  messagePopulate,
  getConversationMessage,
  getReplyMessages: getReplyMessagesService,
} = require('../services/message.service');
const { updateLastMessage } = require('../services/conversation.service');
const { uploadToS3 } = require('../helpers/uploadToS3.helper');
const { convertToBinary } = require('../helpers/converFile');
const { checkValidImg } = require('../helpers/checkValidImg');

const sendMessage = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { messages, conversationId, reply, sticker } = req.body;
    const files = req.files;
    const failedUploads = [];
    const successfulUploads = [];
    const invalidFiles = [];

    if (![messages?.length, sticker, files?.length].some(Boolean) || !conversationId) {
      return resp
        .status(StatusCodes.BAD_REQUEST)
        .json('Please provide a conversationId and message or file');
    }
    if (files && req.files.length > 0) {
      for (const file of files) {
        try {
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
          const uploadedFile = await uploadToS3(file);
          const fileExtension = uploadedFile.split('.').pop().toLowerCase();
          if (imageExtensions.includes(fileExtension)) {
            const checkImg = await checkValidImg(uploadedFile);
            if (!checkImg) {
              invalidFiles.push(file.originalname);
            } else {
              successfulUploads.push(uploadedFile);
            }
          } else {
            successfulUploads.push(uploadedFile);
          }
        } catch (error) {
          // TODO: conver to binary và check chua lam
          // try {
          //   const dataUri = await convertToBinary(file);
          //   successfulUploads.push(dataUri);
          // } catch (error) {
          //   console.error('Error occurred while converting file to Binary:', error);
          //   failedUploads.push(file.originalname);
          // }
        }
      }
    }
    const messageData = {
      sender: userId,
      messages: messages || [],
      conversation: conversationId,
      files: successfulUploads || [],
      reply,
      sticker,
    };
    const messageSaved = await createMessage(messageData);
    const message = await messagePopulate(messageSaved._id);
    await updateLastMessage(conversationId, messageSaved);
    resp.status(StatusCodes.OK).json({ message, invalidFiles, failedUploads });
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
