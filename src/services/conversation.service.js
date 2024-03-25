const createHttpError = require('http-errors');
const { ConversationModel } = require('../models/conversation.model');
const { UserModel } = require('../models/user.model');

const checkExistConversation = async(senderUserId, reciverUserId) => {
    let conversationList = await ConversationModel.find({
            isGroup: false,
            $and: [
                { users: { $elemMatch: { $eq: senderUserId } } },
                { users: { $elemMatch: { $eq: reciverUserId } } },
            ],
        })
        .populate('users', '-password')
        .populate('lastMessage');
    if (!conversationList) {
        throw createHttpError.BadRequest('Some thing wrong, Try agian');
    }
    conversationList = await UserModel.populate(conversationList, {
        path: 'lastMessage.sender',
        select: 'name avatar status',
    });
    return conversationList[0];
};

const createConversation = async(data) => {
    const conversationSaved = await ConversationModel.create(data);
    if (!conversationSaved) {
        throw createHttpError.BadRequest('Some thing wrong, Try agian');
    }
    return conversationSaved;
};
const populateConversation = async(conversationId, field, fieldRemove) => {
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
    }).populate(field, fieldRemove);
    if (!conversation) {
        throw createHttpError.BadRequest('Some thing wrong, Try agian');
    }
    return conversation;
};
const getListUserConversations = async(userId) => {
    let conversations;
    await ConversationModel.find({
            users: { $elemMatch: { $eq: userId } },
        })
        .populate('users', [
            '-password',
            '-qrCode',
            '-background',
            '-dateOfBirth',
            '-createdAt',
            '-updatedAt',
        ])
        .populate('admin', [
            '-password',
            '-qrCode',
            '-background',
            '-dateOfBirth',
            '-createdAt',
            '-updatedAt',
        ])
        .populate('lastMessage')
        .sort({ updatedAt: -1 })
        .then(async(data) => {
            data = data.filter((conv) => conv.delete !== false);
            data = await UserModel.populate(data, {
                path: 'lastMessage.sender',
                select: 'name avatar status',
            });
            conversations = data;
        })
        .catch((error) => {
            throw createHttpError.BadRequest(
                'From getListUserConversations method'
            );
        });
    return conversations;
};
const updateLastMessage = async(conversationId, message) => {
    const conversationUpdated = await ConversationModel.findByIdAndUpdate(
        conversationId, { lastMessage: message }
    );
    if (!conversationUpdated) {
        throw createHttpError.BadRequest(
            'Something wrong, pls Try again later'
        );
    }
    return conversationUpdated;
};

module.exports = {
    checkExistConversation,
    createConversation,
    populateConversation,
    getListUserConversations,
    updateLastMessage,
};