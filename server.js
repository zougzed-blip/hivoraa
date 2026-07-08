require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');
const admin = require('./config/firebase');
const { initSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io);

connectDB();

try {
  console.log('Firebase connecte - Project ID:', admin.app().options.credential.projectId);
} catch (error) {
  console.error('Firebase erreur:', error.message);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use('/api', limiter);
app.use(express.static('public'));

// ========== API ROUTES ==========
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


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/study-groups', (req, res) => res.sendFile(path.join(__dirname, 'public', 'groups.html')));
app.get('/resources', (req, res) => res.sendFile(path.join(__dirname, 'public', 'resources.html')));
app.get('/talents', (req, res) => res.sendFile(path.join(__dirname, 'public', 'talents.html')));
app.get('/trust-circle', (req, res) => res.sendFile(path.join(__dirname, 'public', 'trust-circle.html')));
app.get('/listening-chamber', (req, res) => res.sendFile(path.join(__dirname, 'public', 'listening-chamber.html')));
app.get('/saved', (req, res) => res.sendFile(path.join(__dirname, 'public', 'saved.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/auth-test', (req, res) => res.sendFile(path.join(__dirname, 'public', 'auth-test.html')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});