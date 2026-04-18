import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Detect environment (used only for logging now)
const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// Check if email is configured (regardless of NODE_ENV)
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

// Create transporter whenever email is configured
let transporter = null;

if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    requireTLS: process.env.EMAIL_REQUIRE_TLS === 'true' || process.env.EMAIL_SECURE !== 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // In some Windows / antivirus / proxy environments you may see:
    // "self-signed certificate in certificate chain".
    // For local development it's safe to disable strict cert checking.
    tls: {
      rejectUnauthorized: process.env.EMAIL_STRICT_TLS === 'true' // default: false in dev
    }
  });

  // Verify connection (non-blocking, don't wait)
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️  Email service not configured or connection failed:', error.message);
      console.warn('   OTP emails will not be sent. Authentication flow will work without emails.');
    } else {
      console.log('✅ Email service ready');
    }
  }); 

  if (!isProduction) {
    console.log('ℹ️  Email transporter initialized in NON-PRODUCTION environment.');
    console.log('   OTP and other emails will be sent using these SMTP credentials.');
  }
} else {
  console.warn('⚠️  Email service not configured (EMAIL_USER or EMAIL_PASSWORD missing)');
  console.warn('   OTP emails will not be sent. Authentication flow will work without emails.');
  console.warn('   To enable emails, configure EMAIL_USER and EMAIL_PASSWORD in .env');
}

export default transporter;

