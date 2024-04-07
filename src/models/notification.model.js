const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, ref: 'UserModel' },
    userSendRequest: { type: String, required: true, ref: 'UserModel' },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'notification',
    timestamps: true,
  }
);

const NotificationModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationModel;
