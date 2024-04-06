const NotificationModel = require('../models/notification.model');
const httpErrors = require('http-errors');

const sendNotification = async (userId, content) => {
  try {
    await NotificationModel.create({ userId, content });
  } catch (error) {
    throw httpErrors.InternalServerError(`Send notification from server error`, error);
  }
};
const markNotificationAsRead = async (notificationId) => {
  try {
    await NotificationModel.findByIdAndUpdate(notificationId, { read: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw httpErrors.InternalServerError(`Marking notification from server error`);
  }
};

module.exports = { sendNotification, markNotificationAsRead };
