const conversationRouter = require('express').Router();
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const { openConversation, getConversations, renameConVersation } = require('../controllers/conversation.controllers');

conversationRouter.route('/').post(trimRequest.all, checkAuthorized, openConversation);
conversationRouter.route('/').get(trimRequest.all, checkAuthorized, getConversations);
conversationRouter.route('/renameconversation').path(trimRequest.all, checkAuthorized, renameConVersation);

module.exports = { conversationRouter };