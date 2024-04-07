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
} = require('../controllers/message.controllers');
// userRouter.route('/updateAvatar').post(checkAuthorized, upload.single('avatar'), updateAvatar);
const { upload } = require('../configs/multer.config');
messageRouter.route('/').post(trimRequest.all, checkAuthorized, upload.array('files'), sendMessage);
messageRouter.route('/reply/:replyId').get(trimRequest.all, checkAuthorized, getReplyMessages);
messageRouter.route('/:conversationId').get(trimRequest.all, checkAuthorized, getMessage);
messageRouter
  .route('/:conversationId/reply/:messageId')
  .get(trimRequest.all, checkAuthorized, getMessage);
messageRouter.route('/deleteForMe').post(trimRequest.all, checkAuthorized, deleteMessageForMe);
messageRouter.route('/deleteForAll').post(trimRequest.all, checkAuthorized, deleteMessageForAll);
messageRouter.route('/pin/:messageId').post(trimRequest.all, checkAuthorized, pinMessage);
messageRouter
  .route('/unpinMessage/:messageId')
  .post(trimRequest.all, checkAuthorized, unPinMessage);
// TODO: DELETE pin
// add react
messageRouter.route('/react').post(trimRequest.all, checkAuthorized, reactForMessage);

module.exports = { messageRouter };
