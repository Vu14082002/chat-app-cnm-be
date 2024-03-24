const { s3 } = require('./s3.config');
require('domain').config();
const uuid = require('uuid');
const S3UpploadFile = async (file) => {
     const result = await s3
          .upload({
               Bucket: process.env.BUCKET_NAME,
               Key: `${uuid.v4()}-${file.originalname}`,
               Body: file.buffer,
          })
          .promise();
     return result;
};
