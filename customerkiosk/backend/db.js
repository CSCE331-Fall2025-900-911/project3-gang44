const { Pool } = require('pg');
require('dotenv').config();

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

// Test connection
pool.connect()
  .then(client => {
    console.log('✅ Connected to PSQL database');
    client.release();
  })
  .catch(err => {
    console.error('❌ PSQL connection error:', err);
  });

module.exports = pool;
