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
const fs = require('fs');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');
const file = fs.readFileSync('./swagger.yaml', 'utf8');
const swaggerDocument = YAML.parse(file);
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
app.use(
  cors({
    allowedHeaders: '*',
  })
);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css',
  })
);

app.use('/api/v1', routes);

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
