const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: String,
      ref: 'UserModel',
    },
    messages: [
      {
        content: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['tag', 'text'],
          default: 'text',
        },
        id: {
          type: String,
        },
      },
    ],
    conversation: {
      type: ObjectId,
      ref: 'ConversationModel',
    },
    files: [],
    sticker: {
      type: String,
    },
    reply: {
      type: ObjectId,
      ref: 'MessageModel',
    },
    statuses: {
      type: [
        {
          user: {
            type: ObjectId,
          },
          status: {
            type: String,
            enum: ['seen', 'delivered', 'sent'],
            default: 'sent',
          },
          react: {
            type: String,
          },
        },
      ],
      default: [],
    },
  },
  {
    collection: 'message',
    timestamps: true,
  }
);

const MessageModel = mongoose.model.MessageModel || mongoose.model('MessageModel', messageSchema);
module.exports = { MessageModel };
