/// <reference types="node" />
import bcrypt from 'bcryptjs';
import { connectDB } from './src/config/db';
import { User } from './src/models/User';

async function test() {
  await connectDB();
  const user = await User.findOne({ email: 'farm@agrilog.com' });
  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User found:', user.email);
    if (!user.passwordHash) {
      console.log('User has no password hash set!');
    } else {
      const isMatch = await bcrypt.compare('123456', user.passwordHash);
      console.log('Password match:', isMatch);
    }
  }
  process.exit(0);
}
test();
