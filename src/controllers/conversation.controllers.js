const logger = require('../logger');
const { StatusCodes } = require('http-status-codes');
require('dotenv').config();
const createHttpError = require('http-errors');
const {
  checkExistConversation,
  createConversation,
  populateConversation,
  getListUserConversations,
  pinConversationService,
  getGroupsService,
  deleteConversationService,
  addUsersService,
  getConversationService,
  removeUserService,
  setOwnerRoleService,
  addAdminRole,
  removeAdminRole,
  leaveGroupService,
  updateConversationDetailsService,
  getMutualGroupsService,
} = require('../services/conversation.service');
const { findUserByIdService, isFriendsService } = require('../services/user.service');
const { uploadToS3 } = require('../helpers/uploadToS3.helper');
const { getLastMessage, addMessageNotificationService } = require('../services/message.service');
const { messageNotificationType } = require('../constants');

const openConversation = async (req, resp, next) => {
  try {
    const senderUserId = req.user.userId;
    const receiverUserId = req.body.receiverUserId;
    if (!receiverUserId)
      throw createHttpError.BadGateway('Please Provide user_id to begin conversation');

    // check conversation is exsist
    const resultCheck = await checkExistConversation(senderUserId, receiverUserId);
    if (resultCheck) return resp.status(StatusCodes.OK).json(resultCheck);

    let userReceived = await findUserByIdService(receiverUserId);
    let conversationData = {
      name: userReceived.name,
      picture: userReceived.avatar,
      isGroup: false,
      users: [senderUserId, receiverUserId],
    };
    const conversationSaved = await createConversation(conversationData);
    const populateConversationData = await populateConversation(
      conversationSaved._id,
      'users',
      '-password'
    );
    return resp.status(StatusCodes.CREATED).json(populateConversationData);
  } catch (error) {
    next(error);
  }
};

// FIXME check friend
const createConversationGroup = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { avatar, name, users: u } = req.body;
    const users = Array.isArray(u) ? u : JSON.parse(u);
    const checkFriend = await isFriendsService(users, userId);
    if (!checkFriend)
      return resp
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'You are not friend with all user in group' });

    const avatarFile = req.file;

    let picture = avatar;
    if (!users)
      throw createHttpError.BadGateway('Please Provide name and userIds to begin conversation');

    if (avatarFile) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
      avatarFile.originalname = `${Date.now()}.${avatarFile.mimetype.split('/')[1]}`;
      const uploadedFile = await uploadToS3(avatarFile);
      const fileInfo = {
        link: uploadedFile,
        name: avatarFile.originalname,
        type: avatarFile.mimetype,
      };
      const fileExtension = uploadedFile.split('.').pop().toLowerCase();
      if (imageExtensions.includes(fileExtension)) {
        //FIXME: tắt check img khi nao dung thì bật lên
        // const checkImg = await checkValidImg(uploadedFile);
        const checkImg = true;
        if (!checkImg) {
          throw createHttpError.BadGateway('Avatar is not valid');
        } else {
          picture = fileInfo.link;
        }
      } else {
        throw createHttpError.BadGateway('Avatar is not valid');
      }
    }

    const userArray = Array.isArray(users) ? users : JSON.parse(users);
    userArray.push(userId);

    const userReceived = await Promise.all(userArray.map((userId) => findUserByIdService(userId)));

    if (!userReceived.every(Boolean)) throw createHttpError.BadGateway('Users not found');

    let conversationData = {
      name:
        name ||
        userReceived
          .filter((user) => user._id !== userId)
          .map((user) => user.name)
          .join(', '),
      picture,
      isGroup: true,
      users: userArray,
      admin: userId,
    };
    const conversationSaved = await createConversation(conversationData);
    const [populateConversationData, message] = await Promise.all([
      getConversationService(conversationSaved._id),
      addMessageNotificationService({
        conversationId: conversationSaved._id,
        senderId: userId,
        type: messageNotificationType.CREATE_GROUP,
        userIds: userArray.slice(0, -1),
      }),
    ]);

    updateConversationDetailsService({
      conversationId: conversationSaved._id,
      type: 'ADD_MESSAGE',
      lastMessageId: message._id,
      senderId: userId,
    })
      .then()
      .catch((err) => console.error(err));

    const conversationObject = populateConversationData;
    const messageObject = {
      ...message.toObject(),
    };

    messageObject.notification.users = conversationObject.users.slice(0, -1);
    messageObject.sender = conversationObject.users.at(-1);

    return resp.status(StatusCodes.CREATED).json({
      ...conversationObject,
      lastMessage: messageObject,
    });
  } catch (error) {
    next(error);
  }
};

const getGroups = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const conversations = await getGroupsService(userId);
    return resp.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    next(error);
  }
};

// FIXME Khi get conversations thì last message được lấy ra tuỳ vào user
const getConversations = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const conversations = await getListUserConversations(userId);
    resp.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    next(error);
  }
};
const createGroup = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { users, name } = req.body;
    // add current user to group
    users.push(userId);
    // check group must have name and at least 3 users
    if (!name || users.length < 3) {
      return resp
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Group must have name and at least 3 users' });
    }
    let conversationData = {
      name,
      isGroup: true,
      users,
      admin: userId,
      picture: process.env.DEFAULT_GROUP_AVATAR,
    };
    // create group
    const conversationSaved = await createConversation(conversationData);
    const populateConversationData = await populateConversation(
      conversationSaved._id,
      'users admin',
      '-password'
    );
    return resp.status(StatusCodes.CREATED).json(populateConversationData);
  } catch (error) {
    next(error);
  }
};

const pinConversation = async (req, resp, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;
    await pinConversationService({ conversationId, userId });
    return resp.status(StatusCodes.OK).json({ message: 'pin success' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// FIXME Kiểm tra user có quyền giải tán hay không? (Field admin)
const deleteConversation = async (req, resp, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;
    const conversation = await deleteConversationService(conversationId, userId);
    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(error);
  }
};

// TODO Check role: admin or owner
// Phê duyệt thành viên khi thành viên đó tham gia bằng link hoặc đươc member mời
const addUser = async (req, resp, next) => {
  const conversationId = req.params.conversationId;
  const { userIds } = req.body;
  try {
    const lastMessage = await getLastMessage({ conversationId });

    await addUsersService({ conversationId, userIds, lastMessage });

    const conversation = await getConversationService(conversationId, userIds[0]);

    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(error);
  }
};

// FIXME Check role: admin or owner
const removeUser = async (req, resp, next) => {
  console.log('vao day');
  try {
    const { conversationId, userId: removeUser } = req.params;
    const { userId } = req.user;
    const { blockRejoin } = req.query;
    // await removeUserService({ userId, conversationId, removeUser, blockRejoin });
    // const conversation = await getConversationService(conversationId);
    await removeUserService({
      userId,
      conversationId,
      removeUser,
      blockRejoin,
    });
    const conversation = await getConversationService(conversationId);
    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(next);
  }
};

const leaveGroup = async (req, resp, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.user;
    await leaveGroupService({
      userId,
      conversationId,
    });
    const conversation = await getConversationService(conversationId);
    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(next);
  }
};

const addRole = async (req, resp, next) => {
  const { conversationId, userId } = req.params;
  const { role } = req.body;

  try {
    if (role === 'owner') {
      await setOwnerRoleService({ conversationId, userId });
    } else if (role === 'admin') {
      await addAdminRole({ conversationId, userId });
    } else {
      throw createHttpError.BadRequest('Invalid role');
    }

    const conversation = await getConversationService(conversationId);

    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(error);
  }
};

const removeRole = async (req, resp, next) => {
  const { conversationId, userId } = req.params;

  try {
    await removeAdminRole({ conversationId, userId });

    const conversation = await getConversationService(conversationId);

    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(error);
  }
};

const deleteConversationIndividual = async (req, resp, next) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.userId;

    updateConversationDetailsService({
      conversationId,
      userId,
      type: 'DELETE_CONVERSATION',
    })
      .then(() => console.log('Finish....'))
      .catch((err) => console.error(err));

    return resp.status(StatusCodes.OK).json({
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error(error);

    next(error);
  }
};

const addToGroups = async (req, resp, next) => {
  try {
    const { conversationIds, userId } = req.body;

    if (!conversationIds?.length || !userId) throw createHttpError.BadRequest('Invalid data');

    await Promise.all(
      conversationIds.map((conversationId) =>
        addUsersService({ conversationId, userIds: [userId] })
      )
    );
    const conversations = await Promise.all(conversationIds.map(getConversationService));

    return resp.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    next(error);
  }
};

const getMutualGroups = async (req, resp, next) => {
  try {
    const userId = req.user.userId;
    const { userId: targetUserId } = req.query;
    const conversations = await getMutualGroupsService([userId, targetUserId]);
    return resp.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
