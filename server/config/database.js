const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
      process.env.USE_LOCAL_DB = 'true';
      console.warn('⚠️ No MongoDB URI found. Falling back to local JSON storage.');
      return null;
    }

    console.log('Connecting to MongoDB Atlas...');
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected! Check network or Atlas IP Whitelist.');
    });

    return conn;
  } catch (error) {
    process.env.USE_LOCAL_DB = 'true';
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.warn('⚠️ Falling back to local JSON storage.');
    return null;
  }
};

module.exports = connectDB;
