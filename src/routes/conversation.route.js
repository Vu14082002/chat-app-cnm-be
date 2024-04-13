const conversationRouter = require('express').Router();
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const {
  openConversation,
  getConversations,
  pinConversation,
  createConversationGroup,
  getGroups,
  deleteConversation,
  addUser,
  removeUser,
  addRole,
  removeRole,
} = require('../controllers/conversation.controllers');
const { upload } = require('../configs/multer.config');

conversationRouter
  .route('/group')
  .post(trimRequest.all, checkAuthorized, upload.single('avatar'), createConversationGroup);
conversationRouter.route('/group').get(checkAuthorized, getGroups);
conversationRouter.route('/group/:conversationId').delete(checkAuthorized, deleteConversation);
conversationRouter.route('/group/:conversationId/users').post(checkAuthorized, addUser);
conversationRouter.route('/group/:conversationId/users').delete(checkAuthorized, removeUser);
conversationRouter
  .route('/group/:conversationId/users/:userId/role')
  .post(checkAuthorized, addRole);
conversationRouter
  .route('/group/:conversationId/users/:userId/role')
  .delete(checkAuthorized, removeRole);

conversationRouter.route('/').post(trimRequest.all, checkAuthorized, openConversation);
conversationRouter.route('/').get(trimRequest.all, checkAuthorized, getConversations);
conversationRouter
  .route('/pin/:conversationId')
  .get(trimRequest.all, checkAuthorized, pinConversation);

module.exports = { conversationRouter };
