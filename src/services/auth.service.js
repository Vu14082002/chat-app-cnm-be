const httpErrors = require('http-errors');
const bcrypt = require('bcrypt');
const { UserModel } = require('../models/user.model');
const { verifyToken } = require('../utils/tokenJwt.util');

const createUserService = async (userInfo) => {
  try {
    // Kiểm tra xem tất cả thông tin người dùng đã được cung cấp đầy đủ hay không
    if (
      !userInfo.name ||
      !userInfo._id ||
      !userInfo.password ||
      !userInfo.dateOfBirth ||
      !userInfo.gender
    ) {
      throw httpErrors.BadRequest('Please fill out all information in the form');
    }
    // Xác định loại thông tin (email hoặc số điện thoại)
    let errorMessage = 'Phone';
    if (userInfo._id.includes('@')) {
      errorMessage = 'Email';
    }

    // Kiểm tra xem số điện thoại hoặc email đã tồn tại trong cơ sở dữ liệu chưa
    const userFromDb = await UserModel.findOne({ _id: userInfo._id });
    if (userFromDb) {
      throw httpErrors.BadRequest(`${errorMessage} has been registered`);
    }

    // Lưu thông tin người dùng vào cơ sở dữ liệu
    const userSaved = await new UserModel(userInfo).save();
    return userSaved;
  } catch (error) {
    throw error;
  }
};

const loginUserService = async (userLogin) => {
  const { contact, password } = userLogin;
  const user = await UserModel.findById(contact);
  if (!user) {
    throw httpErrors.BadRequest('The phone or password you entered is incorrect');
  }
  // compare password
  let errorMessage = 'Phone';
  if (user._id.includes('@')) {
    errorMessage = 'Email';
  }
  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    throw httpErrors.BadRequest(`${errorMessage} or password you entered is incorrect`);
  }
  return user;
};
const checkRefreshToken = async (token, key) => {
  const check = await verifyToken(token, key);
  return check;
};
const findUserByPhoneAndPasswordBcryptService = async ({ userId, password }) => {
  const userFind = await UserModel.findOne({ _id: userId, password });
  return userFind;
};
module.exports = {
  createUserService,
  loginUserService,
  checkRefreshToken,
  findUserByPhoneAndPasswordBcryptService,
};
