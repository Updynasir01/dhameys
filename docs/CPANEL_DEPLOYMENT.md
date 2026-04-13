# Dhameys Airlines — cPanel Deployment Guide

## Prerequisites
- cPanel hosting with Node.js Selector (CloudLinux)
- Node.js 18+ available
- PostgreSQL or MySQL via cPanel databases
- SSH access (recommended)

---

## Step 1 — Upload Files

Upload the project to your cPanel file manager:
- Backend → `/home/yourusername/dhameys-api/`
- Frontend → `/home/yourusername/public_html/` (for static) OR `/home/yourusername/dhameys-frontend/`

---

## Step 2 — Setup Databases

### PostgreSQL (if available on your cPanel host)
Most shared hosts only offer MySQL. Check with your host.

If PostgreSQL is available:
1. Go to cPanel → PostgreSQL Databases
2. Create database: `dhameys_main`
3. Create user: `dhameys_user` with a strong password
4. Grant all privileges
5. Import: `backend/migrations/001_init_schema.sql`
6. Import: `backend/migrations/003_seed_data.sql`

### MySQL (most cPanel hosts)
1. Go to cPanel → MySQL Databases
2. Create database: `username_dhameys` (cPanel prefixes with your username)
3. Create user: `username_dhuser`
4. Grant all privileges
5. In phpMyAdmin, run: `backend/migrations/002_mysql_logs.sql`

> **Note:** If your host only has MySQL (no PostgreSQL), the backend can be
> configured to use MySQL for everything. Contact us to get the MySQL-compatible
> migration file.

---

## Step 3 — Setup Node.js App (Backend)

1. Go to cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Fill in:
   - Node.js version: **18.x** or higher
   - Application mode: **Production**
   - Application root: `dhameys-api`
   - Application URL: `api.yourdomain.com` (or `yourdomain.com/api`)
   - Application startup file: `src/server.js`
4. Click **Create**
5. Click **Run NPM Install**

### Environment Variables
In the Node.js app setup, add all variables from `.env.example`:
- Copy each variable and fill in production values
- Make sure `NODE_ENV=production`
- Set `PORT=5000` (or the port cPanel assigns)

---

## Step 4 — Setup Frontend (Next.js)

### Option A — Static Export (Recommended for shared hosting)

1. In your local machine, build the static export:
```bash
cd frontend
EXPORT_MODE=static npm run build
npm run export
```

2. Upload the contents of `frontend/out/` to `public_html/`

3. Create `.htaccess` in `public_html/`:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ /index.html [QSA,L]
```

### Option B — Node.js on cPanel
1. Create another Node.js app for the frontend
2. Application root: `dhameys-frontend`
3. Startup file: `node_modules/.bin/next` with args `start`
4. Run npm install

---

## Step 5 — SSL Certificate

1. Go to cPanel → **SSL/TLS** → **AutoSSL**
2. Run AutoSSL for your domain — this gets a free Let's Encrypt cert
3. Force HTTPS in `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Step 6 — Domain & Subdomain Setup

Recommended structure:
- `dhameys.com` → Frontend (public_html)
- `api.dhameys.com` → Backend (Node.js app)

To create subdomain:
1. cPanel → Domains → Subdomains
2. Create `api` subdomain pointing to your Node.js app directory

---

## Step 7 — Cron Jobs (Optional)

Set up in cPanel → Cron Jobs:

```bash
# Clean expired seat locks every 5 minutes
*/5 * * * * node /home/user/dhameys-api/src/utils/cleanExpiredLocks.js

# Sync flights to Elasticsearch hourly
0 * * * * node /home/user/dhameys-api/src/utils/syncFlightsToES.js

# Send price alerts daily at 8am
0 8 * * * node /home/user/dhameys-api/src/utils/sendPriceAlerts.js
```

---

## Step 8 — Redis (if not available on cPanel)

Most shared hosts don't include Redis. Options:
1. Use **Redis Cloud** free tier (redislabs.com) — set `REDIS_HOST` to remote URL
2. Use a VPS alongside your cPanel for Redis
3. Install Redis on a VPS and connect remotely

---

## Step 9 — RabbitMQ

Options for cPanel (no native support):
1. Use **CloudAMQP** free tier (cloudamqp.com) for managed RabbitMQ
2. Set `RABBITMQ_URL=amqps://user:pass@host.cloudamqp.com/vhost`

---

## Production Checklist

- [ ] All `.env` variables set in cPanel Node.js app
- [ ] SSL certificate active and HTTPS forced
- [ ] Database created and migrations run
- [ ] Seed data imported
- [ ] Frontend built and uploaded
- [ ] CORS origins updated to production domain
- [ ] Stripe keys changed to live keys
- [ ] SendGrid verified sender domain
- [ ] Test booking flow end-to-end
- [ ] Admin account created
