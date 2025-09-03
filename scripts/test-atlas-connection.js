#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * Run this to verify your Atlas connection before migration
 */

const path = require('path');
// Load .env from backend directory when run via npm script
require('dotenv').config({ 
  path: path.resolve(__dirname, '../backend/.env')
});
// Also try to load from root if backend .env doesn't exist
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env')
});
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas Connection...\n');
  
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('   Please ensure your .env file contains MONGODB_URI');
    process.exit(1);
  }
  
  // Mask password in URI for logging
  const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
  console.log(`📍 Connecting to: ${maskedUri}\n`);
  
  try {
    // Connect with same options as production
    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!\n');
    
    // Get connection details
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Server status
    const serverStatus = await admin.serverStatus();
    console.log('📊 Server Information:');
    console.log(`   Version: ${serverStatus.version}`);
    console.log(`   Host: ${serverStatus.host}`);
    console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
    
    // List databases
    const dbs = await admin.listDatabases();
    console.log(`\n📚 Databases (${dbs.databases.length}):`);
    dbs.databases.forEach(database => {
      const size = (database.sizeOnDisk / 1024 / 1024).toFixed(2);
      console.log(`   - ${database.name} (${size} MB)`);
    });
    
    // Test collections in current database
    const collections = await db.listCollections().toArray();
    console.log(`\n📁 Collections in '${db.databaseName}' (${collections.length}):`);
    
    for (const collection of collections) {
      const stats = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${stats} documents`);
    }
    
    // Test write operation
    console.log('\n🔬 Testing write operation...');
    const TestModel = mongoose.model('ConnectionTest', new mongoose.Schema({
      timestamp: Date,
      message: String,
    }));
    
    const testDoc = await TestModel.create({
      timestamp: new Date(),
      message: 'Atlas connection test successful',
    });
    
    console.log('   ✅ Write test successful');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('   ✅ Cleanup successful');
    
    console.log('\n🎉 All tests passed! MongoDB Atlas is ready for migration.');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Check your MongoDB Atlas cluster is running');
      console.log('   2. Verify the cluster hostname in your connection string');
      console.log('   3. Ensure your IP address is whitelisted in Atlas Network Access');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Verify your username and password');
      console.log('   2. Ensure the user has the correct permissions');
      console.log('   3. Check that the database name in the URI is correct');
    } else if (error.message.includes('ServerSelectionTimeoutError')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Check your network connection');
      console.log('   2. Verify IP whitelist in MongoDB Atlas');
      console.log('   3. Ensure the cluster is not paused');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB Atlas');
  }
}

// Run the test
testConnection().catch(console.error);