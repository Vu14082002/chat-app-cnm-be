const express = require('express');
const router = express.Router();
const { authRoutes } = require('./auth.router');
const { conversationRouter } = require('./conversation.route');
const { messageRouter } = require('./message.router');
const { userRouter } = require('./user.router');
const { phonebookRouter } = require('./phonebook.router');

// api/v1/
router.use('/auth', authRoutes);
router.use('/conversation', conversationRouter);
router.use('/message', messageRouter);
router.use('/user', userRouter);
router.use('/phonebook', phonebookRouter);

module.exports = router;
