const mongoose = require('mongoose');
const friendshipSchema = mongoose.Schema(
  {
    _id: { type: String, ref: 'UserModel', required: true },
    friends: [
      {
        type: String,
        ref: 'UserModel',
      },
    ],
  },
  {
    collection: 'friendship',
    timestamps: true,
  }
);

const FriendshipModel =
  mongoose.model.FriendshipModel || mongoose.model('FriendshipModel', friendshipSchema);

module.exports = { FriendshipModel };
