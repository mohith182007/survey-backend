const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// CORS Configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Debug: Log environment variables
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('📝 PORT:', process.env.PORT);
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
if (process.env.MONGODB_URI) {
  const uriStart = process.env.MONGODB_URI.substring(0, 50);
  console.log('📝 MONGODB_URI starts with:', uriStart + '...');
}
console.log('📝 Testing MongoDB connection with updated whitelist...');

// MongoDB Connection with multiple strategies
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/survey_db';
console.log('📝 Attempting to connect with URI');

// Connection options with multiple fallback strategies
// Keeping options that actually work with Mongoose 7
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  waitQueueTimeoutMS: 10000
};

console.log('🔧 Connection options:', JSON.stringify({
  serverSelectionTimeoutMS: connectionOptions.serverSelectionTimeoutMS,
  connectTimeoutMS: connectionOptions.connectTimeoutMS,
  socketTimeoutMS: connectionOptions.socketTimeoutMS,
  maxPoolSize: connectionOptions.maxPoolSize,
  minPoolSize: connectionOptions.minPoolSize
}));

let connectionAttempt = 0;
const maxAttempts = 3;

const attemptConnection = (attempt) => {
  connectionAttempt = attempt;
  console.log(`\n📡 Connection Attempt ${attempt}/${maxAttempts}...`);
  
  mongoose.connect(mongoUri, connectionOptions)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      console.log('📊 Connection state:', mongoose.connection.readyState);
    })
    .catch(err => {
      console.error(`❌ Connection attempt ${attempt} failed:`, err.message);
      console.error('Error code:', err.code);
      console.error('Error name:', err.name);
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Retrying in 5 seconds...`);
        setTimeout(() => attemptConnection(attempt + 1), 5000);
      } else {
        console.error('⚠️  All connection attempts failed. Server will continue running without database');
      }
    });
};

// Start first connection attempt
attemptConnection(1);

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

// Routes
const surveyRoutes = require('./routes/survey');
app.use('/api/survey', surveyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongodbUriSet: process.env.MONGODB_URI ? 'YES' : 'NO',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Survey Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      user: '/api/survey/user',
      submit: '/api/survey/submit',
      response: '/api/survey/response/:id'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
