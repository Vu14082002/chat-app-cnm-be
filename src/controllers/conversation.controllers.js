const { request, response } = require('express');
const logger = require('../logger');
const httpStatusCodes = require('http-status-codes');
const createHttpError = require('http-errors');
const {
     checkExistConversation,
     createConversation,
     populateConversation,
     getListUserConversations,
} = require('../services/conversation.service');
const { findUser } = require('../services/user.service');

const openConversation = async (req = request, resp = response, next) => {
     try {
          const senderUserId = req.user.userId;
          const reciverUserId = req.body.reciverUserId;
          if (!reciverUserId) {
               logger.error('Please Provide user to begin conversation');
               throw createHttpError.BadGateway('Please Provide user_id to begin conversation');
          }
          // check conversation is exsist
          const resultCheck = await checkExistConversation(senderUserId, reciverUserId);
          if (resultCheck) {
               resp.json(resultCheck);
          } else {
               let userRecived = await findUser(reciverUserId);
               let conversationData = {
                    name: userRecived.name,
                    picture: userRecived.avatar,
                    isGroup: false,
                    users: [senderUserId, reciverUserId],
               };
               const conversationSaved = await createConversation(conversationData);
               const populateConversationData = await populateConversation(
                    conversationSaved._id,
                    'users',
                    '-password'
               );
               resp.status(httpStatusCodes.StatusCodes.CREATED).json(populateConversationData);
          }
     } catch (error) {
          next(error);
     }
};

const getConversations = async (req = request, resp = response) => {
     try {
          const userId = req.user.userId;
          const conversations = await getListUserConversations(userId);
          resp.status(httpStatusCodes.StatusCodes.OK).json(conversations);
     } catch (error) {
          throw createHttpError.BadRequest('Some thing wrong, Try agian');
     }
};
module.exports = { openConversation, getConversations };
