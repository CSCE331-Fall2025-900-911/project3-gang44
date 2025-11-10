const express = require('express');
const cors = require('cors');
const pool = require('./db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/menu', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        item_id as product_id,
        name,
        category,
        price
      FROM products 
      ORDER BY category, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customizations', async (req, res) => {
  try {
    // First, let's see what columns exist
    const testQuery = await pool.query(`
      SELECT * FROM ingredients 
      WHERE quantity > 0
      LIMIT 1
    `);
    console.log('Sample ingredient row:', testQuery.rows[0]);
    console.log('Sample ingredient keys:', testQuery.rows[0] ? Object.keys(testQuery.rows[0]) : 'No rows');
    
    const ingredients = await pool.query(`
      SELECT * FROM ingredients 
      WHERE quantity > 0
      ORDER BY name
    `);
    
    res.json({
      sizes: ['Small', 'Medium', 'Large'],
      iceOptions: ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'],
      sweetnessOptions: ['0%', '25%', '50%', '75%', '100%'],
      toppings: ingredients.rows.map((ing, index) => {
        // Try multiple possible column names for the ID
        const id = ing.ingredient_id || ing.item_id || ing.id || ing.ingredientid || `topping-${index + 1}`;
        console.log(`Topping ${index}: name="${ing.name}", id=${id}, available keys:`, Object.keys(ing));
        return {
          id: id,
          name: ing.name,
          price: 0.50 
        };
      })
    });
  } catch (err) {
    console.error('Error fetching customizations:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { items, total, customerEmail } = req.body;

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert into orders table (no employee_id column, just order_date and total_price)
      const orderResult = await client.query(
        `INSERT INTO orders (order_date, total_price)
         VALUES (NOW(), $1)
         RETURNING order_id`,
        [total]
      );

      const orderId = orderResult.rows[0].order_id;
      console.log('Created order:', orderId);

      // Insert each item into order_items
      for (const item of items) {
        const pricePerUnit = item.price / (item.quantity || 1);
        const subtotal = item.price;

        // Build customization details string
        const customizationDetails = [
          `Size: ${item.size}`,
          `Ice: ${item.iceLevel}`,
          `Sweetness: ${item.sweetnessLevel}`,
          item.toppings && item.toppings.length > 0
            ? `Toppings: ${item.toppings.map(t => t.name).join(', ')}`
            : null
        ].filter(Boolean).join(', ');

        // Add customization to product name if there are any
        const productNameWithCustomization = customizationDetails
          ? `${item.name} (${customizationDetails})`
          : item.name;

        await client.query(
          `INSERT INTO order_items
           (order_id, product_name, quantity, price_per_unit, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            orderId,
            productNameWithCustomization,
            item.quantity || 1,
            pricePerUnit,
            subtotal
          ]
        );
        console.log(`Added item: ${item.name} to order ${orderId}`);
      }

      await client.query('COMMIT');
      console.log('Order committed successfully');
      res.json({ orderId, message: 'Order placed successfully' });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating order:', err);
    console.error('Error details:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  
  try {
    const decoded = jwt.decode(credential);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({ 
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      success: true 
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});