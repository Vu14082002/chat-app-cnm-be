const { request, response } = require('express');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const {
  createMessage,
  messagePopulate,
  getConversationMessage,
  getReplyMessages: getReplyMessagesService,
  deleteMessageForMeService,
  deleteMessageAllService,
  setPinMessageService,
  reactForMessageService,
  unPinMessageService,
  forwardMessageService,
} = require('../services/message.service');
const { updateLastMessage } = require('../services/conversation.service');
const { uploadToS3 } = require('../helpers/uploadToS3.helper');
const { convertToBinary } = require('../helpers/converFile');
const { checkValidImg } = require('../helpers/checkValidImg');
const { checkMessageHelper } = require('../helpers/checkMessage');
const sendMessage = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { messages: mess, conversationId, reply, sticker, location } = req.body;
    let messages = Array.isArray(mess) ? mess : typeof mess === 'string' ? JSON.parse(mess) : [];
    const files = req.files || [];
    const invalidFiles = [];
    const successfulUploads = [];
    const invalidMessageContent = [];

    if (!conversationId || ![messages?.length, sticker, files.length, location].some(Boolean)) {
      return resp
        .status(StatusCodes.BAD_REQUEST)
        .json('Please provide a conversationId and message or file');
    }

    if (files.length > 0) {
      for (const file of files) {
        try {
          const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
          const uploadedFile = await uploadToS3(file);
          const fileInfo = {
            link: uploadedFile,
            name: file.originalname,
            type: file.mimetype,
          };
          const fileExtension = uploadedFile.split('.').pop().toLowerCase();
          if (imageExtensions.includes(fileExtension)) {
            //FIXME: tắt check img khi nao dung thì bật lên
            // const checkImg = await checkValidImg(uploadedFile);
            const checkImg = true;
            if (!checkImg) {
              invalidFiles.push(file.originalname);
            } else {
              successfulUploads.push(fileInfo);
            }
          } else {
            successfulUploads.push(fileInfo);
          }
        } catch (error) {
          // FIXME: conver to binary và check chua lam
          // try {
          //   const dataUri = await convertToBinary(file);
          //   successfulUploads.push(dataUri);
          // } catch (error) {
          //   console.error('Error occurred while converting file to Binary:', error);
          //   failedUploads.push(file.originalname);
          // }
          next(error);
        }
      }
    }

    let checkValidMessage = true;
    // FIXME: tắt  check chat message
    // if (messages?.length > 0) {
    //   for (const message of messages) {
    //     if (message.type === 'text') {
    //       invalidMessageContent.push(message.content);
    //     }
    //   }
    //   const messageContent = invalidMessageContent.join(' ');
    //   checkValidMessage = await checkMessageHelper(messageContent);
    //   if (!checkValidMessage) {
    //     if (!sticker && !files.length && !location) {
    //       return resp
    //         .status(StatusCodes.OK)
    //         .json({ message: [], invalidFiles, failedUploads: [], invalidMessage: true });
    //     }
    //   }
    // }

    const messageData = {
      sender: userId,
      messages: checkValidMessage && messages?.length > 0 ? messages : [],
      conversation: conversationId,
      files: successfulUploads,
      reply,
      sticker,
      location,
    };
    if (
      messageData.messages.length <= 0 &&
      messageData.files.length <= 0 &&
      !messageData.location &&
      !messageData.sticker
    ) {
      return resp.status(StatusCodes.OK).json({
        // message: [],
        invalidFiles,
        failedUploads: [],
        invalidMessage: !checkValidMessage,
      });
    }
    const messageSaved = await createMessage(messageData);
    await updateLastMessage(conversationId, messageSaved);
    return resp.status(StatusCodes.OK).json({
      message: await messagePopulate(messageSaved._id),
      invalidFiles,
      failedUploads: [],
      invalidMessage: !checkValidMessage,
    });
  } catch (error) {
    next(error);
  }
};

const getMessage = async (req = request, resp = response, next) => {
  try {
    const messageId = req.query.messageId;
    const userId = req.user.userId;
    const conversationId = req.params.conversationId;
    const message = await getConversationMessage(conversationId, messageId, userId);
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
    next(error);
  }
};
// FIXME: Tự hiểu
// const deleteMessageForMe = async (req, resp, next) => {
//   try {
//     const messageId = req.body.messageId;
//     const senderId = req.user.userId;
//     await deleteMessageForMeService(senderId, messageId);
//     resp.status(StatusCodes.OK).json({ message: 'delete success' });
//   } catch (error) {
//     next(error);
//   }
// };
const deleteMessageForMe = async (req, resp, next) => {
  try {
    const messageId = req.body.messageId;
    const senderId = req.user.userId;
    await deleteMessageForMeService(senderId, messageId);
    return resp.status(StatusCodes.OK).json({ message: 'delete success' });
  } catch (error) {
    next(error);
  }
};
const deleteMessageForAll = async (req, resp, next) => {
  try {
    const messageId = req.body.messageId;
    const senderId = req.user.userId;
    await deleteMessageAllService(senderId, messageId);
    return resp.status(StatusCodes.OK).json({ message: 'delete success' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
const pinMessage = async (req, resp, next) => {
  try {
    const messageId = req.params.messageId;
    const pin = await setPinMessageService(messageId);
    if (pin) {
      return resp.status(StatusCodes.OK).json({ message: `pin message ${messageId} success` });
    }
    return resp.status(StatusCodes.NOT_FOUND).json({ message: `message  ${messageId} not found` });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
const unPinMessage = async (req, resp, next) => {
  try {
    const messageId = req.params.messageId;
    await unPinMessageService(messageId);
    return resp.status(StatusCodes.OK).json({ message: `unpin message ${messageId} success` });
  } catch (error) {
    next(error);
  }
};
const reactForMessage = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { react, messageId } = req.body;
    if (react) {
      await reactForMessageService(react, userId, messageId);
    } else {
      await reactForMessageService(null, userId, messageId);
    }

    return resp.status(StatusCodes.OK).json(await messagePopulate(messageId));
  } catch (error) {
    next(error);
  }
};
const forwardMessage = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { messageId, conversationIds } = req.body;
    const messageSaves = await forwardMessageService(userId, messageId, conversationIds);
    console.log(messageSaves.length);
    const messagepopu = await Promise.all(
      messageSaves.map(async (e) => {
        return await messagePopulate(e._id);
      })
    );
    return resp.status(StatusCodes.OK).json(messagepopu);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessage,
  getReplyMessages,
  deleteMessageForMe,
  deleteMessageForAll,
  pinMessage,
  unPinMessage,
  reactForMessage,
  forwardMessage,
};
