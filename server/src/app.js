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

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));

// ==============================
// MAILER CONFIG
// ==============================

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
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
// SMTP TEST ROUTE
// ==============================

app.get('/test-mail', async (_req, res) => {
  try {
    await transporter.verify();

    res.json({
      success: true,
      message: 'SMTP Connected Successfully ✅',
    });
  } catch (error) {
    console.error('SMTP ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// EMAIL SEND TEST ROUTE
// ==============================

app.get('/send-test-mail', async (_req, res) => {
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

    res.json({
      success: true,
      message: 'Mail Sent Successfully ✅',
    });
  } catch (error) {
    console.error('MAIL ERROR:', error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// API ROUTES
// ==============================

app.use('/api/auth', authRoutes);

app.use('/api/books', requireDatabase, bookRoutes);

app.use('/api/issues', requireDatabase, issueRoutes);

// ==============================
// ROOT ROUTE
// ==============================

app.get('/', (req, res) => {
  res.send('Smart Library API Running Successfully 🚀');
});

// ==============================
// ERROR HANDLER
// ==============================

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    message: 'Internal server error',
  });
});

module.exports = app;