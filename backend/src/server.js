require('dotenv').config();

// CRITICAL: Validate environment before any other initialization
const validateEnv = require('./config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const { pool } = require('./config/database');
const logger = require('./utils/logger');
const { sanitizeMiddleware } = require('./middleware/sanitize');
const { sqlInjectionDetectionMiddleware } = require('./middleware/sqlInjectionDetection');

const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const markRoutes = require('./routes/marks');
const disciplineRoutes = require('./routes/discipline');
const homeworkRoutes = require('./routes/homework');
const exerciseRoutes = require('./routes/exercises');
const noteRoutes = require('./routes/notes');
const feeRoutes = require('./routes/fees');
const pdfRoutes = require('./routes/pdf');
const announcementRoutes = require('./routes/announcements');
const emailRoutes = require('./routes/email');
const chatRoutes = require('./routes/chat');
const activityLogRoutes = require('./routes/activityLogs');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(u => u.trim()),
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// ===== SECURITY HEADERS =====
app.disable('x-powered-by');
app.set('etag', false);

// Comprehensive Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ===== CORS HARDENING =====
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(u => u.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-School-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(sanitizeMiddleware);
app.use(sqlInjectionDetectionMiddleware);

// ===== LOGGING =====
morgan.token('userId', (req) => req.userId || '-');
morgan.token('schoolId', (req) => req.schoolId || '-');
app.use(morgan(':method :url :status :response-time ms :userId :schoolId', {
  stream: { write: (msg) => logger.info(msg.trim()) },
  skip: (req) => req.path === '/api/health',
}));

// ===== RATE LIMITING (GRANULAR) =====
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':' + (req.body?.email || ''),
  skip: (req) => process.env.NODE_ENV !== 'production',
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many write requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET',
});

const chatLimiter = rateLimit({
  windowMs: 2 * 1000, // 2 seconds
  max: 1, // 1 message per 2 seconds
  message: { error: 'Sending too fast. Wait 2 seconds.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/chat/messages', chatLimiter);
app.use(writeLimiter);
app.use(readLimiter);

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/discipline', disciplineRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/activity-logs', activityLogRoutes);

// ===== HEALTH CHECK =====
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ===== SECURITY CHECK ENDPOINT (Dev only) =====
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/security-check', (req, res) => {
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    res.json({
      jwtAccessSecretLength: (process.env.JWT_ACCESS_SECRET || '').length,
      jwtAccessSecretStrong: (process.env.JWT_ACCESS_SECRET || '').length >= 64,
      jwtRefreshSecretLength: (process.env.JWT_REFRESH_SECRET || '').length,
      jwtRefreshSecretStrong: (process.env.JWT_REFRESH_SECRET || '').length >= 64,
      bcryptRounds,
      bcryptStrong: bcryptRounds >= 12,
      nodeEnv: process.env.NODE_ENV,
      databaseSSLEnabled: process.env.DB_SSL === 'true',
      encryptionKeySet: !!process.env.ENCRYPTION_KEY,
      corsOrigins: allowedOrigins,
    });
  });
}

// ===== SECURE ERROR HANDLER =====
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log internally
  logger.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userId: req.userId || 'unauthenticated',
    schoolId: req.schoolId || '-',
    error: err.message,
    code: err.code,
    ...(isDev && { stack: err.stack }),
  });

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'This record already exists' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record not found' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({ error: 'Cannot delete — record is in use' });
  }

  // Auth errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }

  // CORS errors
  if (err.message === 'Not allowed by CORS policy') {
    return res.status(403).json({ error: 'Request origin not allowed' });
  }

  // Default
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'An unexpected error occurred',
    code: err.code,
    ...(isDev && { stack: err.stack }),
  });
});

// ===== SOCKET.IO =====
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join', (room) => socket.join(room));
});

// ===== SERVER STARTUP =====
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);

  // Schedule periodic security cleanup tasks
  const { cleanupOldAttempts } = require('./services/bruteForceProtection');

  // Cleanup old login attempts every hour
  setInterval(() => {
    cleanupOldAttempts(7) // Keep 7 days of history
      .catch((err) => logger.error('Cleanup task failed:', err.message));
  }, 60 * 60 * 1000); // 1 hour

  // Cleanup expired tokens every hour
  setInterval(async () => {
    try {
      await pool.execute('DELETE FROM blacklisted_tokens WHERE expires_at < NOW()');
      logger.info('Cleaned up expired blacklisted tokens');
    } catch (err) {
      logger.error('Token cleanup failed:', err.message);
    }
  }, 60 * 60 * 1000); // 1 hour
});

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing connections...');
  await pool.end();
  process.exit(0);
});

