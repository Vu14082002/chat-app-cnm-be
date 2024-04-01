const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const otpSchema = mongoose.Schema(
  {
    contact: {
      type: String,
    },
    otp: {
      type: String,
    },
    time: {
      type: Date,
      default: Date.now,
      index: { expires: 300000 },
    },
  },
  {
    collection: 'OTP',
    timestamps: true,
  }
);

const OTPModel = mongoose.model.OTPModel || mongoose.model('OTPModel', otpSchema);
module.exports = { OTPModel };
