const { OtpGenerator } = require('../helpers/otp.generator');
const bcrypt = require('bcrypt');
const httpErrors = require('http-errors');
const { OTPModel } = require('../models/oTp.model');
const createOTPService = async (phone, otp) => {
  try {
    const slat = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp, slat);
    const OtpSaved = await OTPModel.create({ phone, otp: hashOtp });
    return OtpSaved ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const getLastOtp = async (phone) => {
  try {
    const otp = await OTPModel.find({ phone });
    if (!otp.length) {
      return false;
    }
    const lastOtp = otp[otp.length - 1];
    return lastOtp;
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};
const isValidOtpService = async (otp, hashOtp) => {
  try {
    const isValid = await bcrypt.compare(otp, hashOtp);
    return isValid;
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};
const findOtpByIdService = async (id) => {
  try {
    const otp = await OTPModel.findById(id);
    return otp;
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};
const deleteManyOTPService = async (phone) => {
  try {
    await OTPModel.deleteMany({ phone });
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};

module.exports = {
  createOTPService,
  findOtpByIdService,
  getLastOtp,
  isValidOtpService,
  deleteManyOTPService,
};
