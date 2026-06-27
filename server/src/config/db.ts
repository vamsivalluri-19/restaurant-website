import mongoose from 'mongoose';

export let isMockDB = false;

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/pakka-military-hotel';
    console.log(`Connecting to MongoDB at: ${mongoURI}...`);
    
    // Set connection timeout to 3 seconds for quick failover
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    
    console.log('🟢 MongoDB connected successfully.');
  } catch (error: any) {
    console.error('🔴 MongoDB connection failed:', error.message);
    console.log('⚠️ Running in Mock DB mode (Data will be stored in-memory for this session).');
    isMockDB = true;
  }
};
