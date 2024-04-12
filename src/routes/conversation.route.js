const conversationRouter = require('express').Router();
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const {
  openConversation,
  getConversations,
  pinConversation,
  createConversationGroup,
  getGroups,
} = require('../controllers/conversation.controllers');
const { upload } = require('../configs/multer.config');

conversationRouter
  .route('/group')
  .post(trimRequest.all, checkAuthorized, upload.single('avatar'), createConversationGroup);
conversationRouter.route('/group').get(checkAuthorized, getGroups);

conversationRouter.route('/').post(trimRequest.all, checkAuthorized, openConversation);
conversationRouter.route('/').get(trimRequest.all, checkAuthorized, getConversations);
conversationRouter
  .route('/pin/:conversationId')
  .get(trimRequest.all, checkAuthorized, pinConversation);

module.exports = { conversationRouter };
