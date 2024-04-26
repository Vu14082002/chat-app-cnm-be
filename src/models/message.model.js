const mongoose = require('mongoose');
const { messageNotificationType } = require('../constants');
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = mongoose.Schema({
  users: {
    type: [String],
    ref: 'UserModel',
    default: [],
  },
  conversations: {
    type: [String],
    ref: 'ConversationModel',
    default: [],
  },
  message: {
    type: String,
    ref: 'MessageModel',
    default: null,
  },
  type: {
    type: String,
    enum: Object.values(messageNotificationType),
    required: true,
  },
});

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
        size: {
          type: Number,
          required: true,
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
    notification: {
      type: notificationSchema,
      default: null,
    },
  },
  {
    collection: 'message',
    timestamps: true,
  }
);

const MessageModel = mongoose.model.MessageModel || mongoose.model('MessageModel', messageSchema);
module.exports = { MessageModel };
