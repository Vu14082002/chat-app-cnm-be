const mongoose = require('mongoose');
const { ObjectId } = module.Schema.Types;

const friendshipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  friends: [
    {
      type: ObjectId,
      ref: 'UserModel',
    },
  ],
});

const FriendshipModel = mongoose.model('FriendshipModel', friendshipSchema);

module.exports = { FriendshipModel };
