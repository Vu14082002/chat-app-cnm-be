const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const messageSchema = mongoose.Schema(
     {
          sender: {
               type: ObjectId,
               ref: 'UserModel',
          },
          message: {
               type: String,
               trim: true,
          },
          conversation: {
               type: ObjectId,
               ref: 'ConversationModel',
          },
          files: [],
     },
     {
          collection: 'message',
          timestamps: true,
     }
);

const MessageModel =
     mongoose.model.MessageModel ||
     mongoose.model('MessageModel', messageSchema);
module.exports = { MessageModel };
