console.log('📦 Loading database configuration...');

const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Database connection settings:');
console.log('   - Host:', process.env.DB_HOST || '❌ NOT SET');
console.log('   - Port:', process.env.DB_PORT || '5432 (default)');
console.log('   - Database:', process.env.DB_NAME || '❌ NOT SET');
console.log('   - User:', process.env.DB_USER || '❌ NOT SET');
console.log('   - Password:', process.env.DB_PASSWORD ? '✓ set (hidden)' : '❌ NOT SET');

if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('\n❌❌❌ CRITICAL ERROR ❌❌❌');
  console.error('Missing required database environment variables!');
  console.error('Please check your .env file in the backend directory.');
  console.error('Required variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD\n');
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

console.log('✅ Database pool created');

// Test connection
console.log('🔌 Testing database connection...');
pool.connect()
  .then(client => {
    console.log('✅ Connected to PSQL database');
    // Test a simple query
    return client.query('SELECT NOW()').then(result => {
      console.log('✅ Database query test successful');
      console.log('   Server time:', result.rows[0].now);
      client.release();
    });
  })
  .catch(err => {
    console.error('\n❌❌❌ PSQL CONNECTION ERROR ❌❌❌');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    console.error('\n⚠️  The server may not function properly without database access!\n');
  });

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('\n❌ Unexpected database pool error:');
  console.error('Error:', err.message);
  console.error('Client:', client);
  // Don't exit - let the server handle it
});

console.log('✅ Database module loaded\n');

module.exports = pool;
