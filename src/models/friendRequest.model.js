const mongoose = require('mongoose');

const friendsRequestSchema = new mongoose.Schema(
  {
    sender_id: { type: String, ref: 'UserModel', required: true },
    receiver_id: { type: String, ref: 'UserModel', required: true },
    // status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  {
    collection: 'friendrequest',
    timestamps: true,
  }
);

const FriendRequestModel =
  mongoose.model.FriendRequestModel || mongoose.model('FriendRequestModel', friendsRequestSchema);

module.exports = { FriendRequestModel };
