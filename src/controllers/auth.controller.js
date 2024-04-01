const {
  createOTPService,
  getLastOTPService,
  isValidOTPService,
  deleteManyOTPService,
} = require('../services/otp.service');
const { OtpGenerator } = require('../helpers/otp.generator');
const httpErrors = require('http-errors');
require('dotenv').config();
const {
  loginUserService,
  checkRefreshToken,
  createUserService,
  findUserByPhoneAndPasswordBscryptService,
} = require('../services/auth.service');
const { genToken } = require('../services/jwtToken.service');
const { findUserByIdService } = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');
const { sendEmail } = require('../helpers/mail.transport');
const createOTPEmail = async (req, resp, next) => {
  try {
    const contact = req.body.contact;
    let errorMessage = 'Phone';
    if (contact.includes('@')) {
      errorMessage = 'Email';
    }

    const userFind = await findUserByIdService(contact);

    // Nếu không tìm thấy người dùng
    if (!userFind) {
      const otp = await OtpGenerator();
      const result = await createOTPService(contact, otp);
      if (!result) {
        return resp
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to create OTP, please try later....' });
      }
      if (errorMessage === 'Email') {
        const locals = {
          appLink: process.env.FE_LINK,
          OTP: otp,
          title: '',
        };

        const subject = 'Verify Email FOR CHAT APP CNM';
        await sendEmail('verifyEmail', contact, subject, locals);
      } else {
        // OTP phone later
        // TODO: Send OTP phone
      }
      return resp
        .status(StatusCodes.CREATED)
        .json({ message: `OTP sent successfully to ${errorMessage.toLowerCase()} ${contact}` });
    }
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, resp, next) => {
  try {
    const { contact, otp } = req.body;
    const lastOtp = await getLastOTPService(contact);

    // Kiểm tra xem lastOtp có tồn tại hay không để xác định xem OTP đã hết hạn chưa
    if (!lastOtp) {
      return resp.status(StatusCodes.BAD_REQUEST).json({ message: 'Expired OTP' });
    }

    // Kiểm tra tính hợp lệ của OTP
    const isValidOtp = await isValidOTPService(otp, lastOtp.otp);
    if (!isValidOtp) {
      return resp.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP' });
    }

    // Nếu mã OTP hợp lệ và contact khớp với lastOtp.contact, thực hiện xóa mã OTP theo contact
    if (isValidOtp && contact === lastOtp.contact) {
      deleteManyOTPService(contact);
      return resp.status(StatusCodes.OK).json({ message: 'OTP Verified' });
    } else {
      return resp.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    next(error);
  }
};

const register = async (req, resp, next) => {
  try {
    const { name, contact, password, dateOfBirth, gender } = req.body;
    const user = await createUserService({
      _id: contact,
      name,
      password,
      dateOfBirth,
      gender,
    });
    const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
    const accessToken = await genToken({ userId: user._id }, ACCESS_TOKEN_KEY, '1d');
    const refreshToken = await genToken({ userId: user._id }, REFRESH_TOKEN_KEY, '14d');
    // respone
    resp.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/api/v1/auth/refreshToken',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    });
    resp.status(201).json({
      message: 'Register success',
      accessToken: accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};
// TODO: thêm cái chặm login, nếu login sai 3 lân liên tiếp
const login = async (req, resp, next) => {
  try {
    const { contact, password } = req.body;
    const user = await loginUserService({ contact, password });
    // TODO:Nếu tài khoản bị xóa
    // if (user.deleted) {
    //   resp.status(StatusCodes.BAD_REQUEST).json({

    //     message: 'Account have block, Please contect nguyenvanvu20020814@gmail.com to restore',
    //   });
    // }
    const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
    const accessToken = await genToken({ userId: user._id }, ACCESS_TOKEN_KEY, '7d');
    const refreshToken = await genToken({ userId: user._id }, REFRESH_TOKEN_KEY, '14d');
    // respone
    resp.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/api/v1/auth/refreshToken',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    });
    resp.status(StatusCodes.OK).json({
      message: 'Login success',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};
const loginAuthenticateWithEncryptedCredentials = async (req, resp, next) => {
  try {
    const userId = req.body.userId;
    const password = req.body.password;
    const user = await findUserByPhoneAndPasswordBscryptService({ userId, password });
    // TODO: Kiểm tra nếu tài khoản bị xóa
    // if (user.deleted) {
    //     resp.status(StatusCodes.OK).json({
    //         message: 'Account have delete, You want to restore',
    //     });
    // }
    if (!user) {
      return resp.status(StatusCodes.NOT_FOUND).json({ message: 'NOT FOUND USER AND PASSWORD' });
    }
    const { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } = process.env;
    const accessToken = await genToken({ userId: user._id }, ACCESS_TOKEN_KEY, '7d');
    const refreshToken = await genToken({ userId: user._id }, REFRESH_TOKEN_KEY, '14d');
    // respone
    resp.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/api/v1/auth/refreshToken',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    });
    resp.status(StatusCodes.OK).json({
      message: 'Login success',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};
// TODO: Create QR code for Login
// const generateQR = async (req, resp, next) => {
//   try {
//     const code = Math.random().toString(36).substr(2, 8);

//     const qrExist = await QRCode.findOne({ userId });

//     if (!qrExist) {
//       await QRCode.create({ userId });
//     } else {
//       await QRCode.findOneAndUpdate({ userId }, { $set: { disabled: true } });
//       await QRCode.create({ userId });
//     }

//     // Generate encrypted data
//     const encryptedData = jwt.sign({ userId: user._id, email }, process.env.TOKEN_KEY, {
//       expiresIn: '1d',
//     });
//     const dataImage = await QR.toDataURL(encryptedData);
//     return resp.status(200).json({ dataImage });
//   } catch (err) {
//     next(err);
//   }
// };

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth/refreshToken',
    });
    res.json({ message: 'Logout success' });
  } catch (error) {
    next(error);
  }
};
const refreshToken = async (req, resp, next) => {
  console.log(req);
  try {
    console.log(`com innn`);
    console.log(req.cookies);
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw httpErrors.Unauthorized('Please login to continue');
    }
    const check = await checkRefreshToken(refreshToken, process.env.REFRESH_TOKEN_KEY);
    const user = await findUser(check.userId);
    const accessToken = await genToken({ userId: user._id }, process.env.ACCESS_TOKEN_KEY, '7d');
    resp.status(201).json({ accessToken, user });
  } catch (error) {
    next(error);
  }
};
const forgotpassword = async (req, resp, next) => {
  try {
    const contact = req.body.contact;
    let errorMessage = 'Phone';
    if (contact.includes('@')) {
      errorMessage = 'Email';
    }

    const userFind = await findUserByIdService(contact);

    // Nếu tìm thấy người dùng
    if (userFind) {
      const otp = await OtpGenerator();
      const result = await createOTPService(contact, otp);
      if (!result) {
        return resp
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: 'Failed to create OTP, please try later....' });
      }
      if (errorMessage === 'Email') {
        const locals = {
          appLink: process.env.FE_LINK,
          OTP: otp,
          title: '',
        };

        const subject = 'Forgot Password Web CHAT APP CNM';
        await sendEmail('verifyEmail', contact, subject, locals);
      } else {
        // OTP phone later
        // TODO: Send OTP phone
      }
      return resp
        .status(StatusCodes.CREATED)
        .json({ message: `OTP sent successfully to ${errorMessage.toLowerCase()} ${contact}` });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  logout,
  refreshToken,
  loginAuthenticateWithEncryptedCredentials,
  createOTPEmail,
  verifyOTP,
  forgotpassword,
};
