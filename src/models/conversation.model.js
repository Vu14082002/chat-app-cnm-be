const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { ObjectId } = mongoose.Schema.Types;

const ConversationSchema = mongoose.Schema(
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
      require: false,
      default: '',
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
      type: [{ type: String, ref: 'UserModel' }],
      default: [],
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
    deleted: {
      type: Boolean,
      default: false,
    },
    details: {
      type: [
        {
          userId: {
            type: String,
            ref: 'UserModel',
            required: true,
          },
          lastMessage: {
            type: ObjectId,
            ref: 'MessageModel',
            default: null,
          },
          unreadMessageCount: {
            type: Number,
            default: 0,
          },
          deletedAt: {
            type: Date,
            default: null,
          },
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
ConversationSchema.index({ pinBy: 1 });
ConversationSchema.pre('save', async function (next) {
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
ConversationSchema.statics.calculateAmountGroup = async function (userId1, userId2) {
  try {
    const count = await this.countDocuments({
      isGroup: true,
      users: { $all: [userId1, userId2] },
      deleted: false,
    });
    return count;
  } catch (error) {
    throw error;
  }
};
const ConversationModel =
  mongoose.model.ConversationModel || mongoose.model('ConversationModel', ConversationSchema);
module.exports = { ConversationModel };
