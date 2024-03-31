// Import
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const mongosanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const fileupload = require('express-fileupload');
const cors = require('cors');
const httpErrors = require('http-errors');
const routes = require('./routes/index.js');
const instanceMongoDb = require('./db/init.mongodb.js');
// -------------------------------------------------------
// config dotenv
dotenv.config();
const app = express();
instanceMongoDb;

// init middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongosanitize());
app.use(cookieParser());
app.use(compression());
// app.use(fileupload({ useTempFiles: true }));
// chio co duong dan nay moi dc ket noi toi server con lai thi ko dc connect
// them cho biet' vay thoi, du an nay ko can ::) do~ phien'
// app.use(cors({ origin: 'http://localhost:3000' }));
app.use(cors());

// app.post('/api/v1/sendSMS', async (req, res) => {
//   locals = {
//     name: 'Vu Nguyen',
//     appLink: 'https link web',
//     OTP: await createOTP(),
//     resetLink: 'link Reset',
//   };
//   sendEmail('verifyEmail', 'nguyenvanvu20020814@gmail.com', locals);
// });

app.use('/api/v1', routes);

// Error
app.use(async (req, res, next) => {
  next(httpErrors.NotFound(` 'SORRY' we couldn't find resource `));
});

app.use(async (err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

module.exports = { app };
