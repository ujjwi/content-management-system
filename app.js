require('dotenv').config();
const express = require('express');
const db = require('./config/db');

// Test connection but don’t await blocking
db.query('SELECT 1')
  .then(() => console.log('DB connection established'))
  .catch(err => console.error('DB connection failed:', err));

const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'OK' }));
module.exports = app;
