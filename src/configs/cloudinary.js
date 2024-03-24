const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();
cloudinary.config({
     cloud_name: 'dttv3mbki',
     api_key: process.env.CLOID_DINARY_API_KEY,
     api_secret: process.env.CLOID_DINARY_API_SECRET,
});

module.exports = { cloudinary };
