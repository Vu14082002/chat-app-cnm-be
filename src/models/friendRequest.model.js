const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
});

const FriendRequestModel =
  mongoose.model.FriendRequestModel || mongoose.model('FriendRequestModel', friendRequestSchema);

module.exports = { FriendRequestModel };
