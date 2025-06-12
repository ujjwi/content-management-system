require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'OK' }));
module.exports = app;
