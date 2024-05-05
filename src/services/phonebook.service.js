const { FriendRequestModel } = require('../models/friendRequest.model');
const { FriendshipModel } = require('../models/friendship.model');
const { PhonebookModel } = require('../models/phonebook.model');
const { UserModel } = require('../models/user.model');

const phonebookDetail = ({
  users,
  phonebook,
  friendship,
  sendRequestAddFriend,
  waitResponseAddFriend,
}) => {
  const friendIds = friendship?.friends || [];
  const map = phonebook.reduce((acc, user) => {
    acc[user.contactId] = user.name;
    return acc;
  }, {});

  return users.map((user) => {
    let status = 0;
    if (friendIds.includes(user._id)) status = 1;
    else if (sendRequestAddFriend.some((u) => u.receiver_id === user._id)) status = 2;
    else if (waitResponseAddFriend.some((u) => u.sender_id === user._id)) status = 3;
    else status = 0;

    return {
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      background: user.background,
      gender: user.gender,
      alias: map[user._id] || '',
      isFriend: friendIds.includes(user._id),
      status,
    };
  });
};

const addPhonebookService = async ({ userId, phonebook }) => {
  const map = phonebook.reduce((acc, item) => {
    acc[item.email] = item.name;
    return acc;
  }, {});
  const phonebookEmails = Object.keys(map);

  const users = await UserModel.find({ _id: { $in: phonebookEmails } });

  const insertUsers = users.reduce((acc, user) => {
    if (user._id === userId) return acc;

    acc.push({
      userId,
      contactId: user._id,
      name: map[user._id],
    });
    return acc;
  }, []);

  const insertMany = new Promise((resolve) =>
    PhonebookModel.insertMany(insertUsers, {
      ordered: false,
    })
      .then(resolve)
      .catch(resolve)
  );

  const [friendship, sendRequestAddFriend, waitResponseAddFriend] = await Promise.all([
    FriendshipModel.findById(userId),
    FriendRequestModel.find({
      sender_id: userId,
    }),
    FriendRequestModel.find({
      receiver_id: userId,
    }),
    insertMany,
    PhonebookModel.updateOne({ userId }, {}),
  ]);

  const result = phonebookDetail({
    users,
    phonebook: insertUsers,
    friendship,
    sendRequestAddFriend,
    waitResponseAddFriend,
  });

  return {
    contacts: result,
    updatedAt: new Date().toISOString(),
  };
};

const getPhonebookService = async ({ userId }) => {
  const phonebook = await PhonebookModel.find({ userId });

  const lastUpdated = phonebook[0]?.updatedAt;
  if (!lastUpdated)
    return {
      contacts: [],
      updatedAt: new Date().toISOString(),
    };

  const [friendship, users, sendRequestAddFriend, waitResponseAddFriend] = await Promise.all([
    FriendshipModel.findById(userId),
    UserModel.find({ _id: { $in: phonebook.map((user) => user.contactId) } }),
    FriendRequestModel.find({
      sender_id: userId,
    }),
    FriendRequestModel.find({
      receiver_id: userId,
    }),
  ]);

  const result = phonebookDetail({
    users,
    phonebook,
    friendship,
    sendRequestAddFriend,
    waitResponseAddFriend,
  });

  return {
    contacts: result,
    updatedAt: lastUpdated.toISOString(),
  };
};

module.exports = {
  addPhonebookService,
  getPhonebookService,
};
