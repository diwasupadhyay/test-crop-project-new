import nodemailer from 'nodemailer'

let transporter

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })
  }
  return transporter
}

export const sendResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: `"Crop Price Predictor" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: Arial, sans-serif; padding: 24px;">
        <h2 style="color: #10b981; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #333; line-height: 1.6;">
          You requested a password reset for your Crop Price Predictor account.
        </p>
        <p style="color: #333; line-height: 1.6;">
          Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: linear-gradient(to right, #10b981, #16a34a); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          If the button doesn't work, copy and paste this link:<br />
          <a href="${resetUrl}" style="color: #10b981;">${resetUrl}</a>
        </p>
      </div>
    `
  }

  await getTransporter().sendMail(mailOptions)
}
