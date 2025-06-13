// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Validate required env vars
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error('Database environment variables DB_HOST, DB_USER, DB_PASSWORD, DB_NAME must be set');
}

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT ? Number(DB_PORT) : 5432,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

pool.on('connect', () => {
  console.log('Connected to Postgres');
});
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = pool;
