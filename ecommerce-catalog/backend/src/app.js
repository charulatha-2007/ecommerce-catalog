const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const sanitizeRequest = require('./middleware/sanitize');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

/* ---------------- Global middleware ---------------- */

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
);

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Strips any keys starting with '$' or containing '.' to prevent NoSQL operator injection
app.use(mongoSanitize());

// Strips XSS payloads from strings in body/query/params
app.use(sanitizeRequest);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Basic API-wide rate limiting; write-heavy endpoints could layer a stricter limiter on top
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

/* ---------------- Health check ---------------- */

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', uptime: process.uptime() });
});

/* ---------------- RESTful API v1 ---------------- */

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);

/* ---------------- 404 + error handling ---------------- */

app.use(notFound);
app.use(errorHandler);

module.exports = app;
