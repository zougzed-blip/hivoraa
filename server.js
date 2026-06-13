require('dotenv').config();
const express = require('express');
const http = require('http');
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

app.get('/', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    message: 'Hivoraa API en ligne',
    firebase: 'Connecte',
    mongo: mongoose.connection.readyState === 1 ? 'Connecte' : 'Deconnecte'
  });
});

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

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});