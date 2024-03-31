const path = require('path');
const nodemailer = require('nodemailer');
const Email = require('email-templates');

const emailTemplates = async (template, receiver, subject, locals) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'nguyenvanvu20020814@gmail.com',
        pass: 'yimq abdy aclk xqru',
      },
    });
    const email = new Email({
      message: {
        from: `nguyenvanvu20020814@gmail.com'`,
        subject,
      },
      send: true,
      preview: false,
      transport: transporter,
      views: {
        options: {
          extension: 'ejs',
        },
      },
      juice: true,
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: path.join(__dirname, '../src'),
        },
      },
    });

    await email.send({
      template: path.join(__dirname, '..', 'emails', template),
      message: { to: receiver },
      locals,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { emailTemplates };
