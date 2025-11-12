const express = require("express");
const cors = require("cors");
const pool = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

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
app.use(express.json());

// get menu
app.get("/api/menu", async (req, res) => {
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
    console.error("error fetching menu:", err);
    res.status(500).json({ error: err.message });
  }
});

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
      iceOptions: ["No Ice", "Less Ice", "Regular Ice", "Extra Ice"],
      sweetnessOptions: ["0%", "25%", "50%", "75%", "100%"],
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
          `Ice: ${item.iceLevel}`,
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

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
