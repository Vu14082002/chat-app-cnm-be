const express = require('express');
const trimRequest = require('trim-request');
const { checkAuthorized } = require('../middlewares/auth.middleware');
const { addPhonebook, getPhonebook } = require('../controllers/phonebook.controller');

const phonebookRouter = express.Router();

phonebookRouter.route('/').post(trimRequest.all, checkAuthorized, addPhonebook);
phonebookRouter.route('/').get(checkAuthorized, getPhonebook);

module.exports = { phonebookRouter };
