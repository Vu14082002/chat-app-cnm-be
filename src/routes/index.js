const express = require('express');
const router = express.Router();
const { authRoutes } = require('./auth.router');
const { conversationRouter } = require('./conversation.route');
const { messageRouter } = require('./message.router');
const { userRouter } = require('./user.router');
// api/v1/
/**
 * @openapi
 * /:
 *   get:
 *     description: Welcome to swagger-jsdoc!
 *     responses:
 *       200:
 *         description: Returns a mysterious string.
 */
router.use('/auth', authRoutes);
router.use('/conversation', conversationRouter);
router.use('/message', messageRouter);
router.use('/user', userRouter);

module.exports = router;
