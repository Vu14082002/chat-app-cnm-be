const { s3 } = require('../configs/s3.config');
const mime = require('mime-types');
const uuid = require('uuid');
require('dotenv').config();

const uploadToS3 = async (file) => {
  const fileExtension = file.originalname.split('.')[1];
  // const contentType = mime.lookup(fileExtension) || 'application/octet-stream';
  const key = `${uuid.v4()}_${Date.now()}.${fileExtension}`;

  const paramsS3 = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  return new Promise((resolve, reject) => {
    s3.upload(paramsS3, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.Location);
      }
    });
  });
};

module.exports = { uploadToS3 };
