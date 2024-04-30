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
  leaveGroup,
  deleteConversationIndividual,
  addToGroups,
  getMutualGroups,
} = require('../controllers/conversation.controllers');
const { upload } = require('../configs/multer.config');

conversationRouter
  .route('/group')
  .post(trimRequest.all, checkAuthorized, upload.single('avatar'), createConversationGroup);
conversationRouter.route('/group').get(checkAuthorized, getGroups);
conversationRouter.route('/group/mutual').get(checkAuthorized, getMutualGroups);
conversationRouter.route('/group/:conversationId').delete(checkAuthorized, deleteConversation);
conversationRouter.route('/group/:conversationId/users/leave').post(checkAuthorized, leaveGroup);
conversationRouter.route('/group/:conversationId/users').post(checkAuthorized, addUser);
conversationRouter
  .route('/group/:conversationId/users/:userId')
  .delete(checkAuthorized, removeUser);
conversationRouter
  .route('/group/:conversationId/users/:userId/role')
  .post(checkAuthorized, addRole);
conversationRouter
  .route('/group/:conversationId/users/:userId/role')
  .delete(checkAuthorized, removeRole);
conversationRouter.route('/addToGroups').post(checkAuthorized, addToGroups);
conversationRouter.route('/:conversationId').delete(checkAuthorized, deleteConversationIndividual);
conversationRouter.route('/').post(trimRequest.all, checkAuthorized, openConversation);
conversationRouter.route('/').get(trimRequest.all, checkAuthorized, getConversations);
// conversationRouter.route('/group').post(trimRequest.all, checkAuthorized, createGroup);
conversationRouter
  .route('/pin/:conversationId')
  .get(trimRequest.all, checkAuthorized, pinConversation);

module.exports = { conversationRouter };
