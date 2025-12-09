/**
 * Database Migration Script
 * Adds payment_method, order_type, and stripe_payment_intent_id to orders table
 */

const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, '../../database-migration-payment.sql');
    console.log('📄 Reading migration file:', sqlPath);

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ Migration file loaded successfully\n');

    // Execute the migration
    console.log('⚙️  Executing migration SQL...');
    await pool.query(sql);
    console.log('✅ Migration executed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying new columns...');
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'orders'
        AND column_name IN ('payment_method', 'order_type', 'stripe_payment_intent_id')
      ORDER BY column_name;
    `);

    console.log('\n📊 New columns added to orders table:');
    console.table(verifyResult.rows);

    // Show sample data
    console.log('\n📋 Sample orders with new columns:');
    const sampleResult = await pool.query(`
      SELECT order_id, order_date, total_price, payment_method, order_type, stripe_payment_intent_id
      FROM orders
      ORDER BY order_id DESC
      LIMIT 5;
    `);

    if (sampleResult.rows.length > 0) {
      console.table(sampleResult.rows);
    } else {
      console.log('   (No orders in database yet)');
    }

    console.log('\n✅✅✅ MIGRATION COMPLETED SUCCESSFULLY ✅✅✅');
    console.log('\nNext steps:');
    console.log('1. Install Stripe dependencies: npm install stripe');
    console.log('2. Update backend endpoints to handle payment methods');
    console.log('3. Create checkout page in frontend\n');

  } catch (error) {
    console.error('\n❌❌❌ MIGRATION FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('\nPlease fix the error and try again.\n');
    process.exit(1);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
runMigration();
