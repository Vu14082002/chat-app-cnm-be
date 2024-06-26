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
  getLastMessage,
  addMessageNotificationService,
  messageNotificationPopulate,
  getAttachedFilesService,
} = require('../services/message.service');
const {
  updateLastMessage,
  updateConversationDetailsService,
} = require('../services/conversation.service');
const { uploadToS3 } = require('../helpers/uploadToS3.helper');
const { convertToBinary } = require('../helpers/converFile');
const { checkValidImg } = require('../helpers/checkValidImg');
const { checkMessageHelper } = require('../helpers/checkMessage');
const { ConversationModel } = require('../models/conversation.model');
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
            size: file.size,
          };
          const fileExtension = uploadedFile.split('.').pop().toLowerCase();
          if (imageExtensions.includes(fileExtension)) {
            //FIXME: tắt check img khi nao dung thì bật lên
            const checkImg = await checkValidImg(uploadedFile);
            // const checkImg = true;
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
    if (messages?.length > 0) {
      for (const message of messages) {
        if (message.type === 'text') {
          invalidMessageContent.push(message.content);
        }
      }
      const messageContent = invalidMessageContent.join(' ');
      checkValidMessage = await checkMessageHelper(messageContent);
      if (!checkValidMessage) {
        if (!sticker && !files.length && !location) {
          return resp
            .status(StatusCodes.OK)
            .json({ message: [], invalidFiles, failedUploads: [], invalidMessage: true });
        }
      }
    }

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
    await Promise.all([
      updateLastMessage(conversationId, messageSaved),
      updateConversationDetailsService({
        conversationId,
        lastMessageId: messageSaved._id,
        senderId: userId,
        type: 'ADD_MESSAGE',
      }),
    ]);
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

// TODO Không lấy thông báo remove user của chính mình
const getMessage = async (req = request, resp = response, next) => {
  try {
    const messageId = req.query.messageId;
    const userId = req.user.userId;
    const conversationId = req.params.conversationId;
    const message = await getConversationMessage(conversationId, messageId, userId);

    updateConversationDetailsService({
      conversationId,
      userId,
      type: 'GET_MESSAGE',
    })
      .then(() => console.log('Finish....'))
      .catch((err) => console.error(err));

    resp.status(StatusCodes.OK).json(message);
  } catch (error) {
    next(error);
  }
};

const getReplyMessages = async (req = request, resp = response, next) => {
  try {
    const { messageId, conversationId } = req.params;
    const userId = req.user.userId;
    const replyMessages = await getReplyMessagesService(conversationId, messageId, userId);
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
    const message = await deleteMessageForMeService(senderId, messageId);

    const lastMessage = await getLastMessage({
      conversationId: message.conversation,
      userId: senderId,
    });

    updateConversationDetailsService({
      conversationId: message.conversation,
      lastMessageId: lastMessage?._id,
      userId: senderId,
      type: 'DELETE_MESSAGE_FOR_ME',
    })
      .then(() => console.log('Finish....'))
      .catch((err) => console.error(err));

    return resp.status(StatusCodes.OK).json({ message: 'delete success', lastMessage });
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

    Promise.all(
      messageSaves.map((message) =>
        updateConversationDetailsService({
          conversationId: message.conversation,
          lastMessageId: message._id,
          senderId: userId,
          type: 'ADD_MESSAGE',
        })
      )
    )
      .then(() => console.log('Finish....'))
      .catch((err) => console.error(err));

    const messagepopu = await Promise.all(messageSaves.map((e) => messagePopulate(e._id)));
    return resp.status(StatusCodes.OK).json(messagepopu);
  } catch (error) {
    next(error);
  }
};

const addMessageNotification = async (req, resp, next) => {
  try {
    const { userIds, conversationId, conversations, messageId, type } = req.body;
    const userId = req.user.userId;
    const message = await addMessageNotificationService({
      userIds,
      conversationId,
      conversations,
      messageId,
      type,
      senderId: userId,
    });

    const messagePopulate = await messageNotificationPopulate(message._id);

    updateConversationDetailsService({
      conversationId,
      lastMessageId: message._id,
      userId,
      type: 'ADD_MESSAGE_NOTIFICATION',
      senderId: userId,
    })
      .then(() => console.log('Finish....'))
      .catch((err) => console.error(err));

    return resp.status(StatusCodes.OK).json(messagePopulate);
  } catch (error) {
    next(error);
  }
};

const getAttachedFiles = async (req, resp, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;

    const isExist = await ConversationModel.findById(conversationId);

    if (!isExist)
      return resp.status(StatusCodes.NOT_FOUND).json({ message: 'Conversation not found' });

    if (!isExist.users.includes(userId))
      return resp
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'You are not in this conversation' });

    const files = await getAttachedFilesService(conversationId, userId);

    return resp.status(StatusCodes.OK).json(files);
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
  addMessageNotification,
  getAttachedFiles,
};
