const { generate } = require('otp-generator');
const OtpGenerator = async () => {
  options = {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  };
  const OTP = generate(6, options);
  return OTP;
};
module.exports = { OtpGenerator };
