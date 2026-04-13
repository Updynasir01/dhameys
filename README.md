# ✈️ Dhameys Airlines — Flight Booking System (MongoDB Edition)

Full-stack airline booking platform built with **Node.js + MongoDB + Next.js**.
No PostgreSQL, MySQL, or Redis required — runs on a single MongoDB instance.

---

## 🚀 Quick Start (3 steps)

### Step 1 — Copy environment variables
```bash
cp .env.example .env
```
Edit `.env` — the only required line is `MONGODB_URI`.

**Local MongoDB (Docker):**
```
MONGODB_URI=mongodb://dhameys_user:devpassword123@localhost:27017/dhameys?authSource=admin
```

**MongoDB Atlas (cloud, free tier):**
```
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/dhameys
```

### Step 2 — Start MongoDB + install + seed
```bash
bash scripts/setup.sh dev
```

This will:
- Pull MongoDB via Docker (or use an existing local/Atlas connection)
- Install all npm dependencies
- Seed airports, 360 flights, add-ons, promo codes

### Step 3 — Run the servers
```bash
# Terminal 1 — API
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000
- **Health:** http://localhost:5000/health
- **Mongo Express UI:** http://localhost:8081 (Docker only)

### Create admin account
```bash
cd backend && node src/utils/create-admin.js
```
Then visit http://localhost:3000/admin

---

## 📁 Project Structure

```
dhameys/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # MongoDB + in-process cache
│   │   │   └── rabbitmq.js      # RabbitMQ (optional)
│   │   ├── models/
│   │   │   ├── User.js          # Mongoose User schema
│   │   │   ├── Flight.js        # Flight + embedded FareRules
│   │   │   ├── Booking.js       # Booking + embedded Passengers
│   │   │   ├── Payment.js       # Stripe payment records
│   │   │   ├── Ticket.js        # E-tickets + boarding passes
│   │   │   ├── Airport.js       # Airport info
│   │   │   └── index.js         # RefreshToken, Addon, PromoCode, Notification...
│   │   ├── services/            # Business logic (all MongoDB)
│   │   ├── routes/              # 12 Express route files
│   │   ├── middleware/          # Auth (JWT), validation, security
│   │   ├── controllers/         # Auth controller
│   │   ├── queues/              # RabbitMQ workers
│   │   └── utils/
│   │       ├── seed.js          # DB seeder
│   │       ├── create-admin.js  # Create superadmin
│   │       ├── cron.jobs.js     # Scheduled tasks
│   │       └── logger.js        # Winston logger
│   └── package.json
├── frontend/                    # Next.js 14 App Router
│   └── src/
│       ├── app/                 # Pages (search, booking, admin...)
│       ├── components/          # Navbar, Footer, SearchForm...
│       ├── lib/api.ts           # Axios client with token refresh
│       └── store/               # Zustand stores
├── shared/
│   ├── types/index.ts           # TypeScript types
│   └── constants/index.ts       # Shared constants
├── docker-compose.yml           # MongoDB + Mongo Express
├── ecosystem.config.js          # PM2 production config
└── scripts/
    ├── setup.sh                 # One-command setup
    └── create-admin.js          # Admin creation
```

---

## 🗄️ MongoDB Collections

| Collection | Description |
|---|---|
| `users` | Customers, agents, admins — auth, profile, loyalty, GDPR |
| `flights` | Flights with embedded fare rules per cabin class |
| `bookings` | Bookings with embedded passengers, segments, add-ons |
| `payments` | Stripe payments with fraud detection |
| `tickets` | E-tickets with QR code data and PDF URL |
| `airports` | 18 seeded airports (Middle East, Africa, Europe, Asia) |
| `addons` | Extra baggage, meals, insurance, upgrades |
| `promocodes` | Discount campaigns |
| `promousages` | Per-user promo tracking |
| `loyaltytransactions` | Points earned/redeemed history |
| `notifications` | Email/SMS/push notifications |
| `auditlogs` | Full audit trail |
| `refreshtokens` | JWT refresh tokens (auto-expire via TTL index) |
| `settings` | Admin-configurable system settings |

---

## 🔑 Key API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Register + GDPR consent |
| POST | /api/auth/login | Login (returns JWT or 2FA token) |
| POST | /api/auth/2fa/verify | Complete 2FA login |
| GET  | /api/search/flights | Search flights |
| GET  | /api/flights/:id/seats | Seat map |
| POST | /api/bookings | Create booking |
| POST | /api/payments/intent | Create Stripe payment intent |
| POST | /api/payments/confirm | Confirm payment |
| GET  | /api/tickets/:ref | Get tickets for booking |
| POST | /api/checkin | Online check-in |
| GET  | /api/admin/dashboard | Admin stats |

---

## 🚢 cPanel Deployment

1. Upload project to cPanel
2. Use **MongoDB Atlas** (free) for the database — no server config needed
3. In cPanel → **Setup Node.js App** → point to `backend/src/server.js`
4. Add all `.env` variables in the Node.js app settings
5. Build Next.js: `EXPORT_MODE=static npm run build` → upload `frontend/out/` to `public_html/`
6. Enable AutoSSL for HTTPS
7. Add cron jobs for `cron.jobs.js` tasks

Full guide: `docs/CPANEL_DEPLOYMENT.md`

---

## 🔐 Security Features
- JWT access + refresh tokens (auto-rotate)
- Two-factor authentication (TOTP via Google Authenticator)
- Rate limiting (global + auth endpoints)
- Helmet.js security headers
- CORS whitelist
- Stripe PCI-DSS compliant payments
- GDPR data export + deletion
- Password bcrypt hashing (12 rounds)
- Audit log trail in MongoDB
- Fraud detection on payments

---

## 📦 Tech Stack (Simplified)
| Layer | Technology |
|---|---|
| **Backend** | Node.js 18, Express 4 |
| **Database** | MongoDB 7 + Mongoose 8 |
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **Auth** | JWT + bcrypt + speakeasy (2FA) |
| **Payments** | Stripe |
| **Email** | SendGrid |
| **Queue** | RabbitMQ (optional) |
| **PDF** | PDFKit + QRCode |
| **Deploy** | cPanel (Node.js + MongoDB Atlas) |
