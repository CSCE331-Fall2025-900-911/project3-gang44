# maintenance documentation

this document provides guidelines for maintaining and troubleshooting the boba kiosk application.

## routine maintenance tasks

### daily tasks

1. monitor application logs
```bash
# for render deployment
# view logs in render dashboard

# for manual deployment
pm2 logs boba-backend
```

2. check for errors or unusual activity
3. verify payment processing is working
4. ensure database backups are running

### weekly tasks

1. review application performance metrics
2. check database storage usage
3. review and clean up old logs
4. test key user flows (order, payment, manager functions)
5. update dependencies if security patches available

### monthly tasks

1. review and analyze sales reports
2. check for unused database records
3. optimize database queries if performance degrades
4. review security settings
5. update documentation if changes were made
6. backup environment variables and configurations

## database maintenance

### regular cleanup

remove old orders (if needed):
```sql
DELETE FROM order_items
WHERE order_id IN (
  SELECT order_id FROM orders
  WHERE order_date < NOW() - INTERVAL '1 year'
);

DELETE FROM orders
WHERE order_date < NOW() - INTERVAL '1 year';
```

### optimize tables

run vacuum to reclaim storage:
```sql
VACUUM ANALYZE orders;
VACUUM ANALYZE order_items;
VACUUM ANALYZE products;
VACUUM ANALYZE ingredients;
```

### check database size
```sql
SELECT
  pg_size_pretty(pg_database_size('your_db_name')) as db_size;
```

### reindex if needed
```sql
REINDEX DATABASE your_db_name;
```

## updating dependencies

### check for updates
```bash
cd customerkiosk/frontend
npm outdated

cd ../backend
npm outdated
```

### update packages
```bash
# update to latest compatible versions
npm update

# or update to latest (may break things)
npm install package@latest
```

### test after updates
1. run unit tests: `npm test`
2. test locally before deploying
3. deploy to staging first if available

## common issues and solutions

### issue: server won't start

**symptoms:**
- backend returns connection errors
- port already in use

**diagnosis:**
```bash
# check if port 5000 is in use
lsof -i :5000

# check pm2 status
pm2 status
```

**solution:**
```bash
# kill process on port
kill -9 $(lsof -t -i:5000)

# or restart pm2
pm2 restart boba-backend
```

### issue: database connection errors

**symptoms:**
- "connection refused" errors
- "could not connect to server"

**diagnosis:**
```bash
# test database connection
psql -h DB_HOST -U DB_USER -d DB_NAME

# check if postgres is running
systemctl status postgresql
```

**solution:**
1. verify database credentials in .env
2. check if database server is running
3. verify firewall allows connection
4. check database connection limits

### issue: stripe payments failing

**symptoms:**
- payment intent creation fails
- payment verification errors

**diagnosis:**
- check stripe dashboard for errors
- verify stripe keys in .env
- check if using correct test/live keys

**solution:**
1. verify stripe keys are correct
2. ensure amount is > $0.50 (stripe minimum)
3. check stripe account status
4. review stripe logs

### issue: slow queries

**symptoms:**
- pages load slowly
- timeouts on reports

**diagnosis:**
```sql
-- find slow queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

**solution:**
1. add indexes to frequently queried columns
2. optimize complex queries
3. implement caching
4. increase database resources

### issue: memory leaks

**symptoms:**
- server crashes after running for days
- memory usage grows continuously

**diagnosis:**
```bash
# check memory usage
pm2 monit

# or
top -p $(pgrep -f node)
```

**solution:**
1. restart server regularly
2. review code for memory leaks
3. use node --max-old-space-size flag
4. upgrade server resources

### issue: cors errors

**symptoms:**
- frontend can't connect to backend
- "blocked by cors policy" errors

**solution:**
1. verify frontend url is in cors whitelist
2. check frontend is using correct api url
3. ensure credentials: true is set

### issue: translations not loading

**symptoms:**
- text shows as translation keys
- "loading translations" stuck

**solution:**
1. verify translation files exist
2. check browser console for errors
3. clear browser cache
4. verify i18n configuration

## monitoring and alerts

### set up uptime monitoring

use services like:
- uptime robot (free tier available)
- pingdom
- statuspage.io

monitor:
- frontend url
- backend /api/menu endpoint
- database connectivity

### error tracking

implement sentry for error tracking:

1. install sentry:
```bash
npm install @sentry/node @sentry/react
```

2. configure in backend (server.js):
```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

3. configure in frontend (main.jsx):
```javascript
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: process.env.VITE_SENTRY_DSN });
```

### log management

for production, consider:
- winston for structured logging
- logrotate for log file rotation
- cloudwatch or papertrail for centralized logs

## security maintenance

### regular security tasks

1. rotate api keys quarterly:
   - stripe keys
   - database passwords
   - oauth client secrets

2. review access logs for suspicious activity

3. update packages with security vulnerabilities:
```bash
npm audit
npm audit fix
```

4. check for exposed secrets:
```bash
git secrets --scan
```

### security hardening

1. enable rate limiting on api endpoints
2. implement request validation
3. use parameterized queries (already done)
4. enable https only in production
5. implement csrf protection
6. add security headers with helmet.js

## disaster recovery

### database recovery

1. stop application:
```bash
pm2 stop boba-backend
```

2. restore from backup:
```bash
psql -h DB_HOST -U DB_USER -d DB_NAME < backup.sql
```

3. verify data integrity:
```sql
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM ingredients;
```

4. restart application:
```bash
pm2 start boba-backend
```

### application recovery

1. checkout last known good commit:
```bash
git log
git checkout <commit-hash>
```

2. rebuild and deploy:
```bash
npm install
npm run build
pm2 restart all
```

## performance optimization

### database optimization

1. add indexes on frequently queried columns:
```sql
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_products_category ON products(category);
```

2. analyze query performance:
```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE order_date >= NOW() - INTERVAL '30 days';
```

### application optimization

1. enable compression:
```javascript
const compression = require('compression');
app.use(compression());
```

2. implement caching:
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });
```

3. optimize images:
- use webp format
- compress images before upload
- implement lazy loading

## contact and escalation

### when to escalate

escalate if:
- data breach suspected
- prolonged downtime (> 1 hour)
- payment processing completely broken
- database corruption detected

### escalation contacts

- technical lead: [contact info]
- database admin: [contact info]
- security team: [contact info]
- stripe support: support@stripe.com

## maintenance schedule template

```
daily:
[ ] check logs for errors
[ ] verify system is responding
[ ] check payment processing

weekly:
[ ] review performance metrics
[ ] check database size
[ ] run test suite
[ ] update dependencies (if needed)

monthly:
[ ] review and optimize queries
[ ] check security updates
[ ] review backups
[ ] analyze usage patterns
[ ] update documentation
```
