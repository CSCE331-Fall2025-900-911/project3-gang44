# deployment documentation

this document describes how to deploy the boba kiosk application to production.

## deployment options

the application can be deployed using:
1. render (current production deployment - recommended)
2. manual deployment to any node.js hosting provider

## render deployment

the application is configured for render deployment using render.yaml.

### prerequisites
- render account
- github repository connected to render
- postgres database created on render

### deployment steps

1. create postgres database on render:
   - go to render dashboard
   - create new postgres database
   - save connection details

2. create backend web service:
   - create new web service
   - connect github repository
   - set root directory to `customerkiosk/backend`
   - set build command: `npm install`
   - set start command: `npm start`
   - add environment variables:
     - DB_HOST
     - DB_NAME
     - DB_USER
     - DB_PASSWORD
     - DB_PORT
     - STRIPE_SECRET_KEY
     - STRIPE_PUBLISHABLE_KEY
     - FRONTEND_URL

3. create frontend static site:
   - create new static site
   - connect github repository
   - set root directory to `customerkiosk/frontend`
   - set build command: `npm install && npm run build`
   - set publish directory: `dist`
   - add environment variables:
     - VITE_API_URL (backend url)
     - VITE_GOOGLE_CLIENT_ID
     - VITE_STRIPE_PUBLISHABLE_KEY

4. configure render.yaml (already done):
   - the render.yaml file in the root defines all services
   - render will automatically detect and deploy from this file

5. push to main branch:
```bash
git push origin main
```

render will automatically deploy on push to main branch.

## manual deployment

### backend deployment

1. provision a node.js server (ubuntu/debian recommended)

2. install dependencies:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql-client
```

3. clone repository:
```bash
git clone <your-repo-url>
cd project3-gang44/customerkiosk/backend
```

4. install packages:
```bash
npm install
```

5. create .env file:
```bash
nano .env
```

add:
```
PORT=5000
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
FRONTEND_URL=https://your-frontend-url.com
```

6. set up process manager (pm2):
```bash
sudo npm install -g pm2
pm2 start server.js --name boba-backend
pm2 save
pm2 startup
```

7. configure nginx reverse proxy:
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/boba-api
```

add:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

enable:
```bash
sudo ln -s /etc/nginx/sites-available/boba-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. set up ssl with certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### frontend deployment

1. build the frontend:
```bash
cd customerkiosk/frontend
npm install
npm run build
```

2. upload dist/ directory to static hosting provider:
   - netlify
   - vercel
   - aws s3 + cloudfront
   - or serve with nginx

3. configure environment variables on hosting platform:
   - VITE_API_URL
   - VITE_GOOGLE_CLIENT_ID
   - VITE_STRIPE_PUBLISHABLE_KEY

### example nginx config for frontend:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/boba-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## database migration

after deploying, run database migrations:

```bash
cd customerkiosk/backend
node run-migration.js
```

## health checks

verify deployment:

1. backend health:
```bash
curl https://your-api-url.com/api/menu
```

2. frontend access:
- open browser to frontend url
- verify menu loads
- test complete order flow

## monitoring

### render monitoring
- check render dashboard for service status
- view logs in real-time
- monitor resource usage

### custom monitoring
set up monitoring with:
- uptime robot (for uptime monitoring)
- sentry (for error tracking)
- datadog or new relic (for performance)

## rollback procedure

if deployment fails:

### render:
1. go to render dashboard
2. select the service
3. navigate to "Events"
4. click "Redeploy" on previous successful deployment

### manual:
1. checkout previous working commit:
```bash
git checkout <previous-commit-hash>
```

2. rebuild and deploy:
```bash
npm run build
pm2 restart boba-backend
```

## common deployment issues

### issue: database connection fails
**solution:** verify DB_HOST, DB_PORT, and credentials in .env

### issue: cors errors
**solution:** add frontend url to cors whitelist in server.js

### issue: stripe payments fail
**solution:** verify stripe keys are correct and in test/live mode as needed

### issue: build fails on render
**solution:**
- check node version compatibility
- verify package.json scripts
- check build logs for missing dependencies

### issue: environment variables not loading
**solution:**
- verify .env file exists
- check variable names match exactly
- restart service after changing env vars

## security checklist

before deploying to production:

- [ ] use https for all connections
- [ ] set secure cors origins (remove localhost)
- [ ] use production stripe keys
- [ ] enable rate limiting
- [ ] set secure database password
- [ ] enable database ssl connection
- [ ] remove console.log statements with sensitive data
- [ ] set NODE_ENV=production
- [ ] enable helmet.js for security headers
- [ ] implement proper authentication
- [ ] set up database backups

## performance optimization

for production:

1. enable gzip compression in nginx
2. set up cdn for static assets
3. enable database connection pooling
4. implement caching for api responses
5. optimize images and assets
6. enable http/2
7. set proper cache headers

## backup strategy

1. database backups:
   - render provides automatic daily backups
   - for manual backups:
   ```bash
   pg_dump -h DB_HOST -U DB_USER DB_NAME > backup.sql
   ```

2. code backups:
   - use git for version control
   - push to github regularly

3. restore from backup:
   ```bash
   psql -h DB_HOST -U DB_USER DB_NAME < backup.sql
   ```
