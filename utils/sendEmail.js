const transporter = require('../config/email');

/* ─────────────────────────────────────────
   Shared design tokens
───────────────────────────────────────── */
const GOLD   = '#C9A84C';
const DARK   = '#1A1A2E';
const LIGHT  = '#F8F5EF';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B6B8A';
const BORDER = '#E8E4DC';

/* ─────────────────────────────────────────
   Base wrapper used by every template
───────────────────────────────────────── */
const baseWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>M/S SUMON ENTERPRISE</title>
</head>
<body style="margin:0;padding:0;background-color:#F0EDE8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Email wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0EDE8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#FFFFFF;border-radius:2px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:${DARK};padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <!-- Gold accent bar -->
                    <div style="width:40px;height:3px;background:linear-gradient(90deg,${GOLD},#E8C96A);border-radius:2px;margin-bottom:16px;"></div>
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:${GOLD};">
                      M/S SUMON ENTERPRISE
                    </p>
                    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:${WHITE};letter-spacing:.02em;line-height:1.3;">
                      Construction &amp; Development
                    </h1>
                  </td>
                  <td align="right" valign="middle">
                    <div style="width:52px;height:52px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);border-radius:2px;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:22px;">🏗️</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold divider line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,${GOLD},#E8C96A,${GOLD});"></td>
          </tr>

          <!-- BODY CONTENT -->
          ${content}

          <!-- FOOTER -->
          <tr>
            <td style="background:${DARK};padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width:30px;height:2px;background:${GOLD};border-radius:1px;margin-bottom:12px;"></div>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${WHITE};">M/S SUMON ENTERPRISE</p>
                    <p style="margin:0 0 12px;font-size:11px;color:rgba(255,255,255,.45);letter-spacing:.05em;">
                      ESTABLISHED 2000 &nbsp;·&nbsp; BUILDING EXCELLENCE
                    </p>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,.35);line-height:1.7;">
                      Email: ${process.env.CONTACT_EMAIL}<br/>
                      Bangladesh
                    </p>
                  </td>
                  <td align="right" valign="bottom">
                    <p style="margin:0;font-size:10px;color:rgba(255,255,255,.2);letter-spacing:.08em;text-transform:uppercase;">
                      Confidential
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom disclaimer -->
          <tr>
            <td style="background:#111320;padding:14px 40px;">
              <p style="margin:0;font-size:10px;color:rgba(255,255,255,.25);text-align:center;line-height:1.6;">
                This email was sent from M/S SUMON ENTERPRISE official website.<br/>
                © ${new Date().getFullYear()} M/S SUMON ENTERPRISE. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

/* ─────────────────────────────────────────
   Helper: info row inside a data table
───────────────────────────────────────── */
const infoRow = (label, value) => `
  <tr>
    <td style="padding:10px 16px;border-bottom:1px solid ${BORDER};width:35%;">
      <span style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${GRAY};">
        ${label}
      </span>
    </td>
    <td style="padding:10px 16px;border-bottom:1px solid ${BORDER};">
      <span style="font-size:13px;color:${DARK};font-weight:500;">${value}</span>
    </td>
  </tr>
`;

/* ─────────────────────────────────────────
   Core send function
───────────────────────────────────────── */
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

/* ─────────────────────────────────────────
   Template 1 — Admin notification
   Sent to: CONTACT_EMAIL (your inbox)
───────────────────────────────────────── */
const sendInquiryNotification = async (inquiry) => {

  const content = `
    <!-- Alert banner -->
    <tr>
      <td style="background:#FBF8F0;border-left:4px solid ${GOLD};padding:16px 24px;margin:0;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${GOLD};">
          🔔 &nbsp; New Inquiry Received
        </p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:36px 40px 24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:${GOLD};">
          Client Details
        </p>
        <div style="width:30px;height:2px;background:${GOLD};border-radius:1px;margin-bottom:20px;"></div>

        <!-- Info table -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid ${BORDER};border-radius:2px;overflow:hidden;font-size:13px;">
          ${infoRow('Name',    inquiry.name)}
          ${infoRow('Email',   `<a href="mailto:${inquiry.email}" style="color:${GOLD};text-decoration:none;">${inquiry.email}</a>`)}
          ${infoRow('Phone',   `<a href="tel:${inquiry.phone}"   style="color:${GOLD};text-decoration:none;">${inquiry.phone}</a>`)}
          ${infoRow('Subject', inquiry.subject)}
          ${infoRow('Date',    new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }))}
        </table>
      </td>
    </tr>

    <!-- Message block -->
    <tr>
      <td style="padding:0 40px 36px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:${GOLD};">
          Message
        </p>
        <div style="width:30px;height:2px;background:${GOLD};border-radius:1px;margin-bottom:16px;"></div>
        <div style="background:${LIGHT};border:1px solid ${BORDER};border-radius:2px;padding:20px 24px;">
          <p style="margin:0;font-size:14px;color:${DARK};line-height:1.8;white-space:pre-wrap;">${inquiry.message}</p>
        </div>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding:0 40px 40px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${GOLD};border-radius:2px;">
              <a href="mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}"
                 style="display:inline-block;padding:12px 28px;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${WHITE};text-decoration:none;">
                ✉ &nbsp; Reply to Client
              </a>
            </td>
            <td width="12"></td>
            <td style="background:transparent;border:1px solid ${BORDER};border-radius:2px;">
              <a href="tel:${inquiry.phone}"
                 style="display:inline-block;padding:12px 28px;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:${DARK};text-decoration:none;">
                📞 &nbsp; Call Client
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  await sendEmail({
    to: process.env.CONTACT_EMAIL,
    subject: `📩 New Inquiry: ${inquiry.subject} — from ${inquiry.name}`,
    html: baseWrapper(content),
  });
};

/* ─────────────────────────────────────────
   Template 2 — Client confirmation
   Sent to: client's email
───────────────────────────────────────── */
const sendInquiryConfirmation = async (inquiry) => {

  const content = `
    <!-- Greeting section -->
    <tr>
      <td style="padding:40px 40px 28px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:${GOLD};">
          Confirmation
        </p>
        <div style="width:30px;height:2px;background:${GOLD};border-radius:1px;margin-bottom:20px;"></div>

        <h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:${DARK};line-height:1.3;">
          Thank You, ${inquiry.name}!
        </h2>
        <p style="margin:0;font-size:14px;color:${GRAY};line-height:1.8;">
          We have received your message and appreciate you reaching out to
          <strong style="color:${DARK};">M/S SUMON ENTERPRISE</strong>. Our team will
          review your inquiry and get back to you shortly.
        </p>
      </td>
    </tr>

    <!-- Confirmation badge -->
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:${LIGHT};border:1px solid ${BORDER};border-radius:2px;">
          <tr>
            <td style="padding:20px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="padding-right:14px;">
                    <div style="width:44px;height:44px;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);border-radius:50%;text-align:center;line-height:44px;font-size:20px;">
                      ✅
                    </div>
                  </td>
                  <td valign="middle">
                    <p style="margin:0;font-size:13px;font-weight:700;color:${DARK};">Inquiry Successfully Submitted</p>
                    <p style="margin:4px 0 0;font-size:12px;color:${GRAY};">
                      Submitted on ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Their message summary -->
    <tr>
      <td style="padding:0 40px 28px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:${GOLD};">
          Your Inquiry Summary
        </p>
        <div style="width:30px;height:2px;background:${GOLD};border-radius:1px;margin-bottom:16px;"></div>

        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid ${BORDER};border-radius:2px;overflow:hidden;">
          ${infoRow('Subject', inquiry.subject)}
          ${infoRow('Phone',   inquiry.phone)}
        </table>

        <div style="background:${DARK};border-radius:2px;padding:20px 24px;margin-top:12px;">
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);">
            Your Message
          </p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,.75);line-height:1.8;white-space:pre-wrap;">${inquiry.message}</p>
        </div>
      </td>
    </tr>

    <!-- What happens next -->
    <tr>
      <td style="padding:0 40px 28px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;color:${GOLD};">
          What Happens Next?
        </p>
        <div style="width:30px;height:2px;background:${GOLD};border-radius:1px;margin-bottom:20px;"></div>

        <!-- Step 1 -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td valign="top" style="padding-right:14px;">
              <div style="width:28px;height:28px;background:${GOLD};border-radius:2px;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:${WHITE};">1</div>
            </td>
            <td valign="middle">
              <p style="margin:0;font-size:13px;font-weight:600;color:${DARK};">Review</p>
              <p style="margin:2px 0 0;font-size:12px;color:${GRAY};">Our team reviews your inquiry within 24 hours</p>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
          <tr>
            <td valign="top" style="padding-right:14px;">
              <div style="width:28px;height:28px;background:${GOLD};border-radius:2px;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:${WHITE};">2</div>
            </td>
            <td valign="middle">
              <p style="margin:0;font-size:13px;font-weight:600;color:${DARK};">Contact</p>
              <p style="margin:2px 0 0;font-size:12px;color:${GRAY};">We reach out via email or phone to discuss your project</p>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top" style="padding-right:14px;">
              <div style="width:28px;height:28px;background:${GOLD};border-radius:2px;text-align:center;line-height:28px;font-size:12px;font-weight:700;color:${WHITE};">3</div>
            </td>
            <td valign="middle">
              <p style="margin:0;font-size:13px;font-weight:600;color:${DARK};">Consultation</p>
              <p style="margin:2px 0 0;font-size:12px;color:${GRAY};">We schedule a consultation to plan your construction project</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:0 40px 28px;">
        <div style="height:1px;background:${BORDER};"></div>
      </td>
    </tr>

    <!-- Contact info -->
    <tr>
      <td style="padding:0 40px 40px;">
        <p style="margin:0 0 4px;font-size:12px;color:${GRAY};">
          Need urgent assistance? Contact us directly:
        </p>
        <p style="margin:0;font-size:13px;font-weight:600;color:${DARK};">
          📧 &nbsp;
          <a href="mailto:${process.env.CONTACT_EMAIL}" style="color:${GOLD};text-decoration:none;">
            ${process.env.CONTACT_EMAIL}
          </a>
        </p>
      </td>
    </tr>
  `;

  await sendEmail({
    to: inquiry.email,
    subject: `✅ We received your inquiry — M/S SUMON ENTERPRISE`,
    html: baseWrapper(content),
  });
};

module.exports = {
  sendEmail,
  sendInquiryNotification,
  sendInquiryConfirmation,
};