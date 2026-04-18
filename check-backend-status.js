import axios from 'axios';

console.log('🔍 Checking Backend Status...\n');

// Test 1: Health endpoint
try {
  const response = await axios.get('http://localhost:5000/health', { timeout: 3000 });
  console.log('✅ Backend is RUNNING');
  console.log('   URL: http://localhost:5000');
  console.log('   Status:', response.data.status);
  console.log('   Message:', response.data.message);
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ Backend is NOT running!');
    console.log('\n💡 Start backend:');
    console.log('   cd backend');
    console.log('   npm run dev');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('⚠️  Backend is not responding (timeout)');
    console.log('   Check if server is starting...');
  } else {
    console.log('❌ Error:', error.message);
  }
}

// Test 2: Login endpoint
try {
  const response = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'customer@test.com',
    password: 'TestPass123!'
  }, { timeout: 5000 });

  console.log('\n✅ Login endpoint is working!');
  console.log('   Response:', response.data.success ? 'SUCCESS' : 'FAILED');
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.log('\n❌ Cannot reach login endpoint - backend not running');
  } else if (error.response) {
    console.log('\n⚠️  Login endpoint responded but:');
    console.log('   Status:', error.response.status);
    console.log('   Message:', error.response.data?.message);
  } else {
    console.log('\n❌ Error:', error.message);
  }
}

console.log('\n');

