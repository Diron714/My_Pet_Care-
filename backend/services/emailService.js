import transporter from '../config/nodemailer.js';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@mypetcare.com';

// Send OTP email
export const sendOTPEmail = async (email, otpCode, otpType) => {
  // Check if email service is configured
  if (!transporter) {
    console.warn(`⚠️  Email service not configured. OTP for ${email}: ${otpCode}`);
    console.warn('   In production, configure EMAIL_USER and EMAIL_PASSWORD in .env');
    // Return success so the flow continues (OTP is still stored in database)
    return { success: true, skipped: true };
  }

  const subject = otpType === 'email_verification' 
    ? 'Verify Your Email - My Pet Care+'
    : 'Password Reset OTP - My Pet Care+';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .otp-box { background-color: #fff; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>My Pet Care+</h1>
        </div>
        <div class="content">
          <h2>${otpType === 'email_verification' ? 'Email Verification' : 'Password Reset'}</h2>
          <p>Your OTP code is:</p>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 My Pet Care+. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    // Log error but don't crash - OTP is still in database
    console.warn(`⚠️  Failed to send email to ${email}:`, error.message);
    console.warn(`   OTP code: ${otpCode} (can be verified manually)`);
    // Return success so the flow continues
    return { success: true, skipped: true, error: error.message };
  }
};

// Send account credentials email (staff-created accounts)
export const sendCredentialsEmail = async (email, password, firstName) => {
  if (!transporter) {
    console.warn(`⚠️  Email service not configured. Credentials for ${email} not sent.`);
    console.warn(`   Temporary password: ${password} (share securely with user)`);
    return { success: true, skipped: true };
  }

  const subject = 'Your My Pet Care+ Account Credentials';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f172a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f8fafc; }
        .credentials { background-color: #fff; border: 2px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .credential-row { margin: 10px 0; }
        .label { font-weight: bold; color: #64748b; }
        .value { font-family: monospace; font-size: 14px; color: #0f172a; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>My Pet Care+</h1>
        </div>
        <div class="content">
          <h2>Your account has been created</h2>
          <p>Hi ${firstName || 'there'},</p>
          <p>An administrator has created an account for you. Use the credentials below to log in:</p>
          <div class="credentials">
            <div class="credential-row"><span class="label">Email: </span><span class="value">${email}</span></div>
            <div class="credential-row"><span class="label">Password: </span><span class="value">${password}</span></div>
          </div>
          <p><strong>You must verify your email first.</strong> We have sent a separate email with a verification code (OTP). Enter that code to verify your account, then you can log in with the credentials above.</p>
          <p>We recommend changing your password after your first login.</p>
          <p>If you did not expect this email, please contact support.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 My Pet Care+. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.warn(`⚠️  Failed to send credentials email to ${email}:`, error.message);
    return { success: false, skipped: true, error: error.message };
  }
};

// Send notification email
export const sendNotificationEmail = async (email, title, message) => {
  // Check if email service is configured
  if (!transporter) {
    console.warn(`⚠️  Email service not configured. Notification for ${email} not sent.`);
    return { success: true, skipped: true };
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: title,
      html: `
        <h2>${title}</h2>
        <p>${message}</p>
        <p>Best regards,<br>My Pet Care+ Team</p>
      `
    });
    return { success: true };
  } catch (error) {
    // Log error but don't crash
    console.warn(`⚠️  Failed to send notification email to ${email}:`, error.message);
    return { success: true, skipped: true, error: error.message };
  }
};

