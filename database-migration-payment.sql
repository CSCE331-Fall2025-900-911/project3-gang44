-- Database Migration: Add Payment Method and Order Type Support
-- Run this script on your gang_44_db database
-- Author: Gang 44 Team
-- Date: 2025-12-06

-- Step 1: Add payment_method column to orders table
-- This tracks whether the customer paid with CASH or CARD
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'CASH';

-- Step 2: Add order_type column to orders table
-- This tracks where the order was placed (CUSTOMER_KIOSK, CASHIER, or MANAGER)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(30) DEFAULT 'CUSTOMER_KIOSK';

-- Step 3: Add stripe_payment_intent_id for tracking Stripe payments (optional but recommended)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100);

-- Step 4: Add comments to document the new columns
COMMENT ON COLUMN orders.payment_method IS 'Payment method used: CASH or CARD';
COMMENT ON COLUMN orders.order_type IS 'Source of order: CUSTOMER_KIOSK, CASHIER, or MANAGER';
COMMENT ON COLUMN orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID for card payments (null for cash)';

-- Step 5: Create an index on payment_method for faster reporting queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- Step 6: Create an index on order_type for faster reporting queries
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- Verification queries (uncomment to run after migration)
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'orders'
-- ORDER BY ordinal_position;

-- Sample query to test the new columns
-- SELECT order_id, order_date, total_price, payment_method, order_type, stripe_payment_intent_id
-- FROM orders
-- ORDER BY order_id DESC
-- LIMIT 10;

-- Update existing orders to have default values (if needed)
UPDATE orders
SET payment_method = 'CASH',
    order_type = 'CUSTOMER_KIOSK'
WHERE payment_method IS NULL OR order_type IS NULL;

-- Summary
-- ========
-- This migration adds:
-- 1. payment_method: Tracks if customer paid with CASH or CARD
-- 2. order_type: Tracks if order was from CUSTOMER_KIOSK, CASHIER, or MANAGER
-- 3. stripe_payment_intent_id: Stores Stripe transaction ID for card payments
-- 4. Indexes for better query performance
-- 5. Updates existing orders with default values
