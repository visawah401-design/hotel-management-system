const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Both variables checked for maximum compatibility on Vercel/Railway
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not defined in .env or Railway variables');
    }

    console.log('Connecting to MongoDB Atlas...');

    // Prevents deprecation warnings in Mongoose 7
    mongoose.set('strictQuery', false);

    // Connect without deprecated options (Optimized for Mongoose 7+)
    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Cloud/Railway Deployment health tracking listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected! Check network or Atlas IP Whitelist.');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // Fail-fast for Railway to automatically restart the container
    process.exit(1);
  }
};

module.exports = connectDB;
