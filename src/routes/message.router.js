const express = require('express');
const messageRouter = express.Router();
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const { sendMessage, getMessage, getReplyMessages } = require('../controllers/message.controllers');

messageRouter.route('/').post(trimRequest.all, checkAuthorized, sendMessage);
messageRouter.route('/reply/:replyId').get(trimRequest.all, checkAuthorized, getReplyMessages);
messageRouter.route('/:conversationId').get(trimRequest.all, checkAuthorized, getMessage);
module.exports = { messageRouter };
