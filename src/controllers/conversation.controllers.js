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
} = require('../services/conversation.service');
const { findUserByIdService } = require('../services/user.service');
const { uploadToS3 } = require('../helpers/uploadToS3.helper');

const openConversation = async (req, resp, next) => {
  try {
    const senderUserId = req.user.userId;
    const receiverUserId = req.body.receiverUserId;
    if (!receiverUserId) {
      logger.error('Please Provide user to begin conversation');
      throw createHttpError.BadGateway('Please Provide user_id to begin conversation');
    }
    // check conversation is exsist
    const resultCheck = await checkExistConversation(senderUserId, receiverUserId);
    if (resultCheck) {
      return resp.status(StatusCodes.OK).json(resultCheck);
    }
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

// TODO check friend
const createConversationGroup = async (req, resp, next) => {
  const userId = req.user.userId;
  const { avatar, name, users } = req.body;
  const avatarFile = req.file;

  let picture = avatar;

  try {
    if (!users) {
      logger.error('Please Provide user to begin conversation');
      throw createHttpError.BadGateway('Please Provide name and userIds to begin conversation');
    }

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

// TODO get groups chưa bị ban
const getGroups = async (req, resp, next) => {
  const userId = req.user.userId;

  try {
    const conversations = await getGroupsService(userId);

    return resp.status(StatusCodes.OK).json(conversations);
  } catch (error) {
    next(error);
  }
};

// FIXME Khi get conversations thì last message được lấy ra tuỳ vào user
const getConversations = async (req, resp, next) => {
  console.log('Vao day ne');
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
// const renameConVersation = async(req = request, resp = response) => {
//     try {
//         const userId = req.user.userId;
//         const conversations = await renameConVersationService(userId);
//         resp.status(httpStatusCodes.StatusCodes.OK).json(conversations);
//     } catch (error) {
//         throw createHttpError.BadRequest('Some thing wrong, Try agian');
//     }
// };

// TODO Kiểm tra user có quyền giải tán hay không? (Field admin)
const deleteConversation = async (req, resp, next) => {
  const conversationId = req.params.conversationId;

  try {
    const conversation = await deleteConversationService(conversationId);

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
    await addUsersService({ conversationId, userIds });

    const conversation = await getConversationService(conversationId);

    return resp.status(StatusCodes.OK).json(conversation);
  } catch (error) {
    next(error);
  }
};

// TODO Check role: admin or owner
const removeUser = async (req, resp, next) => {
  const { conversationId, userId } = req.params;
  const { blockRejoin } = req.query;

  try {
    await removeUserService({ conversationId, userId, blockRejoin });

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
};
