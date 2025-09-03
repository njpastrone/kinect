import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kinect';
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Enhanced connection options for MongoDB Atlas
    const conn = await mongoose.connect(mongoUri, {
      // MongoDB Atlas optimizations
      retryWrites: true,
      w: 'majority',
      // Connection pooling for Render
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.warn(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events for better monitoring
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.warn('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    // More graceful error handling for production
    if (process.env.NODE_ENV === 'production') {
      // In production, attempt reconnection after delay
      console.warn('⏳ Retrying connection in 5 seconds...');
      setTimeout(() => connectDB(), 5000);
    } else {
      // In development, exit immediately for faster debugging
      process.exit(1);
    }
  }
};

export default connectDB;
