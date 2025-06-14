require('dotenv').config();
const app = require('../app');
const db = require('../config/db');

async function runAuthTests() {
  // Start server on ephemeral port
  const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`Auth test server running on port ${port}`);
  });
  const port = await new Promise((resolve) => {
    server.on('listening', () => resolve(server.address().port));
  });
  const base = `http://localhost:${port}`;

  try {
    console.log('--- Starting auth endpoint tests ---');

    const testEmail = `test_auth_${Date.now()}@example.com`;
    const testPassword = 'password123';

    // 1. Register
    console.log('Registering user:', testEmail);
    let res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (res.status !== 201) {
      const body = await res.text();
      throw new Error(`Register failed: status ${res.status}, body: ${body}`);
    }
    const regJson = await res.json();
    console.log('Register response:', regJson);
    const userId = regJson.user.id;

    // 2. Register same email again → expect 400
    console.log('Registering same email again to check duplicate handling');
    res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (res.status !== 400) {
      const body = await res.text();
      throw new Error(`Expected 400 on duplicate register, got ${res.status}, body: ${body}`);
    }
    console.log('Duplicate register correctly returned 400');

    // 3. Login with correct creds
    console.log('Logging in user:', testEmail);
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(`Login failed: status ${res.status}, body: ${body}`);
    }
    const loginJson = await res.json();
    console.log('Login response:', loginJson);
    const token = loginJson.token;
    if (!token) throw new Error('Login did not return a token');

    // 4. Login with wrong password → expect 401
    console.log('Logging in with wrong password to check invalid credentials handling');
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'wrongpassword' }),
    });
    if (res.status !== 401) {
      const body = await res.text();
      throw new Error(`Expected 401 on invalid login, got ${res.status}, body: ${body}`);
    }
    console.log('Invalid login correctly returned 401');

    // Cleanup: delete test user
    console.log('Cleaning up: deleting test user:', userId);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('Test user deleted');

    console.log('--- Auth endpoint tests completed successfully ---');
    server.close(() => {
      console.log('Auth test server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Auth endpoint test error:', err);
    server.close(() => process.exit(1));
  }
}

runAuthTests();
