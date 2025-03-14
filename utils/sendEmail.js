const nodeMailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("inside sendEmail", { options });

  const transporter = nodeMailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    secure: true,
    auth: {
      user: process.env.SMPT_EMAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  // const smtp = await nodeMailer.createTestAccount();

  // const transporter = nodeMailer.createTransport({
  //   host: smtp.smtp.host,
  //   port: smtp.smtp.port,
  //   secure: smtp.smtp.secure,
  //   auth: {
  //     user: smtp.user,
  //     pass: smtp.pass
  //   }
  // })

  const id = await transporter.sendMail({
    from: process.env.SMPT_EMAIL,
    to: options.email,
    subject: options.subject,
    html: options.message,
    // attachments: [{content: file, filename: 'doc.pdf'}]
  });

  console.log({ id });
};

module.exports = sendEmail;

// SMTP = simple mail transfer protocol
