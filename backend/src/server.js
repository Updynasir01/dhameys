// src/server.js — Dhameys Airlines (MongoDB edition)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isProd = process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error('FATAL: JWT_SECRET must be set in production');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-jwt-secret-change-me';
  console.warn('[env] JWT_SECRET missing — using dev default. Set JWT_SECRET in .env for real use.');
}
if (!process.env.JWT_REFRESH_SECRET) {
  if (isProd) {
    console.error('FATAL: JWT_REFRESH_SECRET must be set in production');
    process.exit(1);
  }
  process.env.JWT_REFRESH_SECRET = 'dev-jwt-refresh-secret-change-me';
  console.warn('[env] JWT_REFRESH_SECRET missing — using dev default.');
}

require('express-async-errors');

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const { connectDB, checkConnections } = require('./config/database');
const { connect: connectRabbitMQ }    = require('./config/rabbitmq');
const { hasEmailProvider } = require('./services/notification.service');
const logger = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://dhameys.com'].filter(Boolean),
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-ID'],
}));
app.use(rateLimit({ windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS||900000), max: parseInt(process.env.RATE_LIMIT_MAX||100), standardHeaders: true, legacyHeaders: false }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: { write: m => logger.http(m.trim()) } }));
app.use((req, _res, next) => { req.requestId = require('uuid').v4(); next(); });

app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/flights',       require('./routes/flight.routes'));
app.use('/api/search',        require('./routes/search.routes'));
app.use('/api/bookings',      require('./routes/booking.routes'));
app.use('/api/payments',      require('./routes/payment.routes'));
app.use('/api/tickets',       require('./routes/ticket.routes'));
app.use('/api/checkin',       require('./routes/checkin.routes'));
app.use('/api/airports',      require('./routes/airport.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/webhooks',      require('./routes/webhook.routes'));

app.get('/health', async (_req, res) => {
  const db = await checkConnections();
  res.status(db.mongodb ? 200 : 503).json({ status: db.mongodb ? 'healthy' : 'degraded', service: 'Dhameys API', version: '2.0.0', timestamp: new Date().toISOString(), databases: db });
});
app.get('/', (_req, res) => res.json({ name: 'Dhameys Airlines API', version: '2.0.0', db: 'MongoDB' }));

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, path: req.path, requestId: req.requestId });
  if (err.name === 'ValidationError') return res.status(422).json({ error: err.message });
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
  if (err.code === 11000) return res.status(409).json({ error: 'Resource already exists' });
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

async function start() {
  await connectDB();
  await connectRabbitMQ().catch(err => logger.warn('[RabbitMQ] Not connected (optional):', err.message));
  if (hasEmailProvider()) {
    logger.info(`Outbound email: ${process.env.SMTP_HOST ? 'SMTP' : 'SendGrid'}`);
  } else {
    logger.warn('Outbound email: not configured (set SMTP_* or SENDGRID_API_KEY in .env)');
  }
  app.listen(PORT, () => {
    logger.info(`Dhameys API running on port ${PORT}`);
    console.log(`\n🛫  Dhameys Airlines API (MongoDB)\n   http://localhost:${PORT}\n   Health: http://localhost:${PORT}/health\n`);
  });
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT',  () => process.exit(0));
start().catch(err => { logger.error('Startup failed', err); process.exit(1); });

module.exports = app;
