require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    console.log('Testing direct connection string...');
    console.log('URI:', process.env.MONGO_URL);
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected. State:', mongoose.connection.readyState);
    
    const User = require('./models/User');
    console.log('Count:', await User.countDocuments());
    
    await mongoose.disconnect();
    console.log('Done');
  } catch(e) {
    console.error('Error:', e);
  }
}

test();
