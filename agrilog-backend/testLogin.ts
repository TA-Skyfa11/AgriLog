import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User';

async function test() {
  await mongoose.connect('mongodb://localhost:27017/agrilog');
  const user = await User.findOne({ email: 'farm@agrilog.com' });
  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User found:', user.email);
    const isMatch = await bcrypt.compare('123456', user.passwordHash);
    console.log('Password match:', isMatch);
  }
  process.exit(0);
}
test();
