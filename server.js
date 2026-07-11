require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');
const auth = require('./config/firebase');
const { initSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io);

connectDB();
console.log('Firebase Auth configure');

const isProd = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5000';

const stripMongoOperators = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) { obj.forEach(stripMongoOperators); return obj; }
  Object.keys(obj).forEach(function(key) {
    if (key.startsWith('$') || key.includes('.')) { delete obj[key]; return; }
    if (obj[key] && typeof obj[key] === 'object') stripMongoOperators(obj[key]);
  });
  return obj;
};

const mongoSanitizeSafe = function(req, res, next) {
  if (req.body) stripMongoOperators(req.body);
  if (req.params) stripMongoOperators(req.params);
  next();
};

if (isProd) app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.socket.io", "https://accounts.google.com", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://i.ytimg.com"],
      connectSrc: ["'self'", clientUrl, clientUrl.replace('https', 'wss').replace('http', 'ws')],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["https://accounts.google.com"]
    }
  }
}));

app.use(cors({
  origin: clientUrl,
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitizeSafe);
app.use(morgan('dev'));

app.use('/api', function(req, res, next) {
  if (req.method === 'GET') return next();
  limiter(req, res, next);
});

app.use(express.static('public'));

// CSRF
app.use('/api', function(req, res, next) {
  if (!req.cookies['x-csrf-token']) {
    var csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('x-csrf-token', csrfToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  next();
});

var csrfProtection = function(req, res, next) {
  if (req.path === '/auth/google') return next();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    var cookieToken = req.cookies['x-csrf-token'];
    var headerToken = req.headers['x-csrf-token'];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403)
      .json({ success: false, message: 'Your session has expired. Please refresh the page.' });
    }
  }
  next();
};
app.use('/api', csrfProtection);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/firebase', require('./routes/firebase'));
app.use('/api/help-requests', require('./routes/helpRequests'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/study-groups', require('./routes/studyGroups'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/talents', require('./routes/talents'));
app.use('/api/trust-circle', require('./routes/trustCircle'));
app.use('/api/listening-chamber', require('./routes/listeningChamber'));

app.use('/api', function(req, res) {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

// HTML Routes
var pages = ['index', 'groups', 'resources', 'talents', 'trust-circle', 'listening-chamber', 'saved', 'profile'];
pages.forEach(function(page) {
  app.get('/' + page + '.html', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', page + '.html'));
  });
  app.get('/' + page, function(req, res) {
    res.sendFile(path.join(__dirname, 'public', page + '.html'));
  });
});

app.get('/', function(req, res) { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/authentication', function(req, res) { res.sendFile(path.join(__dirname, 'public', 'auth-test.html')); });

app.use(errorHandler);

var PORT = process.env.PORT || 5000;
server.listen(PORT, function() {
  console.log('Serveur demarre sur le port ' + PORT);
});