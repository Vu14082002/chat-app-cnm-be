const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const ConversationScheme = mongoose.Schema(
     {
          name: {
               type: String,
               required: [true, 'Conversation name not be empty '],
               trim: true,
          },
          isGroup: {
               type: Boolean,
               required: true,
               default: false,
          },
          picture: {
               type: String,
               require: true,
          },
          users: [
               {
                    type: ObjectId,
                    ref: 'UserModel',
               },
          ],
          admin: {
               type: ObjectId,
               ref: 'UserModel',
          },
          lastMessage: {
               type: ObjectId,
               ref: 'MessageModel',
          },
     },
     {
          collection: 'conversations',
          timestamps: true,
     }
);
const ConversationModel =
     mongoose.model.ConversationModel ||
     mongoose.model('ConversationModel', ConversationScheme);
module.exports = { ConversationModel };
