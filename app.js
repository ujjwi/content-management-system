require('dotenv').config();
const express = require('express');
const db = require('./config/db');

// Test connection but don’t await blocking
db.query('SELECT 1')
  .then(() => console.log('DB connection established'))
  .catch(err => console.error('DB connection failed:', err));

const app = express();

// Built-in middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Article routes
const articleRoutes = require('./routes/articleRoutes');
app.use('/articles', articleRoutes);

// Global error handler 
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;
