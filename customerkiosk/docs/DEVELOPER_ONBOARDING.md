# developer onboarding guide

welcome to the boba kiosk project. this guide will help you get set up and start contributing.

## project overview

the boba kiosk is a full-stack web application for managing a boba tea shop. it includes:

- **customer kiosk**: customers can browse menu, customize drinks, and place orders
- **cashier mode**: staff can take orders and process payments
- **manager dashboard**: managers can view reports, manage inventory, products, and employees

**tech stack:**
- frontend: react 19, vite, react router
- backend: node.js, express 5
- database: postgresql
- payments: stripe
- auth: google oauth
- hosting: render

## prerequisites

before starting, ensure you have:

- node.js 18+ installed
- npm installed
- git installed
- postgres client (optional, for local db)
- code editor (vs code recommended)
- github account with repo access

## initial setup

### 1. clone the repository

```bash
git clone https://github.com/CSCE331-Fall2025-900-911/project3-gang44.git
cd project3-gang44
```

### 2. get environment variables

contact the team lead to get:
- backend .env file
- frontend .env file

these files contain sensitive keys and database credentials.

place them in:
- `customerkiosk/backend/.env`
- `customerkiosk/frontend/.env`

### 3. install backend dependencies

```bash
cd customerkiosk/backend
npm install
```

### 4. install frontend dependencies

```bash
cd ../frontend
npm install
```

### 5. verify setup

backend:
```bash
cd customerkiosk/backend
npm start
```

you should see:
```
SERVER STARTED SUCCESSFULLY
Port: 5000
```

frontend (in new terminal):
```bash
cd customerkiosk/frontend
npm run dev
```

you should see:
```
Local: http://localhost:5173
```

open http://localhost:5173 in your browser. you should see the landing page.

## project structure

```
project3-gang44/
├── customerkiosk/
│   ├── backend/
│   │   ├── server.js          # main server file
│   │   ├── db.js              # database connection
│   │   ├── run-migration.js   # database setup script
│   │   ├── package.json
│   │   └── .env               # environment variables (not in git)
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── pages/         # page components
│   │   │   ├── components/    # reusable components
│   │   │   ├── context/       # react context (app state)
│   │   │   ├── config/        # configuration files
│   │   │   ├── test/          # test setup
│   │   │   ├── App.jsx        # main app component
│   │   │   └── main.jsx       # app entry point
│   │   ├── public/            # static assets
│   │   ├── package.json
│   │   ├── vite.config.js     # vite configuration
│   │   └── .env               # environment variables (not in git)
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT.md
│   ├── MAINTENANCE.md
│   ├── INTEGRATION_TESTS.md
│   └── DEVELOPER_ONBOARDING.md (this file)
├── render.yaml                # render deployment config
└── README.md                  # basic setup instructions
```

## key files to know

### backend

- **server.js**: all api endpoints defined here
  - menu endpoints
  - order creation
  - payment processing
  - manager crud operations
  - reports generation

- **db.js**: postgres connection pool configuration

- **.env**: contains database credentials, stripe keys, etc.

### frontend

- **App.jsx**: main app with routing
- **context/AppContext.jsx**: global state management (cart, user, translations)
- **pages/**: each page component
  - MenuPage.jsx
  - CartPage.jsx
  - CheckoutPage.jsx
  - CashierPage.jsx
  - ManagerPage.jsx
- **components/**: reusable components like GoogleAuth, StripePaymentForm, etc.

## common development tasks

### running the development environment

always need two terminals:

terminal 1 (backend):
```bash
cd customerkiosk/backend
npm start
```

terminal 2 (frontend):
```bash
cd customerkiosk/frontend
npm run dev
```

### making code changes

1. create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. make your changes

3. test locally:
```bash
# frontend tests
cd customerkiosk/frontend
npm test

# backend tests
cd customerkiosk/backend
npm test
```

4. commit changes:
```bash
git add .
git commit -m "description of changes"
```

5. push to github:
```bash
git push origin feature/your-feature-name
```

6. create pull request on github

### adding a new api endpoint

1. open `customerkiosk/backend/server.js`

2. add your endpoint:
```javascript
app.get('/api/your-endpoint', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM your_table');
    res.json(result.rows);
  } catch (err) {
    console.error('error:', err);
    res.status(500).json({ error: err.message });
  }
});
```

3. test with curl:
```bash
curl http://localhost:5000/api/your-endpoint
```

4. update API_DOCUMENTATION.md

### adding a new page

1. create page component:
```bash
cd customerkiosk/frontend/src/pages
touch NewPage.jsx
```

2. add basic structure:
```jsx
export default function NewPage() {
  return (
    <div className="new-page">
      <h1>New Page</h1>
    </div>
  );
}
```

3. add route in `App.jsx`:
```jsx
import NewPage from './pages/NewPage';

// in Routes section
<Route path="/new-page" element={<NewPage />} />
```

4. test by navigating to http://localhost:5173/new-page

### database queries

examples of common queries:

get all products:
```sql
SELECT * FROM products ORDER BY category, name;
```

get orders with items:
```sql
SELECT o.order_id, o.order_date, o.total_price, oi.product_name, oi.quantity
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.order_date >= '2025-12-01';
```

update inventory:
```sql
UPDATE ingredients
SET quantity = quantity - 10
WHERE item_id = 5;
```

### working with translations

the app supports multiple languages (english, spanish, vietnamese).

add new translation key:

1. in component:
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('myNewKey')}</h1>;
}
```

2. translations are handled by the backend api for database content (product names, etc.)

## testing

### run frontend tests
```bash
cd customerkiosk/frontend
npm test
```

### run backend tests
```bash
cd customerkiosk/backend
npm test
```

### manual testing checklist

before submitting a pr, test:

- [ ] menu page loads
- [ ] can add items to cart
- [ ] can customize drink options
- [ ] cart updates correctly
- [ ] checkout process works
- [ ] cashier mode functions
- [ ] manager crud operations work
- [ ] no console errors
- [ ] mobile responsive

## debugging tips

### backend debugging

add logging:
```javascript
console.log('variable value:', myVariable);
```

use node debugger:
```bash
node --inspect server.js
```

check database connection:
```javascript
pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res);
});
```

### frontend debugging

use react devtools browser extension

check console for errors (F12 in browser)

log state changes:
```javascript
useEffect(() => {
  console.log('cart updated:', cart);
}, [cart]);
```

### common errors

**error: ECONNREFUSED**
- backend not running
- wrong api url in frontend .env

**error: relation "products" does not exist**
- database not set up
- run migration: `node run-migration.js`

**error: cors blocked**
- frontend url not whitelisted in backend
- check cors config in server.js

**error: stripe key invalid**
- check .env file
- verify using correct test/live keys

## code style guide

### general

- use lowercase for everything (variables, functions, files)
- use descriptive names
- add comments for complex logic
- keep functions small and focused

### javascript/jsx

```javascript
// good
const handleButtonClick = () => {
  const result = calculateTotal(items);
  setTotal(result);
};

// avoid
const f = () => {
  const x = calc(y);
  set(x);
};
```

### database queries

use parameterized queries:
```javascript
// good
pool.query('SELECT * FROM products WHERE category = $1', [category]);

// never do this (sql injection risk)
pool.query(`SELECT * FROM products WHERE category = '${category}'`);
```

## git workflow

### branch naming

- feature/description-here
- fix/bug-description
- docs/what-changed

examples:
- feature/add-loyalty-points
- fix/cart-quantity-bug
- docs/update-readme

### commit messages

format: `action: description`

examples:
- `add: new payment method support`
- `fix: cart total calculation error`
- `update: deployment documentation`
- `refactor: simplify order creation logic`

### pull requests

1. create pr with clear title
2. describe what changed
3. reference any related issues
4. request review from team member
5. address feedback
6. merge when approved

## useful commands

### backend
```bash
npm start              # start server
npm test              # run tests
node run-migration.js # set up database
```

### frontend
```bash
npm run dev    # start dev server
npm run build  # build for production
npm test       # run tests
npm run lint   # check code style
```

### git
```bash
git status                    # see changes
git add .                     # stage all changes
git commit -m "message"       # commit
git push                      # push to github
git pull                      # get latest changes
git checkout -b branch-name   # create new branch
git checkout main             # switch to main
```

### database (if you have local postgres)
```bash
psql -h host -U user -d database  # connect
\dt                                # list tables
\d table_name                      # describe table
```

## resources

### documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - all api endpoints
- [DEPLOYMENT.md](./DEPLOYMENT.md) - how to deploy
- [MAINTENANCE.md](./MAINTENANCE.md) - troubleshooting and maintenance
- [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md) - testing guide

### external docs
- react: https://react.dev
- vite: https://vite.dev
- express: https://expressjs.com
- postgresql: https://www.postgresql.org/docs
- stripe: https://stripe.com/docs
- react router: https://reactrouter.com

### team resources
- github repo: https://github.com/CSCE331-Fall2025-900-911/project3-gang44
- discord: [your discord channel]
- render dashboard: [your render url]

## getting help

### when stuck:

1. check this documentation
2. check console/logs for error messages
3. search error message on google/stackoverflow
4. ask in team discord
5. schedule pair programming session
6. create github issue

### good questions include:

- what you're trying to do
- what you've tried
- exact error message
- relevant code snippets
- screenshots if ui issue

## next steps

now that you're set up:

1. pick a small issue from github issues
2. read relevant code to understand it
3. make a small change
4. test thoroughly
5. submit your first pr

welcome to the team, happy coding.
