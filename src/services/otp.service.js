const { OtpGenerator } = require('../helpers/otp.generator');
const bcrypt = require('bcrypt');
const httpErrors = require('http-errors');
const { OTPModel } = require('../models/oTp.model');
const createOTPService = async (contact, otp) => {
  try {
    const slat = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp, slat);
    const OtpSaved = await OTPModel.create({ contact, otp: hashOtp });
    return OtpSaved ? true : false;
  } catch (error) {
    console.log(error);
    return false;
  }
};
const getLastOTPService = async (contact) => {
  try {
    const lastOtp = await OTPModel.findOne({ contact }).sort({ time: -1 });
    return lastOtp;
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};
const isValidOTPService = async (otp, hashOtp) => {
  try {
    const isValid = await bcrypt.compare(otp, hashOtp);
    return isValid;
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};
const deleteManyOTPService = async (contact) => {
  try {
    await OTPModel.deleteMany({ contact });
  } catch (error) {
    throw httpErrors.BadRequest('Some thing wrong, Please try again late');
  }
};

module.exports = {
  createOTPService,
  getLastOTPService,
  isValidOTPService,
  deleteManyOTPService,
};
