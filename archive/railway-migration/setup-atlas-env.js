#!/usr/bin/env node

/**
 * MongoDB Atlas Environment Setup Helper
 * This script helps you configure your MongoDB Atlas connection
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupAtlasConnection() {
  console.log('\n🚀 MongoDB Atlas Connection Setup');
  console.log('==================================\n');
  
  console.log('📋 You will need the following information from MongoDB Atlas:');
  console.log('   1. Cluster name (e.g., cluster0)');
  console.log('   2. Username (e.g., kinect-admin)');
  console.log('   3. Password');
  console.log('   4. Cluster URL suffix (e.g., xxxxx.mongodb.net)\n');
  
  console.log('💡 To find these in Atlas:');
  console.log('   → Go to your cluster → Connect → Drivers');
  console.log('   → You\'ll see a connection string like:');
  console.log('   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/...\n');
  
  const proceed = await question('Ready to continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n👋 Setup cancelled.');
    process.exit(0);
  }
  
  console.log('\n');
  
  // Gather connection details
  const username = await question('MongoDB Atlas Username: ');
  const password = await question('MongoDB Atlas Password: ');
  const cluster = await question('Cluster name (e.g., cluster0): ');
  const urlSuffix = await question('URL suffix (e.g., xxxxx.mongodb.net): ');
  const database = await question('Database name (default: kinect): ') || 'kinect';
  
  // Build connection string
  const mongoUri = `mongodb+srv://${username}:${password}@${cluster}.${urlSuffix}/${database}?retryWrites=true&w=majority`;
  
  // Path to backend .env file
  const envPath = path.resolve(__dirname, '../backend/.env');
  
  // Read existing .env or create from template
  let envContent;
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Create from template
    envContent = `# Backend Environment Configuration
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
`;
  }
  
  // Update or add MONGODB_URI
  if (envContent.includes('MONGODB_URI=')) {
    // Replace existing MONGODB_URI
    envContent = envContent.replace(
      /MONGODB_URI=.*/,
      `MONGODB_URI=${mongoUri}`
    );
  } else {
    // Add MONGODB_URI at the beginning
    envContent = `# MongoDB Atlas Connection\nMONGODB_URI=${mongoUri}\n\n${envContent}`;
  }
  
  // Write updated content
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration saved to backend/.env');
  
  // Mask password for display
  const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
  console.log(`\n📝 Connection string set to:\n   ${maskedUri}\n`);
  
  console.log('🔧 Next steps:');
  console.log('   1. Ensure your IP is whitelisted in Atlas (Network Access)');
  console.log('   2. Run: cd backend && npm run test:atlas');
  console.log('   3. If successful, run: npm run dev\n');
  
  rl.close();
}

// Run setup
setupAtlasConnection().catch((error) => {
  console.error('\n❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});