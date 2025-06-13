// tests/test-models.js
require('dotenv').config(); // Load environment variables from .env at project root

const db = require('../config/db');
const {
  createUser,
  getUserByEmail,
  getUserById,
  updateRecentViews,
} = require('../models/userModel');
const {
  createArticle,
  getArticleById,
  getArticlesByUser,
  updateArticle,
  deleteArticle,
} = require('../models/articleModel');

async function runTests() {
  try {
    console.log('--- Starting model tests ---');

    // 1. Create a user
    const email = `test_${Date.now()}@example.com`;
    const pwHash = 'hashed_password_example';
    console.log(`Creating user with email: ${email}`);
    const user = await createUser(email, pwHash);
    console.log('Created user:', user);

    // 2. Fetch by email
    const fetchedByEmail = await getUserByEmail(email);
    console.log('Fetched user by email:', fetchedByEmail);

    // 3. Fetch by ID
    const fetchedById = await getUserById(user.id);
    console.log('Fetched user by id:', fetchedById);

    // 4. Update recent_views
    console.log('Updating recent_views to [1,2,3] for user id', user.id);
    const updatedViews = await updateRecentViews(user.id, [1, 2, 3]);
    console.log('Updated recent_views:', updatedViews);

    // 5. Create an article
    console.log('Creating article for user id', user.id);
    const article = await createArticle(user.id, 'Test Title', 'Test content');
    console.log('Created article:', article);

    // 6. Fetch that article by id
    const fetchedArticle = await getArticleById(article.id);
    console.log('Fetched article by id:', fetchedArticle);

    // 7. List articles by this user (limit 10, offset 0)
    const { items, total } = await getArticlesByUser(user.id, 10, 0);
    console.log(`Listing articles for user ${user.id}: total = ${total}`, items);

    // 8. Update the article (change title)
    console.log('Updating article id', article.id, 'title to "New Title"');
    const updatedArticle = await updateArticle(article.id, { title: 'New Title' });
    console.log('Updated article:', updatedArticle);

    // 9. Delete the article
    console.log('Deleting article id', article.id);
    await deleteArticle(article.id);
    console.log('Deleted article.');

    // 10. Clean up: delete the test user
    console.log('Deleting user id', user.id);
    await db.query('DELETE FROM users WHERE id = $1', [user.id]);
    console.log('Deleted test user.');

    console.log('--- Model tests completed successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during model tests:', err);
    process.exit(1);
  }
}

runTests();
