const { StatusCodes } = require('http-status-codes');
const { addPhonebookService, getPhonebookService } = require('../services/phonebook.service');

const addPhonebook = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { phonebook } = req.body;
    console.log(req.body);
    console.log('🚀 ~ addPhonebook ~ phonebook:', phonebook);
    const result = await addPhonebookService({ userId, phonebook });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getPhonebook = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await getPhonebookService({ userId });
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addPhonebook,
  getPhonebook,
};
