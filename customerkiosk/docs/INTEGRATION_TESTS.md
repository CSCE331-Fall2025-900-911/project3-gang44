# integration testing guide

this document describes how to conduct integration testing for the boba kiosk application.

## prerequisites

- backend server running on port 5000
- frontend dev server running on port 5173
- postgres database accessible
- valid .env files in both frontend and backend directories

## test scenarios

### 1. menu loading flow

**steps:**
1. start backend server: `cd customerkiosk/backend && npm start`
2. start frontend server: `cd customerkiosk/frontend && npm run dev`
3. open browser to http://localhost:5173
4. navigate to menu page
5. verify menu items load from database
6. verify images display correctly
7. verify category filtering works

**expected result:** menu items display correctly with prices and categories

### 2. order creation flow

**steps:**
1. select a drink from menu
2. customize size, temperature, ice level, sweetness
3. add toppings
4. add to cart
5. navigate to cart page
6. verify item shows with correct customizations
7. proceed to checkout
8. complete payment (test mode)
9. verify order confirmation page displays

**expected result:** order is created in database with all customization details

### 3. google authentication flow

**steps:**
1. navigate to auth page
2. click google sign in
3. complete google oauth flow
4. verify user is redirected to appropriate page
5. verify user email is captured

**expected result:** user is authenticated and session is maintained

### 4. cashier mode integration

**steps:**
1. navigate to cashier page
2. add items to order
3. select payment method
4. submit order
5. verify inventory is decremented
6. verify order appears in database

**expected result:** order created and inventory updated correctly

### 5. manager dashboard integration

**steps:**
1. navigate to manager page
2. view sales reports
3. verify data matches database
4. add new product
5. verify product appears in menu
6. update inventory
7. verify changes reflected in cashier view

**expected result:** all crud operations work correctly and data syncs between views

## automated integration testing

to run automated integration tests:

```bash
# ensure both servers are running first
npm run test:integration
```

note: automated integration tests are not yet implemented. manual testing is currently required.

## common issues

1. **cors errors**: verify frontend url is whitelisted in backend cors config
2. **database connection**: check .env file has correct database credentials
3. **payment failures**: ensure stripe keys are valid in .env
4. **missing data**: run database migrations if tables are empty

## testing checklist

- [ ] menu loads correctly
- [ ] customization options work
- [ ] cart management (add/remove/update)
- [ ] checkout process completes
- [ ] payment processing (test mode)
- [ ] order confirmation displays
- [ ] google auth works
- [ ] cashier mode functions
- [ ] manager crud operations
- [ ] inventory updates correctly
- [ ] reports generate accurate data
