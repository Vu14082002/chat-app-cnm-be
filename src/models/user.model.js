const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');

const userSchema = mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, 'Please provide phone or email'],
      unique: [true, 'phone or email already exist'],
    },
    name: {
      type: String,
      required: [true, 'Please provide name'],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default:
        'https://res.cloudinary.com/dttv3mbki/image/upload/v1704809257/chat-app-cnm-DB/y9x5eessbbrewmffzrwv.png',
    },
    background: {
      type: String,
      default:
        'https://res.cloudinary.com/dttv3mbki/image/upload/v1704809291/chat-app-cnm-DB/zrktnnusnsww7p7ef52r.jpg',
    },
    status: {
      type: String,
      default: 'offline',
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    qrCode: {
      type: String,
    },
    friends: [
      {
        type: String,
        ref: 'UserModel',
      },
    ],
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  try {
    if (this.isNew || this.isModified('password')) {
      const saltRounds = 10; // Số lần lặp để sinh salt
      const salt = await bcrypt.genSalt(saltRounds);
      const hashPassword = await bcrypt.hash(this.password, salt);
      this.password = hashPassword;
    }
    if (this.isNew || !this.qrCode) {
      const qrData = await QRCode.toDataURL(this._id.toString());
      this.qrCode = qrData;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const UserModel = mongoose.model.UserModel || mongoose.model('UserModel', userSchema);
module.exports = { UserModel };
