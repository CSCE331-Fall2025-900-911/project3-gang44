# api documentation

base url: `http://localhost:5000` (local) or your deployed url

## authentication endpoints

### google oauth
`POST /api/auth/google`

authenticates user with google oauth token.

**request body:**
```json
{
  "credential": "google_oauth_token_string"
}
```

**response:**
```json
{
  "email": "user@tamu.edu",
  "name": "john doe",
  "picture": "profile_url",
  "success": true
}
```

## menu endpoints

### get menu
`GET /api/menu`

returns all available menu items.

**response:**
```json
[
  {
    "product_id": 1,
    "name": "milk tea",
    "category": "tea",
    "price": "5.99"
  }
]
```

### get customization options
`GET /api/customizations`

returns available customization options for drinks.

**response:**
```json
{
  "sizes": ["Small", "Medium", "Large"],
  "temperatureOptions": ["Cold", "Hot"],
  "iceOptions": ["No Ice", "Less Ice", "Regular Ice", "Extra Ice"],
  "sweetnessOptions": ["0%", "25%", "50%", "75%", "100%", "125%"],
  "toppings": [
    { "id": 1, "name": "boba", "price": 0.5 }
  ]
}
```

## order endpoints

### create payment intent
`POST /api/create-payment-intent`

creates a stripe payment intent for card payments.

**request body:**
```json
{
  "amount": 15.99
}
```

**response:**
```json
{
  "clientSecret": "stripe_client_secret",
  "paymentIntentId": "pi_xxxxx"
}
```

### get stripe config
`GET /api/stripe-config`

returns stripe publishable key.

**response:**
```json
{
  "publishableKey": "pk_test_xxxxx"
}
```

### complete order
`POST /api/orders/complete`

completes an order with payment information.

**request body:**
```json
{
  "items": [
    {
      "name": "milk tea",
      "size": "Medium",
      "temperature": "Cold",
      "iceLevel": "Regular Ice",
      "sweetnessLevel": "50%",
      "toppings": [{"name": "boba", "price": 0.5}],
      "price": 6.49,
      "quantity": 1
    }
  ],
  "total": 6.49,
  "customerEmail": "user@tamu.edu",
  "paymentMethod": "CARD",
  "paymentIntentId": "pi_xxxxx"
}
```

**response:**
```json
{
  "orderId": 123,
  "message": "Order placed successfully"
}
```

## cashier endpoints

### get cashier products
`GET /api/cashier/products`

returns simplified product list for cashier mode.

**response:**
```json
[
  {
    "product_id": 1,
    "name": "milk tea",
    "category": "tea",
    "price": "5.99"
  }
]
```

### get next order id
`GET /api/cashier/next-order-id`

returns the next available order id for display.

**response:**
```json
{
  "nextOrderId": 124
}
```

### create cashier order
`POST /api/cashier/orders`

creates an order from cashier mode and updates inventory.

**request body:**
```json
{
  "items": [
    {
      "product_id": 1,
      "product_name": "milk tea",
      "quantity": 2,
      "price_per_unit": 5.99,
      "subtotal": 11.98
    }
  ],
  "paymentMethod": "CASH"
}
```

**response:**
```json
{
  "orderId": 125,
  "message": "Order placed successfully",
  "totalPrice": 11.98
}
```

### get inventory
`GET /api/cashier/inventory`

returns current inventory status.

**response:**
```json
[
  {
    "item_id": 1,
    "name": "boba pearls",
    "category": "toppings",
    "quantity": 50
  }
]
```

## manager endpoints

### get menu statistics
`GET /api/manager/menu-stats?period=day`

returns sales statistics for products.

**query params:**
- period: "day", "week", or "month"

**response:**
```json
[
  {
    "name": "milk tea",
    "totalSold": 25,
    "avgPerDay": "25"
  }
]
```

### get products
`GET /api/manager/products`

returns all products for management.

**response:**
```json
[
  {
    "id": 1,
    "name": "milk tea",
    "category": "tea",
    "price": "5.99"
  }
]
```

### add product
`POST /api/manager/products`

adds a new product to the menu.

**request body:**
```json
{
  "name": "new drink",
  "category": "tea",
  "price": 6.99
}
```

**response:**
```json
{
  "id": 10,
  "name": "new drink",
  "category": "tea",
  "price": "6.99"
}
```

### update product
`PUT /api/manager/products/:id`

updates an existing product.

**request body:**
```json
{
  "name": "updated name",
  "category": "coffee",
  "price": 7.99
}
```

**response:**
```json
{
  "id": 10,
  "name": "updated name",
  "category": "coffee",
  "price": "7.99"
}
```

### delete product
`DELETE /api/manager/products/:id`

deletes a product.

**response:**
```json
{
  "success": true
}
```

### get product ingredients
`GET /api/manager/products/:id/ingredients`

gets ingredients for a specific product.

**response:**
```json
[
  {
    "ingredient_id": 1,
    "quantity_needed": 2
  }
]
```

### update product ingredients
`PUT /api/manager/products/:id/ingredients`

updates ingredients for a product.

**request body:**
```json
{
  "ingredients": [
    {
      "ingredient_id": 1,
      "quantity_needed": 2
    }
  ]
}
```

**response:**
```json
{
  "success": true
}
```

### get ingredients
`GET /api/manager/ingredients`

returns all ingredients for management.

**response:**
```json
[
  {
    "id": 1,
    "name": "boba pearls",
    "category": "toppings",
    "price": "0.50",
    "quantity": 100
  }
]
```

### add ingredient
`POST /api/manager/ingredients`

adds a new ingredient.

**request body:**
```json
{
  "name": "new topping",
  "category": "toppings",
  "price": 0.75
}
```

### update ingredient
`PUT /api/manager/ingredients/:id`

updates ingredient price or quantity.

**request body:**
```json
{
  "price": 0.60,
  "quantity": 150
}
```

### delete ingredient
`DELETE /api/manager/ingredients/:id`

deletes an ingredient.

### get employees
`GET /api/manager/employees`

returns all employees.

**response:**
```json
[
  {
    "id": 1,
    "name": "jane smith",
    "role": "cashier",
    "salary": "15.00"
  }
]
```

### add employee
`POST /api/manager/employees`

adds a new employee.

**request body:**
```json
{
  "name": "new employee",
  "role": "barista",
  "salary": 16.00
}
```

### update employee
`PUT /api/manager/employees/:id`

updates employee information.

### delete employee
`DELETE /api/manager/employees/:id`

deletes an employee.

### generate x-report
`GET /api/manager/reports/x-report`

generates daily sales report.

**response:**
```json
{
  "date": "2025-12-10T00:00:00.000Z",
  "totalOrders": 45,
  "totalRevenue": 312.50,
  "totalItems": 78,
  "topItems": [
    {"product_name": "milk tea", "quantity": "15"}
  ],
  "lowStock": [
    {"name": "boba pearls", "quantity": 8}
  ],
  "employeeCount": 5,
  "avgWage": 15.50
}
```

### generate product usage report
`GET /api/manager/reports/product-usage?startDate=2025-12-01&endDate=2025-12-10`

generates ingredient usage report.

**query params:**
- startDate: yyyy-mm-dd
- endDate: yyyy-mm-dd

**response:**
```json
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-10",
  "productsSold": [
    {"product_name": "milk tea", "quantity": "50"}
  ],
  "ingredientsUsed": [
    {"name": "boba pearls", "quantity": 100}
  ],
  "totalProducts": 150,
  "totalIngredients": 300
}
```

### get payment tracking
`GET /api/manager/payments?startDate=2025-12-01&endDate=2025-12-10`

tracks payment methods over time.

**query params:**
- startDate: yyyy-mm-dd
- endDate: yyyy-mm-dd

**response:**
```json
{
  "cardTotal": 1250.50,
  "cardCount": 45,
  "cashTotal": 850.00,
  "cashCount": 30,
  "paymentsByDay": [
    {
      "date": "2025-12-01",
      "cardAmount": 125.50,
      "cashAmount": 85.00
    }
  ]
}
```

## error responses

all endpoints may return error responses in this format:

```json
{
  "error": "error message description"
}
```

common http status codes:
- 200: success
- 400: bad request
- 401: unauthorized
- 500: server error

## cors

the api allows requests from:
- localhost (any port)
- *.onrender.com domains
- configured frontend url from environment variables
