const multer = require('multer');

const fileFilter = (_req, file, cb) => {
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

  cb(null, true);
};

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter });
module.exports = { upload };
