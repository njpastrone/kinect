#!/usr/bin/env node
/**
 * Test Manual Trigger API Endpoints
 * 
 * This script tests the new manual trigger endpoints for reminder system
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test user credentials - using the production account
const TEST_USER = {
  email: 'njpastrone@gmail.com',
  password: 'Nicole$Pastrone2024' // Production password
};

async function testManualTriggers() {
  try {
    console.log('🧪 Testing Manual Trigger API Endpoints...\n');

    // Step 1: Login to get auth token
    console.log('📝 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test send test reminder endpoint
    console.log('📧 Testing send test reminder...');
    try {
      const testReminderResponse = await axios.post(`${API_BASE}/notifications/test`, {}, { headers });
      console.log('✅ Test reminder response:', testReminderResponse.data);
    } catch (error) {
      console.log('❌ Test reminder error:', error.response?.data || error.message);
    }
    console.log('');

    // Step 3: Test trigger daily reminders endpoint
    console.log('🔄 Testing trigger daily reminders...');
    try {
      const dailyRemindersResponse = await axios.post(`${API_BASE}/notifications/trigger-daily`, {}, { headers });
      console.log('✅ Daily reminders response:', dailyRemindersResponse.data);
    } catch (error) {
      console.log('❌ Daily reminders error:', error.response?.data || error.message);
    }
    console.log('');

    // Step 4: Test get reminder stats endpoint
    console.log('📊 Testing get reminder stats...');
    try {
      const statsResponse = await axios.get(`${API_BASE}/notifications/stats`, { headers });
      console.log('✅ Stats response:', statsResponse.data);
    } catch (error) {
      console.log('❌ Stats error:', error.response?.data || error.message);
    }

    console.log('\n🎉 Manual trigger API tests completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check your email for test reminders');
    console.log('   2. Verify daily reminders processing in backend logs');
    console.log('   3. Test the frontend UI buttons in the dashboard');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    console.error('\nPossible fixes:');
    console.error('   1. Ensure backend is running on port 3001');
    console.error('   2. Check login credentials');
    console.error('   3. Verify MongoDB connection');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testManualTriggers();
}

module.exports = { testManualTriggers };