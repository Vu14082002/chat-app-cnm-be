const { FriendshipModel } = require('../models/friendship.model');
const { PhonebookModel } = require('../models/phonebook.model');
const { UserModel } = require('../models/user.model');

const phonebookDetail = ({ users, phonebook, friendship }) => {
  const friendIds = friendship.friends;
  const map = phonebook.reduce((acc, user) => {
    acc[user.contactId] = user.name;
    return acc;
  }, {});

  return users.map((user) => ({
    _id: user._id,
    name: user.name,
    avatar: user.avatar,
    background: user.background,
    gender: user.gender,
    alias: map[user._id] || '',
    isFriend: friendIds.includes(user._id),
  }));
};

const addPhonebookService = async ({ userId, phonebook }) => {
  const map = phonebook.reduce((acc, item) => {
    acc[item.email] = item.name;
    return acc;
  }, {});
  const phonebookEmails = Object.keys(map);

  const users = await UserModel.find({ _id: { $in: phonebookEmails } });

  const insertUsers = users.map((user) => ({
    userId,
    contactId: user._id,
    name: map[user._id],
  }));

  const insertMany = new Promise((resolve) =>
    PhonebookModel.insertMany(insertUsers, {
      ordered: false,
    })
      .then(resolve)
      .catch(resolve)
  );

  const [friendship] = await Promise.all([
    FriendshipModel.findById(userId),
    insertMany,
    PhonebookModel.updateOne({ userId }, {}),
  ]);

  const result = phonebookDetail({
    users,
    phonebook: insertUsers,
    friendship,
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

  const [friendship, users] = await Promise.all([
    FriendshipModel.findById(userId),
    UserModel.find({ _id: { $in: phonebook.map((user) => user.contactId) } }),
  ]);

  const result = phonebookDetail({
    users,
    phonebook,
    friendship,
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
