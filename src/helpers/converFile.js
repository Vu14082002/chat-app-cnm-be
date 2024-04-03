const { readFile } = require('fs');

const convertToBinary = (file) => {
  return new Promise((resolve, reject) => {
    if (file.path) {
      // Nếu có đường dẫn tệp, sử dụng readFile
      readFile(file.path, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    } else if (file.buffer) {
      resolve(file.buffer);
    } else {
      reject(new Error('Invalid file object'));
    }
  });
};

module.exports = { convertToBinary };
