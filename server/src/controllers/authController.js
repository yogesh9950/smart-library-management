const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
// =====================================
// MAIL CONFIG
// =====================================

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =====================================
// SANITIZE USER
// =====================================

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  rid: user.rid,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

// =====================================
// REGISTER
// =====================================

const register = async (req, res) => {
  try {
    const { name, rid, email, password, role } =
      req.body;

    // VALIDATION

    if (
      !name ||
      !email ||
      !password ||
      (role !== 'admin' && !rid)
    ) {
      return res.status(400).json({
        message:
          'Full name, RID, email, and password are required',
      });
    }

    // RID VALIDATION

    if (
      role !== 'admin' &&
      !/^R\d{5}$/i.test(rid)
    ) {
      return res.status(400).json({
        message: 'RID format must be like R43123',
      });
    }

    // CHECK EXISTING USER

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // CHECK EXISTING RID

    if (role !== 'admin') {
      const existingRid = await User.findOne({
        rid: rid.toUpperCase(),
      });

      if (existingRid) {
        return res.status(400).json({
          message: 'RID already exists',
        });
      }
    }

    // HASH PASSWORD

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // GENERATE OTP

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // CREATE USER

    const user = await User.create({
      name,

      rid:
        role === 'admin'
          ? undefined
          : rid.toUpperCase(),

      email,

      password: hashedPassword,

      role:
        role === 'admin'
          ? 'admin'
          : 'student',

      otp,

      otpExpiry:
        Date.now() + 5 * 60 * 1000,

      isVerified: false,
    });

   await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: email,
  subject: 'Smart Library OTP Verification',
  html: `
    <h2>Your OTP: ${otp}</h2>
    <p>This OTP is valid for 5 minutes.</p>
  `,
});

    return res.status(201).json({
      message:
        'OTP sent to your email successfully',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// VERIFY OTP
// =====================================

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // CHECK OTP

    if (user.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP',
      });
    }

    // CHECK EXPIRY

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: 'OTP expired',
      });
    }

    // VERIFY USER

    user.isVerified = true;

    user.otp = null;

    user.otpExpiry = null;

    await user.save();

    return res.json({
      message: 'Email verified successfully',

      token: generateToken(user),

      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// =====================================
// LOGIN
// =====================================
const login = async (req, res) => {

  try {

    const {
      email,
      password,
    } = req.body;

    // =====================================
    // FIXED ADMIN LOGIN
    // =====================================

    if (
      email ===
        'admin@smartlibrary.com' &&

      password === 'Admin@123'
    ) {

      const adminUser = {

  _id:
    '507f1f77bcf86cd799439011',

  name: 'Admin',

  email:
    'admin@smartlibrary.com',

  role: 'admin',
};

      return res.json({

        message:
          'Admin login successful',

        token:
          generateToken(adminUser),

        user: adminUser,
      });
    }

    // =====================================
    // STUDENT LOGIN
    // =====================================

    const user =
      await User.findOne({
        email,
      });

    if (!user) {

      return res.status(401).json({

        message:
          'Invalid credentials',
      });
    }

    // =====================================
    // PASSWORD CHECK
    // =====================================

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {

      return res.status(401).json({

        message:
          'Invalid credentials',
      });
    }

    // =====================================
    // VERIFIED CHECK
    // =====================================

    if (!user.isVerified) {

      return res.status(401).json({

        message:
          'Please verify your email OTP first',
      });
    }

    // =====================================
    // LOGIN SUCCESS
    // =====================================

    return res.json({

      message:
        'Login successful',

      token:
        generateToken(user),

      user:
        sanitizeUser(user),
    });

  } catch (error) {

    return res.status(500).json({

      message:
        error.message,
    });
  }
};

// =====================================
// CURRENT USER
// =====================================

const me = async (req, res) => {
  res.json({
    user: req.user,
  });
};

module.exports = {
  register,
  verifyOtp,
  login,
  me,
};