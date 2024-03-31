const { StatusCodes } = require('http-status-codes');
const { checkPhoneExistServices } = require('../services/user.service');

const checkPhoneExist = async (req, resp) => {
  try {
    const phone = req.body.phone;
    const result = await checkPhoneExistServices(phone);
    if (result) {
      resp.status(StatusCodes.BAD_REQUEST).json({ message: '' });
    }
  } catch (error) {}
};
