const multer = require('multer');
const path = require('path');
const checkFileType = (file, cb) => {
     const fileTypes = /.jpeg|.jpg|.png|.gif/;
     const extname = fileTypes.test(
          path.extname(file.originalname).toLowerCase()
     );
     const mimetype = fileTypes.test(file.mimetype);
     if (mimetype && extname) {
          return cb(null, true);
     }
     return cb('error: file must be jpeg|jpg|png|gif ');
};

const storage = multer.memoryStorage({
     destination(_req, _file, callback) {
          callback(null, '');
     },
});

const upload = multer({
     storage,
     limits: { fileSize: 20000000 },
     fileFilter(_req, file, cb) {
          checkFileType(file, cb);
     },
});

module.exports = { upload };