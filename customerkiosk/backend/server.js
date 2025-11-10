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
      SELECT * FROM products 
      ORDER BY category, name
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching menu:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customizations', async (req, res) => {
  try {
    const ingredients = await pool.query(`
      SELECT * FROM ingredients 
      WHERE quantity > 0
      ORDER BY name
    `);
    
    res.json({
      sizes: ['Small', 'Medium', 'Large'],
      iceOptions: ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'],
      sweetnessOptions: ['0%', '25%', '50%', '75%', '100%'],
      toppings: ingredients.rows.map(ing => ({
        id: ing.ingredient_id,
        name: ing.name,
        price: 0.50 
      }))
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
      
      const orderResult = await client.query(
        `INSERT INTO orders (employee_id, order_date, total_price) 
         VALUES ($1, NOW(), $2) 
         RETURNING order_id`,
        [1, total]
      );
      
      const orderId = orderResult.rows[0].order_id;
      
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items 
           (order_id, product_id, quantity, customization) 
           VALUES ($1, $2, $3, $4)`,
          [
            orderId, 
            item.menuItemId, 
            item.quantity || 1,
            JSON.stringify({
              size: item.size,
              iceLevel: item.iceLevel,
              sweetnessLevel: item.sweetnessLevel,
              toppings: item.toppings
            })
          ]
        );
      }
      
      await client.query('COMMIT');
      res.json({ orderId, message: 'Order placed successfully' });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating order:', err);
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