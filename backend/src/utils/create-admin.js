// src/utils/create-admin.js — Create first superadmin
// Usage: node src/utils/create-admin.js

require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const readline = require('readline');

const User = require('../models/User');

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dhameys', { dbName: process.env.MONGODB_DB || 'dhameys' });
  console.log('\n🛫  Dhameys Airlines — Create Superadmin\n');

  const email     = (await ask('Email:      ')).trim().toLowerCase();
  const password  = await ask('Password:   ');
  const firstName = (await ask('First Name: ')).trim();
  const lastName  = (await ask('Last Name:  ')).trim();
  rl.close();

  if (!email || !password || password.length < 8) { console.error('Invalid input'); process.exit(1); }

  const existing = await User.findOne({ email });
  if (existing) {
    await User.findByIdAndUpdate(existing._id, { role: 'superadmin', status: 'active', passwordHash: await bcrypt.hash(password, 12) });
    console.log('\n✅  Existing user updated to superadmin:', email);
  } else {
    const user = await User.create({
      email, passwordHash: await bcrypt.hash(password, 12),
      firstName, lastName, role: 'superadmin', status: 'active',
      emailVerified: true, gdprConsent: true, gdprConsentDate: new Date(),
    });
    console.log('\n✅  Superadmin created!');
    console.log('   ID:   ', user._id.toString());
    console.log('   Email:', user.email);
  }
  console.log('\nLog in at /login and visit /admin\n');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
