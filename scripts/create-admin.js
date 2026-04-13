// scripts/create-admin.js
// Dhameys Airlines — Create first superadmin user
// Usage: node scripts/create-admin.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const readline = require('readline');

const pool = new Pool({
  host:     process.env.POSTGRES_HOST || 'localhost',
  port:     parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB   || 'dhameys_main',
  user:     process.env.POSTGRES_USER || 'dhameys_user',
  password: process.env.POSTGRES_PASSWORD,
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

async function main() {
  console.log('\n🛫  Dhameys Airlines — Create Superadmin\n');

  const email     = await ask('Email:      ');
  const password  = await ask('Password:   ');
  const firstName = await ask('First Name: ');
  const lastName  = await ask('Last Name:  ');
  rl.close();

  if (!email || !password || password.length < 8) {
    console.error('Invalid input — password must be at least 8 characters'); process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO users
       (email, password_hash, first_name, last_name, role, status,
        email_verified, gdpr_consent, gdpr_consent_date)
     VALUES ($1,$2,$3,$4,'superadmin','active',TRUE,TRUE,NOW())
     ON CONFLICT (email) DO UPDATE
       SET role='superadmin', status='active', password_hash=$2
     RETURNING id, email, role`,
    [email.toLowerCase().trim(), hash, firstName.trim(), lastName.trim()]
  );

  console.log('\n✅  Superadmin created successfully!');
  console.log('   ID:    ', rows[0].id);
  console.log('   Email: ', rows[0].email);
  console.log('   Role:  ', rows[0].role);
  console.log('\nYou can now log in at /login and access /admin\n');

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
