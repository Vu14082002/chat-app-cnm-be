const { emailTemplates } = require('./email.teamplates');

const sendEmail = async (template, receiverEmail, subject, locals) => {
  try {
    await emailTemplates(template, receiverEmail, subject, locals);
    console.log('send Email to', receiverEmail);
    console.log('Email sent successfully.');
  } catch (error) {
    console.log('Email sent .', error);
  }
};

module.exports = { sendEmail };
