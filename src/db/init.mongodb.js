const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('../logger');
dotenv.config();
const { MONGODB_URL } = process.env;
const connectString = MONGODB_URL;
class Database {
     constructor() {
          this.connect();
     }
     connect(type = 'mongodb') {
          if (1 === 1) {
               mongoose.set('debug', true);
               mongoose.set('debug', { color: true });
          }
          mongoose
               .connect(connectString, { maxPoolSize: 100, useNewUrlParser: true, useUnifiedTopology: true, readPreference: 'nearest' })
               .then(() => {
                    logger.info('Connect MongoDb Success');
               })
               .catch((err) => console.log(err));
     }
     static getIntance() {
          if (!Database.instance) {
               this.instance = new Database();
          }
          return Database.instance;
     }
}
const instanceMongoDb = Database.getIntance();
module.exports = instanceMongoDb;
