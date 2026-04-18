/**
 * PayHere Webhook Setup Helper
 * 
 * This script helps you set up a public URL for PayHere webhooks
 * Run this before testing PayHere payments
 */

import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔧 PayHere Webhook Setup Helper\n');
console.log('To fix "Unauthorized payment request" error, you need a public URL for webhooks.\n');

console.log('Option 1: Use ngrok (Recommended for testing)');
console.log('  1. Install ngrok: https://ngrok.com/download');
console.log('  2. Run: ngrok http 5000');
console.log('  3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
console.log('  4. Update your .env file:\n');
console.log('     BACKEND_URL=https://your-ngrok-url.ngrok.io');
console.log('     PAYHERE_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/payments/payhere/notify\n');

console.log('Option 2: Use a webhook testing service');
console.log('  1. Visit: https://webhook.site');
console.log('  2. Copy your unique URL');
console.log('  3. Update PAYHERE_NOTIFY_URL in .env with that URL\n');

console.log('Option 3: Deploy to a public server');
console.log('  Deploy your backend to a service like:');
console.log('  - Heroku');
console.log('  - Railway');
console.log('  - Render');
console.log('  - DigitalOcean\n');

console.log('Current .env configuration:');
console.log(`  BACKEND_URL: ${process.env.BACKEND_URL || 'http://localhost:5000'}`);
console.log(`  PAYHERE_NOTIFY_URL: ${process.env.PAYHERE_NOTIFY_URL || 'Not set (using BACKEND_URL)'}\n`);

if (process.env.BACKEND_URL && process.env.BACKEND_URL.includes('localhost')) {
  console.log('⚠️  WARNING: Your BACKEND_URL is localhost!');
  console.log('⚠️  PayHere cannot reach localhost URLs.\n');
  console.log('Quick fix:');
  console.log('  1. Open a new terminal');
  console.log('  2. Run: ngrok http 5000');
  console.log('  3. Copy the HTTPS URL');
  console.log('  4. Update backend/.env:\n');
  console.log('     BACKEND_URL=https://your-ngrok-url.ngrok.io');
  console.log('     PAYHERE_NOTIFY_URL=https://your-ngrok-url.ngrok.io/api/payments/payhere/notify\n');
}

console.log('After updating .env, restart your server.\n');

