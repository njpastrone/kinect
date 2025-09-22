#!/usr/bin/env node
/**
 * Test Production API
 * 
 * This script tests the production API to see what user and contacts it returns
 */

const fetch = require('node-fetch');

async function testProductionAPI() {
  try {
    const API_URL = 'https://kinect-api.onrender.com';
    
    console.log('🔍 Testing Production API...\n');
    console.log('API URL:', API_URL);
    console.log('━'.repeat(60));

    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('   Status:', healthData.status);
    console.log('   Timestamp:', healthData.timestamp);

    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'njpastrone@gmail.com',
        password: process.env.TEST_USER_PASSWORD || 'Triangle5'  // You'll need to provide the password
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('   ❌ Login failed:', error.message);
      console.log('\n   Please set TEST_USER_PASSWORD environment variable with your password');
      console.log('   Example: TEST_USER_PASSWORD="yourpassword" node scripts/test-production-api.js');
      process.exit(1);
    }

    const loginData = await loginResponse.json();
    console.log('   ✅ Login successful!');
    
    // Handle nested response format
    const userData = loginData.data || loginData;
    const user = userData.user || userData;
    const tokens = userData.tokens || userData;
    const token = tokens.accessToken || loginData.token || loginData.accessToken;
    
    if (user && user._id) {
      console.log('   User ID:', user._id);
      console.log('   Name:', user.firstName, user.lastName);
      console.log('   Email:', user.email);
    } else {
      console.log('   Warning: User data format unexpected');
      console.log('   Response:', JSON.stringify(loginData, null, 2));
    }

    if (!token) {
      console.log('   ❌ No token in response');
      console.log('   Response structure:', JSON.stringify(loginData, null, 2));
      process.exit(1);
    }

    // Test 3: Get Contacts
    console.log('\n3️⃣ Fetching Contacts...');
    const contactsResponse = await fetch(`${API_URL}/api/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!contactsResponse.ok) {
      const error = await contactsResponse.json();
      console.log('   ❌ Failed to fetch contacts:', error.message);
    } else {
      const contactsResponseData = await contactsResponse.json();
      console.log('   Raw response:', JSON.stringify(contactsResponseData, null, 2).substring(0, 500));
      
      // Handle nested response
      const contactsData = contactsResponseData.data || contactsResponseData;
      const contacts = contactsData.contacts || contactsData || [];
      
      console.log(`   📱 Found ${contacts.length} contacts:`);
      
      if (contacts.length === 0) {
        console.log('   ⚠️  No contacts returned from API');
        console.log('\n   Possible issues:');
        console.log('   1. User ID mismatch between authentication and contacts');
        console.log('   2. Database connection issues');
        console.log('   3. Different user accounts in different databases');
        console.log('\n   Full response:', JSON.stringify(contactsResponseData, null, 2));
      } else {
        contacts.forEach((contact, index) => {
          console.log(`\n   ${index + 1}. ${contact.firstName} ${contact.lastName}`);
          console.log(`      Email: ${contact.email || 'Not set'}`);
          console.log(`      Last Contact: ${contact.lastContactDate || 'Never'}`);
        });
      }

      // Debug info
      if (contactsData.totalContacts !== undefined) {
        console.log('\n   📊 Debug Info:');
        console.log('   Total contacts:', contactsData.totalContacts);
        console.log('   Current page:', contactsData.currentPage);
        console.log('   Total pages:', contactsData.totalPages);
      }
    }

    // Test 4: Get User Info
    console.log('\n4️⃣ Getting Current User Info...');
    const meResponse = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('   User ID from /me:', meData._id);
      console.log('   Created:', meData.createdAt);
    }

    console.log('\n' + '━'.repeat(60));
    console.log('✅ API Test Complete\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('node-fetch')) {
      console.log('\n💡 Installing node-fetch...');
      const { execSync } = require('child_process');
      execSync('npm install node-fetch@2', { stdio: 'inherit', cwd: __dirname + '/..' });
      console.log('Please run the script again.');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testProductionAPI();
}

module.exports = { testProductionAPI };