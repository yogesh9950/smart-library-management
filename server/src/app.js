const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const issueRoutes = require('./routes/issueRoutes');

const { requireDatabase } = require('./config/db');

const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ==============================
// MAILER CONFIG
// ==============================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==============================
// HEALTH ROUTE
// ==============================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'smart-library-api',
  });
});

// ==============================
// TEST EMAIL ROUTE
// ==============================

app.get('/test-mail', async (_req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Smart Library Test',
      html: `
        <h1>Email Working ✅</h1>
        <p>Smart Library mail system is successfully connected.</p>
      `,
    });

    res.send('Mail Sent Successfully ✅');
  } catch (error) {
    console.error(error);

    res.status(500).send('Email Failed ❌');
  }
});

// ==============================
// API ROUTES
// ==============================

app.use('/api/auth', authRoutes);

app.use(
  '/api/books',
  requireDatabase,
  bookRoutes
);

app.use(
  '/api/issues',
  requireDatabase,
  issueRoutes
);

// ==============================
// ERROR HANDLER
// ==============================

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    message: 'Internal server error',
  });
});
app.get('/', (req, res) => {
  res.send('Smart Library API Running Successfully 🚀');
});

module.exports = app;