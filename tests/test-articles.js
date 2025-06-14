require('dotenv').config();
const app = require('../app');
const db = require('../config/db');

async function runArticleTests() {
  // Start server on ephemeral port
  const server = app.listen(0, () => {
    const port = server.address().port;
    console.log(`Article test server running on port ${port}`);
  });
  const port = await new Promise((resolve) => {
    server.on('listening', () => resolve(server.address().port));
  });
  const base = `http://localhost:${port}`;

  try {
    console.log('--- Starting article endpoint tests ---');

    // 1. Register & login a test user
    const testEmail = `test_art_${Date.now()}@example.com`;
    const testPassword = 'password123';

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
    const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Attempt to access articles without token → expect 401
    console.log('Checking unauthorized access to /articles');
    res = await fetch(`${base}/articles`, { method: 'GET' });
    if (res.status !== 401) {
      const body = await res.text();
      throw new Error(`Expected 401 on unauthorized access, got ${res.status}, body: ${body}`);
    }
    console.log('Unauthorized access correctly returned 401');

    // 3. Create an article
    console.log('Creating article');
    const articleData = { title: 'Test Article', content: 'Lorem ipsum' };
    res = await fetch(`${base}/articles`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(articleData),
    });
    if (res.status !== 201) {
      const body = await res.text();
      throw new Error(`Create article failed: status ${res.status}, body: ${body}`);
    }
    const createJson = await res.json();
    console.log('Create article response:', createJson);
    const articleId = createJson.article.id;

    // 4. List articles (should include the new one)
    console.log('Listing articles');
    res = await fetch(`${base}/articles?page=1&limit=10`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(`List articles failed: status ${res.status}, body: ${body}`);
    }
    const listJson = await res.json();
    console.log('List articles response:', listJson);
    if (!Array.isArray(listJson.items) || !listJson.items.find(a => a.id === articleId)) {
      throw new Error('Created article not found in list');
    }

    // 5. Fetch article detail
    console.log('Fetching article detail');
    res = await fetch(`${base}/articles/${articleId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(`Get article failed: status ${res.status}, body: ${body}`);
    }
    const detailJson = await res.json();
    console.log('Get article response:', detailJson);

    // 6. Fetch recently-viewed (should include this article)
    console.log('Fetching recently-viewed');
    res = await fetch(`${base}/articles/recently-viewed`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(`Get recently-viewed failed: status ${res.status}, body: ${body}`);
    }
    const recentJson = await res.json();
    console.log('Recently-viewed response:', recentJson);
    if (!Array.isArray(recentJson.articles) || recentJson.articles[0].id !== articleId) {
      throw new Error('Recently-viewed does not include the article');
    }

    // 7. Update the article
    console.log('Updating article title');
    const newTitle = 'Updated Title';
    res = await fetch(`${base}/articles/${articleId}`, {
      method: 'PUT',
      headers: authHeader,
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(`Update article failed: status ${res.status}, body: ${body}`);
    }
    const updateJson = await res.json();
    console.log('Update article response:', updateJson);
    if (updateJson.article.title !== newTitle) {
      throw new Error('Article title not updated');
    }

    // 8. Delete the article
    console.log('Deleting article');
    res = await fetch(`${base}/articles/${articleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 204) {
      const body = await res.text();
      throw new Error(`Delete article failed: status ${res.status}, body: ${body}`);
    }
    console.log('Article deleted');

    // 9. Attempt to fetch deleted article → expect 404
    console.log('Fetching deleted article to confirm 404');
    res = await fetch(`${base}/articles/${articleId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status !== 404) {
      const body = await res.text();
      throw new Error(`Expected 404 for deleted article, got ${res.status}, body: ${body}`);
    }
    console.log('Fetching deleted article correctly returned 404');

    // Cleanup: delete test user
    console.log('Cleaning up: deleting test user:', userId);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('Test user deleted');

    console.log('--- Article endpoint tests completed successfully ---');
    server.close(() => {
      console.log('Article test server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Article endpoint test error:', err);
    server.close(() => process.exit(1));
  }
}

runArticleTests();
