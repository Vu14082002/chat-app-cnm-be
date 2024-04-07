const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: String,
      ref: 'UserModel',
    },
    messages: {
      type: [
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
      default: [],
    },
    conversation: {
      type: ObjectId,
      ref: 'ConversationModel',
    },
    files: [
      {
        link: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          select: false,
        },
      },
    ],
    location: {
      type: Object,
      default: null,
    },
    sticker: {
      type: String,
    },
    reply: {
      type: ObjectId,
      ref: 'MessageModel',
      default: null,
    },
    statuses: {
      type: [
        {
          user: {
            type: String,
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
    deleted: {
      type: String,
      enum: ['0', '1', '2'],
      default: '0',
    },
    usersDeleted: {
      type: [
        {
          user: {
            type: String,
            ref: 'UserModel',
          },
          deleted: {
            type: String,
            enum: ['1', '2'],
            default: '1',
          },
        },
      ],
    },
  },
  {
    collection: 'message',
    timestamps: true,
  }
);

const MessageModel = mongoose.model.MessageModel || mongoose.model('MessageModel', messageSchema);
module.exports = { MessageModel };
