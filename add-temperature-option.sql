-- Add temperature option support for hot/cold drinks
-- This migration doesn't require database schema changes since we're just
-- adding new customization options that will be handled in the application layer

-- The temperature options (Hot/Cold) will be:
-- 1. Returned by the /api/customizations endpoint
-- 2. Stored in the customization details string in order_items.product_name

-- No schema changes needed - the existing product_name field in order_items
-- already stores customization details as a string, so we can include temperature info there

-- Example: "Milk Tea (Size: Medium, Temperature: Hot, Sweetness: 50%)"

-- This is just a documentation file to track this feature addition
