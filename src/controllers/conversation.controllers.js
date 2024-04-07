const { request, response } = require('express');
const logger = require('../logger');
const { StatusCodes } = require('http-status-codes');
const createHttpError = require('http-errors');
const {
  checkExistConversation,
  createConversation,
  populateConversation,
  getListUserConversations,
  pinConversationService,
  unPinConversationService,
} = require('../services/conversation.service');
const { findUserByIdService } = require('../services/user.service');

const openConversation = async (req = request, resp = response, next) => {
  try {
    const senderUserId = req.user.userId;
    const receiverUserId = req.body.receiverUserId;
    if (!receiverUserId) {
      logger.error('Please Provide user to begin conversation');
      throw createHttpError.BadGateway('Please Provide user_id to begin conversation');
    }
    // check conversation is exsist
    const resultCheck = await checkExistConversation(senderUserId, receiverUserId);
    if (resultCheck) {
      return resp.status(StatusCodes.OK).json(resultCheck);
    }
    let userReceived = await findUserByIdService(receiverUserId);
    let conversationData = {
      name: userReceived.name,
      picture: userReceived.avatar,
      isGroup: false,
      users: [senderUserId, receiverUserId],
    };
    const conversationSaved = await createConversation(conversationData);
    const populateConversationData = await populateConversation(
      conversationSaved._id,
      'users',
      '-password'
    );
    return resp.status(StatusCodes.CREATED).json(populateConversationData);
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req = request, resp = response, next) => {
  try {
    const userId = req.user.userId;
    const conversations = await getListUserConversations(userId);
    resp.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    next(error);
  }
};

const pinConversation = async (req, resp, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;
    await pinConversationService({ conversationId, userId });
    return resp.status(StatusCodes.OK).json({ message: 'pin success' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
// const renameConVersation = async(req = request, resp = response) => {
//     try {
//         const userId = req.user.userId;
//         const conversations = await renameConVersationService(userId);
//         resp.status(httpStatusCodes.StatusCodes.OK).json(conversations);
//     } catch (error) {
//         throw createHttpError.BadRequest('Some thing wrong, Try agian');
//     }
// };
module.exports = { openConversation, getConversations, pinConversation, unPinConversation };
