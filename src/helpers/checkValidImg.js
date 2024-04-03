const { ImageAnnotatorClient } = require('@google-cloud/vision');
const axios = require('axios');
const path = require('path');

const credentialPath = path.join(__dirname, 'chat-app-cnm.json');
const client = new ImageAnnotatorClient({ keyFilename: credentialPath });

const detectSafeSearch = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const request = {
      image: { content: imageBuffer },
      features: [{ type: 'SAFE_SEARCH_DETECTION' }],
    };
    const [result] = await client.annotateImage(request);
    const safeSearchAnnotation = result.safeSearchAnnotation;

    if (
      safeSearchAnnotation.adult === 'LIKELY' ||
      safeSearchAnnotation.adult === 'VERY_LIKELY' ||
      safeSearchAnnotation.violence === 'LIKELY' ||
      safeSearchAnnotation.violence === 'VERY_LIKELY' ||
      safeSearchAnnotation.racy === 'LIKELY' ||
      safeSearchAnnotation.racy === 'VERY_LIKELY'
    ) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

const checkValidImg = async (file) => {
  try {
    let isSafe = false;
    if (typeof file === 'string' && file.startsWith('http')) {
      isSafe = await detectSafeSearch(file);
    } else if (Buffer.isBuffer(file)) {
      isSafe = await detectSafeSearch(file);
    } else {
      console.error('Invalid data');
      return false;
    }
    return isSafe;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

module.exports = { checkValidImg };
