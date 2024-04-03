const mongoose = require('mongoose');

const friendsSchema = new mongoose.Schema({
  sender_id: { type: String, ref: 'UserModel', required: true },
  receiver_id: { type: String, ref: 'UserModel', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
});

const FriendModel = mongoose.model.FriendModel || mongoose.model('FriendModel', friendsSchema);

module.exports = { FriendModel };
