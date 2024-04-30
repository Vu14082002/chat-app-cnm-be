const express = require('express');
const messageRouter = express.Router();
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const {
  sendMessage,
  getMessage,
  getReplyMessages,
  deleteMessageForMe,
  deleteMessageForAll,
  pinMessage,
  reactForMessage,
  unPinMessage,
  forwardMessage,
  addMessageNotification,
  getAttachedFiles,
} = require('../controllers/message.controllers');
// userRouter.route('/updateAvatar').post(checkAuthorized, upload.single('avatar'), updateAvatar);
const { upload } = require('../configs/multer.config');
messageRouter.route('/notification').post(trimRequest.all, checkAuthorized, addMessageNotification);
messageRouter.route('/').post(trimRequest.all, checkAuthorized, upload.array('files'), sendMessage);
// messageRouter.route('/reply/:replyId').get(trimRequest.all, checkAuthorized, getReplyMessages);
messageRouter.route('/:conversationId/attached-files').get(checkAuthorized, getAttachedFiles);
messageRouter.route('/:conversationId').get(trimRequest.all, checkAuthorized, getMessage);
messageRouter
  .route('/:conversationId/reply/:messageId')
  .get(trimRequest.all, checkAuthorized, getReplyMessages);
messageRouter.route('/deleteForMe').post(trimRequest.all, checkAuthorized, deleteMessageForMe);
messageRouter.route('/deleteForAll').post(trimRequest.all, checkAuthorized, deleteMessageForAll);
messageRouter.route('/pin/:messageId').post(trimRequest.all, checkAuthorized, pinMessage);
messageRouter
  .route('/unpinMessage/:messageId')
  .post(trimRequest.all, checkAuthorized, unPinMessage);
messageRouter.route('/react').post(trimRequest.all, checkAuthorized, reactForMessage);
messageRouter.route('/forward').post(trimRequest.all, checkAuthorized, forwardMessage);

module.exports = { messageRouter };
