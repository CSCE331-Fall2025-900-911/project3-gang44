console.log('🚀 Starting server initialization...');

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

console.log('✅ All dependencies loaded successfully');
console.log('📋 Environment check:');
console.log('   - PORT:', process.env.PORT || '5000 (default)');
console.log('   - DB_HOST:', process.env.DB_HOST ? '✓ set' : '✗ missing');
console.log('   - DB_NAME:', process.env.DB_NAME ? '✓ set' : '✗ missing');
console.log('   - DB_USER:', process.env.DB_USER ? '✓ set' : '✗ missing');
console.log('   - FRONTEND_URL:', process.env.FRONTEND_URL || 'not set (using localhost)');

const app = express();
console.log('✅ Express app created');

// cors stuff
const corsOptions = {
  origin: function (origin, callback) {
    // allow no origin (curl etc)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://localhost:4173",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // allow localhost or render
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.startsWith("https://localhost:") ||
      origin.startsWith("https://127.0.0.1:") ||
      origin.endsWith(".onrender.com")
    ) {
      callback(null, true);
    } else {
      console.log("cors blocked origin:", origin);
      callback(new Error("not allowed by cors"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
console.log('✅ CORS middleware configured');

app.use(express.json());
console.log('✅ JSON body parser configured');

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📨 [${timestamp}] ${req.method} ${req.path}`);
  next();
});
console.log('✅ Request logging middleware configured');

console.log('📝 Registering API routes...');

// get menu
app.get("/api/menu", async (req, res) => {
  try {
    console.log('🔍 Fetching menu from database...');
    const result = await pool.query(`
      SELECT
        item_id as product_id,
        name,
        category,
        price
      FROM products
      ORDER BY category, name
    `);
    console.log(`✅ Menu fetched successfully: ${result.rows.length} items`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching menu:", err);
    console.error("   Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});
console.log('✅ Route registered: GET /api/menu');

// get customizations
app.get("/api/customizations", async (req, res) => {
  try {
    // check what columns exist
    const testQuery = await pool.query(`
      SELECT * FROM ingredients 
      WHERE quantity > 0
      LIMIT 1
    `);
    console.log("sample ingredient:", testQuery.rows[0]);

    const ingredients = await pool.query(`
      SELECT * FROM ingredients 
      WHERE quantity > 0
      ORDER BY name
    `);

    res.json({
      sizes: ["Small", "Medium", "Large"],
      temperatureOptions: ["Cold", "Hot"],
      iceOptions: ["No Ice", "Less Ice", "Regular Ice", "Extra Ice"],
      sweetnessOptions: ["0%", "25%", "50%", "75%", "100%", "125%"],
      toppings: ingredients.rows.map((ing, index) => {
        // try to find some kind of id
        const id =
          ing.ingredient_id ||
          ing.item_id ||
          ing.id ||
          ing.ingredientid ||
          `topping-${index + 1}`;
        return {
          id: id,
          name: ing.name,
          price: 0.5,
        };
      }),
    });
  } catch (err) {
    console.error("error fetching customizations:", err);
    res.status(500).json({ error: err.message });
  }
});

// add order
app.post("/api/orders", async (req, res) => {
  const { items, total, customerEmail } = req.body;

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // add order
      const orderResult = await client.query(
        `INSERT INTO orders (order_date, total_price)
         VALUES (NOW(), $1)
         RETURNING order_id`,
        [total]
      );

      const orderId = orderResult.rows[0].order_id;
      console.log("created order:", orderId);

      // add each item
      for (const item of items) {
        const pricePerUnit = item.price / (item.quantity || 1);
        const subtotal = item.price;

        // build customization string
        const customizationDetails = [
          `Size: ${item.size}`,
          item.temperature ? `Temperature: ${item.temperature}` : null,
          item.temperature !== "Hot" && item.iceLevel ? `Ice: ${item.iceLevel}` : null,
          `Sweetness: ${item.sweetnessLevel}`,
          item.toppings && item.toppings.length > 0
            ? `Toppings: ${item.toppings.map((t) => t.name).join(", ")}`
            : null,
        ]
          .filter(Boolean)
          .join(", ");

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
            subtotal,
          ]
        );
        console.log(`added item: ${item.name}`);
      }

      await client.query("COMMIT");
      console.log("order commited ok"); // small typo intentional
      res.json({ orderId, message: "order placed" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("tx error:", err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("error creating order:", err);
    res.status(500).json({ error: err.message });
  }
});

// google auth
app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;

  try {
    const decoded = jwt.decode(credential);
    if (!decoded) {
      return res.status(401).json({ error: "invalid token" });
    }

    res.json({
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      success: true,
    });
  } catch (err) {
    console.error("auth err:", err);
    res.status(401).json({ error: "invalid token" });
  }
});

// ==================== STRIPE PAYMENT ENDPOINTS ====================

// Create a payment intent for card payments
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        integration_source: 'boba-kiosk',
      },
    });

    console.log('Created payment intent:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Stripe publishable key (for frontend)
app.get('/api/stripe-config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Complete order with payment information
app.post('/api/orders/complete', async (req, res) => {
  const { items, total, customerEmail, paymentMethod, paymentIntentId } = req.body;

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify payment if it's a card payment
      if (paymentMethod === 'CARD' && paymentIntentId) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

          if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment not completed. Please try again.');
          }
        } catch (stripeError) {
          console.error('Stripe verification error:', stripeError);
          throw new Error('Failed to verify payment: ' + stripeError.message);
        }
      }

      // Insert order with payment information
      const orderResult = await client.query(
        `INSERT INTO orders (order_date, total_price, payment_method, order_type, stripe_payment_intent_id)
         VALUES (NOW(), $1, $2, $3, $4)
         RETURNING order_id`,
        [total, paymentMethod, 'CUSTOMER_KIOSK', paymentIntentId || null]
      );

      const orderId = orderResult.rows[0].order_id;
      console.log('Created order:', orderId, 'Payment method:', paymentMethod);

      // Insert order items
      for (const item of items) {
        const pricePerUnit = item.price / (item.quantity || 1);
        const subtotal = item.price;

        // Build customization string
        const customizationDetails = [
          `Size: ${item.size}`,
          item.temperature ? `Temperature: ${item.temperature}` : null,
          item.temperature !== "Hot" && item.iceLevel ? `Ice: ${item.iceLevel}` : null,
          `Sweetness: ${item.sweetnessLevel}`,
          item.toppings && item.toppings.length > 0
            ? `Toppings: ${item.toppings.map((t) => t.name).join(', ')}`
            : null,
        ]
          .filter(Boolean)
          .join(', ');

        const productNameWithCustomization = customizationDetails
          ? `${item.name} (${customizationDetails})`
          : item.name;

        await client.query(
          `INSERT INTO order_items
           (order_id, product_name, quantity, price_per_unit, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, productNameWithCustomization, item.quantity || 1, pricePerUnit, subtotal]
        );
        console.log(`Added item: ${item.name}`);
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
    res.status(500).json({ error: err.message });
  }
});

// ==================== CASHIER MODE ENDPOINTS ====================

// Get all products for cashier mode (simpler than customer menu)
app.get('/api/cashier/products', async (req, res) => {
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
    console.error('Error fetching products for cashier:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get next order ID for display
app.get('/api/cashier/next-order-id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(MAX(order_id), 0) + 1 AS next_id FROM orders
    `);
    res.json({ nextOrderId: result.rows[0].next_id });
  } catch (err) {
    console.error('Error getting next order ID:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit cashier order with inventory updates
app.post('/api/cashier/orders', async (req, res) => {
  const { items, paymentMethod = 'CASH', paymentIntentId } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify payment if it's a card payment
    if (paymentMethod === 'CARD' && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          throw new Error('Payment not completed. Please try again.');
        }
        console.log('Stripe payment verified:', paymentIntentId);
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        throw new Error('Failed to verify payment: ' + stripeError.message);
      }
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of items) {
      totalPrice += item.subtotal;
    }

    // Insert order with timestamp, payment method, and stripe payment intent
    const orderResult = await client.query(
      `INSERT INTO orders (order_date, total_price, payment_method, order_type, stripe_payment_intent_id)
       VALUES (NOW(), $1, $2, $3, $4)
       RETURNING order_id`,
      [totalPrice, paymentMethod, 'CASHIER', paymentIntentId || null]
    );

    const orderId = orderResult.rows[0].order_id;
    console.log('Cashier created order:', orderId);

    // Insert order items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
         (order_id, product_name, quantity, price_per_unit, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          item.product_name,
          item.quantity,
          item.price_per_unit,
          item.subtotal
        ]
      );
    }

    // Decrement inventory for each product's ingredients
    for (const item of items) {
      const productId = item.product_id;
      const orderQuantity = item.quantity;

      // Get ingredients for this product
      const ingredientsResult = await client.query(
        `SELECT ingredient_id, quantity_needed
         FROM product_ingredients
         WHERE product_id = $1`,
        [productId]
      );

      // Decrement each ingredient
      for (const ingredient of ingredientsResult.rows) {
        const totalNeeded = ingredient.quantity_needed * orderQuantity;

        // Check if enough inventory exists
        const inventoryCheck = await client.query(
          `SELECT quantity FROM ingredients WHERE item_id = $1`,
          [ingredient.ingredient_id]
        );

        if (inventoryCheck.rows.length === 0) {
          throw new Error(`Ingredient ID ${ingredient.ingredient_id} not found in inventory`);
        }

        const currentQuantity = inventoryCheck.rows[0].quantity;
        if (currentQuantity < totalNeeded) {
          throw new Error(`Insufficient inventory for ingredient ID ${ingredient.ingredient_id}. Need ${totalNeeded}, have ${currentQuantity}`);
        }

        // Decrement the inventory
        const updateResult = await client.query(
          `UPDATE ingredients
           SET quantity = quantity - $1
           WHERE item_id = $2 AND quantity >= $1
           RETURNING quantity`,
          [totalNeeded, ingredient.ingredient_id]
        );

        if (updateResult.rows.length === 0) {
          throw new Error(`Failed to update inventory for ingredient ID ${ingredient.ingredient_id}`);
        }

        console.log(`Decremented ingredient ${ingredient.ingredient_id} by ${totalNeeded}, new quantity: ${updateResult.rows[0].quantity}`);
      }
    }

    await client.query('COMMIT');
    console.log('Cashier order committed successfully with inventory updates');
    res.json({
      orderId,
      message: 'Order placed successfully',
      totalPrice
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cashier order transaction error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get current inventory status
app.get('/api/cashier/inventory', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        item_id,
        name,
        category,
        quantity
      FROM ingredients
      ORDER BY category, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== MANAGER MODE ENDPOINTS ====================

// Get menu statistics (sales data for products)
app.get('/api/manager/menu-stats', async (req, res) => {
  try {
    const { period = 'day' } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period.toLowerCase()) {
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        break;
      default: // 'day'
        startDate = new Date(endDate);
        startDate.setHours(0, 0, 0, 0);
    }

    // Get all products
    const productsResult = await pool.query(`
      SELECT item_id as product_id, name FROM products ORDER BY category, name
    `);

    // Get sales data for the time period
    const salesResult = await pool.query(`
      SELECT oi.product_name, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_date >= $1 AND o.order_date <= $2
      GROUP BY oi.product_name
    `, [startDate, endDate]);

    const salesMap = {};
    salesResult.rows.forEach(row => {
      salesMap[row.product_name] = parseInt(row.total_sold);
    });

    const stats = productsResult.rows.map(product => ({
      name: product.name,
      totalSold: salesMap[product.name] || 0,
      avgPerDay: period === 'day' ? (salesMap[product.name] || 0) :
                 period === 'week' ? ((salesMap[product.name] || 0) / 7).toFixed(1) :
                 ((salesMap[product.name] || 0) / 30).toFixed(1)
    }));

    res.json(stats);
  } catch (err) {
    console.error('Error fetching menu stats:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all products (for management)
app.get('/api/manager/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT item_id as id, name, category, price
      FROM products
      ORDER BY category, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new product
app.post('/api/manager/products', async (req, res) => {
  const { name, category, price } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO products (item_id, name, category, price)
      VALUES ((SELECT COALESCE(MAX(item_id), 0) + 1 FROM products), $1, $2, $3)
      RETURNING item_id as id, name, category, price
    `, [name, category, price]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update product
app.put('/api/manager/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price } = req.body;

  try {
    const result = await pool.query(`
      UPDATE products
      SET name = $1, category = $2, price = $3
      WHERE item_id = $4
      RETURNING item_id as id, name, category, price
    `, [name, category, price, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/manager/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM products WHERE item_id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get product ingredients
app.get('/api/manager/products/:id/ingredients', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT ingredient_id, quantity_needed
      FROM product_ingredients
      WHERE product_id = $1
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching product ingredients:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update product ingredients
app.put('/api/manager/products/:id/ingredients', async (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body; // Array of {ingredient_id, quantity_needed}

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove existing ingredients
    await client.query('DELETE FROM product_ingredients WHERE product_id = $1', [id]);

    // Add new ingredients
    for (const ing of ingredients) {
      await client.query(`
        INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed)
        VALUES ($1, $2, $3)
      `, [id, ing.ingredient_id, ing.quantity_needed || 1]);
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating product ingredients:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get all ingredients (for management)
app.get('/api/manager/ingredients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT item_id as id, name, category, price, quantity
      FROM ingredients
      ORDER BY category, name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new ingredient
app.post('/api/manager/ingredients', async (req, res) => {
  const { name, category, price } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO ingredients (item_id, name, category, price, quantity)
      VALUES ((SELECT COALESCE(MAX(item_id), 0) + 1 FROM ingredients), $1, $2, $3, 0)
      RETURNING item_id as id, name, category, price, quantity
    `, [name, category, price]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update ingredient
app.put('/api/manager/ingredients/:id', async (req, res) => {
  const { id } = req.params;
  const { price, quantity } = req.body;

  try {
    const result = await pool.query(`
      UPDATE ingredients
      SET price = COALESCE($1, price), quantity = COALESCE($2, quantity)
      WHERE item_id = $3
      RETURNING item_id as id, name, category, price, quantity
    `, [price, quantity, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete ingredient
app.delete('/api/manager/ingredients/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM ingredients WHERE item_id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all employees
app.get('/api/manager/employees', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT employee_id as id, name, role, wage as salary
      FROM employees
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new employee
app.post('/api/manager/employees', async (req, res) => {
  const { name, role, salary } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO employees (employee_id, name, role, wage)
      VALUES ((SELECT COALESCE(MAX(employee_id), 0) + 1 FROM employees), $1, $2, $3)
      RETURNING employee_id as id, name, role, wage as salary
    `, [name, role, salary]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding employee:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update employee
app.put('/api/manager/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, salary } = req.body;

  try {
    const result = await pool.query(`
      UPDATE employees
      SET name = $1, role = $2, wage = $3
      WHERE employee_id = $4
      RETURNING employee_id as id, name, role, wage as salary
    `, [name, role, salary, id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete employee
app.delete('/api/manager/employees/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM employees WHERE employee_id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate X-Report
app.get('/api/manager/reports/x-report', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get orders for today
    const ordersResult = await pool.query(`
      SELECT o.order_id, o.total_price, o.order_date
      FROM orders o
      WHERE o.order_date >= $1
      ORDER BY o.order_date DESC
    `, [today]);

    // Get order items
    const itemsResult = await pool.query(`
      SELECT oi.product_name, SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_date >= $1
      GROUP BY oi.product_name
      ORDER BY quantity DESC
    `, [today]);

    // Get low stock items
    const lowStockResult = await pool.query(`
      SELECT name, quantity
      FROM ingredients
      WHERE quantity < 10
      ORDER BY quantity ASC
    `);

    // Get employee stats
    const employeeResult = await pool.query(`
      SELECT COUNT(*) as count, AVG(wage) as avg_wage
      FROM employees
    `);

    const totalRevenue = ordersResult.rows.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
    const totalItems = itemsResult.rows.reduce((sum, item) => sum + parseInt(item.quantity), 0);

    res.json({
      date: today,
      totalOrders: ordersResult.rows.length,
      totalRevenue,
      totalItems,
      topItems: itemsResult.rows.slice(0, 5),
      lowStock: lowStockResult.rows,
      employeeCount: parseInt(employeeResult.rows[0].count),
      avgWage: parseFloat(employeeResult.rows[0].avg_wage) || 0
    });
  } catch (err) {
    console.error('Error generating X-report:', err);
    res.status(500).json({ error: err.message });
  }
});

// Generate Product Usage Report
app.get('/api/manager/reports/product-usage', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get orders in date range
    const itemsResult = await pool.query(`
      SELECT oi.product_name, SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_date >= $1 AND o.order_date <= $2
      GROUP BY oi.product_name
      ORDER BY quantity DESC
    `, [startDate, endDate]);

    // Get all products with their ingredients
    const productsResult = await pool.query(`
      SELECT p.item_id, p.name, pi.ingredient_id, i.name as ingredient_name, pi.quantity_needed
      FROM products p
      LEFT JOIN product_ingredients pi ON p.item_id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.item_id
      ORDER BY p.name, i.name
    `);

    // Calculate ingredient usage
    const ingredientUsage = {};
    const productSales = {};

    itemsResult.rows.forEach(item => {
      productSales[item.product_name] = parseInt(item.quantity);
    });

    productsResult.rows.forEach(row => {
      if (row.ingredient_id && productSales[row.name]) {
        const usage = productSales[row.name] * (row.quantity_needed || 1);
        ingredientUsage[row.ingredient_name] = (ingredientUsage[row.ingredient_name] || 0) + usage;
      }
    });

    const ingredientUsageArray = Object.entries(ingredientUsage)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    res.json({
      startDate,
      endDate,
      productsSold: itemsResult.rows,
      ingredientsUsed: ingredientUsageArray,
      totalProducts: itemsResult.rows.reduce((sum, item) => sum + parseInt(item.quantity), 0),
      totalIngredients: Object.values(ingredientUsage).reduce((sum, qty) => sum + qty, 0)
    });
  } catch (err) {
    console.error('Error generating product usage report:', err);
    res.status(500).json({ error: err.message });
  }
});

// Payment Tracking Endpoint
app.get('/api/manager/payments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log(`📊 Fetching payment data from ${startDate} to ${endDate}`);

    // Use date strings directly - PostgreSQL will handle the comparison correctly
    // Add 1 day to endDate to include all transactions on that day
    const endDatePlusOne = new Date(endDate);
    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
    const endDateStr = endDatePlusOne.toISOString().split('T')[0];

    // Get payment data from orders
    const paymentResult = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE DATE(order_date) >= $1 AND DATE(order_date) < $2
      GROUP BY payment_method
    `, [startDate, endDateStr]);

    // Get daily breakdown
    const dailyResult = await pool.query(`
      SELECT 
        DATE(order_date) as date,
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE DATE(order_date) >= $1 AND DATE(order_date) < $2
      GROUP BY DATE(order_date), payment_method
      ORDER BY DATE(order_date) ASC
    `, [startDate, endDateStr]);

    // Process payment summary
    let cardTotal = 0;
    let cardCount = 0;
    let cashTotal = 0;
    let cashCount = 0;

    paymentResult.rows.forEach(row => {
      if (row.payment_method && (row.payment_method.toLowerCase() === 'card' || row.payment_method.toLowerCase() === 'stripe')) {
        cardTotal += parseFloat(row.total) || 0;
        cardCount += parseInt(row.count) || 0;
      } else if (row.payment_method && row.payment_method.toLowerCase() === 'cash') {
        cashTotal += parseFloat(row.total) || 0;
        cashCount += parseInt(row.count) || 0;
      }
    });

    // Process daily breakdown
    const paymentsByDay = {};
    dailyResult.rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      if (!paymentsByDay[dateStr]) {
        paymentsByDay[dateStr] = { date: dateStr, cardAmount: 0, cashAmount: 0 };
      }

      if (row.payment_method && (row.payment_method.toLowerCase() === 'card' || row.payment_method.toLowerCase() === 'stripe')) {
        paymentsByDay[dateStr].cardAmount += parseFloat(row.total) || 0;
      } else if (row.payment_method && row.payment_method.toLowerCase() === 'cash') {
        paymentsByDay[dateStr].cashAmount += parseFloat(row.total) || 0;
      }
    });

    res.json({
      cardTotal: Math.round(cardTotal * 100) / 100,
      cardCount,
      cashTotal: Math.round(cashTotal * 100) / 100,
      cashCount,
      paymentsByDay: Object.values(paymentsByDay)
    });
  } catch (err) {
    console.error('Error fetching payment data:', err);
    res.status(500).json({ error: err.message });
  }
});

console.log('\n🔧 Setting up error handlers...');

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('\n❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('⚠️  Server will continue running but this should be fixed!\n');
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌❌❌ UNHANDLED REJECTION ❌❌❌');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('⚠️  Server will continue running but this should be fixed!\n');
  // Don't exit - keep server running
});

process.on('exit', (code) => {
  console.error(`\n⚠️⚠️⚠️  PROCESS EXITING with code: ${code} ⚠️⚠️⚠️`);
  console.trace('Exit trace:');
});

console.log('✅ Error handlers configured');

// start server
console.log('\n🌐 Starting HTTP server...');
const PORT = process.env.PORT || 5000;

let server;
try {
  server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('✅✅✅ SERVER STARTED SUCCESSFULLY ✅✅✅');
    console.log('='.repeat(50));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    console.log('\n👂 Server is listening and ready to accept requests...\n');
    console.log('Press Ctrl+C to stop the server\n');
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('\n❌❌❌ SERVER ERROR ❌❌❌');
    console.error('Error:', err.message);
    console.error('Code:', err.code);

    if (err.code === 'EADDRINUSE') {
      console.error(`\n🚫 Port ${PORT} is already in use!`);
      console.error('Solutions:');
      console.error('  1. Stop any other server running on port', PORT);
      console.error('  2. Or change the PORT in your .env file');
      console.error('  3. Or run: npx kill-port', PORT);
      process.exit(1);
    } else {
      console.error('Stack:', err.stack);
      process.exit(1);
    }
  });

  server.on('listening', () => {
    console.log('✅ Server listening event triggered');
  });

} catch (err) {
  console.error('\n❌❌❌ FAILED TO START SERVER ❌❌❌');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}

// Keep alive check
setInterval(() => {
  console.log(`💓 Server heartbeat - Still running at ${new Date().toLocaleTimeString()}`);
}, 60000); // Every minute

console.log('✅ Server initialization complete - waiting for listen callback...');
