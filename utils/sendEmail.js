const transporter = require('../config/email');

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"M/S SUMON ENTERPRISE" <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendInquiryNotification = async (inquiry) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976D2;">New Inquiry Received</h2>
      <p>You have received a new inquiry from your website.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        <p><strong>Phone:</strong> ${inquiry.phone}</p>
        <p><strong>Subject:</strong> ${inquiry.subject}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${inquiry.message}</p>
      </div>
      
      <p style="color: #666; font-size: 12px;">
        This email was sent from M/S SUMON ENTERPRISE website contact form.
      </p>
    </div>
  `;

  await sendEmail({
    to: process.env.CONTACT_EMAIL,
    subject: `New Inquiry: ${inquiry.subject}`,
    html,
  });
};

const sendInquiryConfirmation = async (inquiry) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1976D2;">Thank You for Contacting Us</h2>
      <p>Dear ${inquiry.name},</p>
      
      <p>Thank you for reaching out to M/S SUMON ENTERPRISE. We have received your inquiry and will get back to you as soon as possible.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Your Message:</strong></p>
        <p><strong>Subject:</strong> ${inquiry.subject}</p>
        <p style="white-space: pre-wrap;">${inquiry.message}</p>
      </div>
      
      <p>If you have any urgent questions, please feel free to call us directly.</p>
      
      <p>Best regards,<br>M/S SUMON ENTERPRISE Team</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      
      <p style="color: #666; font-size: 12px;">
        M/S SUMON ENTERPRISE<br>
        Established: 2000<br>
        Email: ${process.env.CONTACT_EMAIL}
      </p>
    </div>
  `;

  await sendEmail({
    to: inquiry.email,
    subject: 'Thank you for contacting M/S SUMON ENTERPRISE',
    html,
  });
};

module.exports = {
  sendEmail,
  sendInquiryNotification,
  sendInquiryConfirmation,
};
