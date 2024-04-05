const mongoose = require('mongoose');
const QRCode = require('qrcode');
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
    users: {
      type: [
        {
          type: String,
          ref: 'UserModel',
        },
      ],
      default: [],
    },
    admin: {
      type: String,
      ref: 'UserModel',
    },
    deputy: {
      type: String,
      ref: 'UserModel',
    },
    bannedMembers: {
      type: [
        {
          type: String,
          ref: 'UserModel',
        },
      ],
      default: [],
    },
    lastMessage: {
      type: ObjectId,
      ref: 'MessageModel',
    },
    qrCode: {
      type: String,
    },
    public: {
      type: Boolean,
      default: true,
    },
    message: {
      type: String,
      ref: 'UserModel',
    },
    pinnedMessages: {
      type: [
        {
          type: ObjectId,
          ref: 'MessageModel',
        },
      ],
      default: [],
    },
    pinBy: {
      type: [
        {
          type: String,
          ref: 'UserModel',
        },
      ],
      default: [],
    },
  },

  {
    collection: 'conversations',
    timestamps: true,
  }
);

ConversationScheme.pre('save', async function (next) {
  if (!this.qrCode) {
    try {
      const qrData = await QRCode.toDataURL(this._id.toString());
      this.qrCode = qrData;
    } catch (error) {
      next(error);
    }
  }
  next();
});

const ConversationModel = mongoose.model('ConversationModel', ConversationScheme);

module.exports = { ConversationModel };
