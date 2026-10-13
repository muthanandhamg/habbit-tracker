import mongoose from 'mongoose';
import { Logger } from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/life-os';

  try {
    Logger.info('⏳ Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    Logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // No fallback: without a real database the app must not start
    Logger.error('💀 MongoDB connection failed. Shutting down.', error);
    process.exit(1);
  }
};

export const isDBConnected = (): boolean => mongoose.connection.readyState === 1;

mongoose.connection.on('disconnected', () => {
  Logger.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  Logger.error(`❌ MongoDB Error: ${err.message}`);
});

export default connectDB;
