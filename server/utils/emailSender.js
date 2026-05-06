const nodemailer = require('nodemailer');

const sendTicketEmail = async (userEmail, userName, eventName, pdfBuffer, booking = {}) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false // Helps with some hosting provider blocks
        }
    });



    const mailOptions = {
        from: `"ISKCON Events" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `✅ Booking Confirmed – ${eventName}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#0D0D0D;padding:32px 40px;text-align:center;">
              <div style="display:inline-block;border-bottom:3px solid #8C1C13;padding-bottom:10px;">
                <p style="margin:0;color:#8C1C13;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">ISKCON Coimbatore</p>
                <h1 style="margin:8px 0 0;color:#FFFFFF;font-size:26px;font-weight:800;">Event Ticket</h1>
              </div>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="background:#F0FFF4;padding:24px 40px;border-bottom:1px solid #D1FAE5;text-align:center;">
              <p style="margin:0;font-size:32px;">🎉</p>
              <h2 style="margin:8px 0 4px;color:#065F46;font-size:20px;font-weight:700;">You're all set, ${userName}!</h2>
              <p style="margin:0;color:#6B7280;font-size:14px;">Your booking for <strong style="color:#111827;">${eventName}</strong> is confirmed.</p>
            </td>
          </tr>

          <!-- Booking Details -->
          <tr>
            <td style="padding:32px 40px;">
              <h3 style="margin:0 0 16px;color:#111827;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Booking Summary</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <span style="color:#6B7280;font-size:13px;">Booking ID</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                    <span style="color:#111827;font-size:13px;font-weight:700;font-family:monospace;">${booking.bookingId || 'N/A'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <span style="color:#6B7280;font-size:13px;">Attendee</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                    <span style="color:#111827;font-size:13px;font-weight:600;">${userName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <span style="color:#6B7280;font-size:13px;">Phone</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                    <span style="color:#111827;font-size:13px;">${booking.userPhone || 'N/A'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;">
                    <span style="color:#6B7280;font-size:13px;">Quantity</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #F3F4F6;text-align:right;">
                    <span style="color:#111827;font-size:13px;font-weight:600;">${booking.quantity || 1} Ticket${(booking.quantity || 1) > 1 ? 's' : ''}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;">
                    <span style="color:#6B7280;font-size:13px;">Amount Paid</span>
                  </td>
                  <td style="padding:12px 0 0;text-align:right;">
                    <span style="color:#8C1C13;font-size:18px;font-weight:800;">₹${booking.totalPrice ? booking.totalPrice.toFixed(2) : 'N/A'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PDF Notice -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px 20px;">
                <p style="margin:0;color:#92400E;font-size:13px;line-height:1.6;">
                  📎 <strong>Your e-ticket PDF is attached</strong> to this email. Please present it at the entrance (printed or on your phone) for check-in.
                </p>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#6B7280;font-size:12px;">Questions? Contact us at <a href="mailto:${process.env.EMAIL_USER}" style="color:#8C1C13;">${process.env.EMAIL_USER}</a></p>
              <p style="margin:0;color:#9CA3AF;font-size:11px;">ISKCON Coimbatore &bull; No refunds for missed events</p>
            </td>
          </tr>

          <!-- Bottom Bar -->
          <tr>
            <td style="background:#8C1C13;padding:10px 40px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.6);font-size:10px;letter-spacing:1px;">HARE KRISHNA</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        attachments: [
            {
                filename: `ticket_${eventName.replace(/\s+/g, '_')}_${booking.bookingId || ''}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendTicketEmail };
