# CMS Backend

A Content Management System (CMS) backend built with Node.js, Express, and PostgreSQL (using raw SQL via `pg`). Provides JWT-based authentication, CRUD operations for articles, and a "recently viewed" feature stored in a JSONB column. Includes lightweight test scripts and Docker support.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Tech Stack](#tech-stack)  
3. [Prerequisites](#prerequisites)  
4. [Environment Variables](#environment-variables)  
5. [Database Setup](#database-setup)  
6. [Install Dependencies](#install-dependencies)  
7. [Running Locally](#running-locally)  
8. [Testing Locally](#testing-locally)  
9. [Docker](#docker)  
   - [Dockerfile](#dockerfile)  
   - [Running via Docker](#running-via-docker)  
   - [Docker Compose](#docker-compose)  
10. [Folder Structure](#folder-structure)  
11. [API Endpoints](#api-endpoints)  
    - [Health Check](#health-check)  
    - [Authentication](#authentication)  
    - [Articles (Protected)](#articles-protected)  
12. [Error Handling](#error-handling)  
13. [Logging](#logging)  
14. [Future Enhancements](#future-enhancements)

---

## Project Overview

This repository implements a backend service for a simple CMS. Features include:

- **User registration and authentication** via JSON Web Tokens (JWT) and bcrypt for password hashing.  
- **CRUD operations on articles**: only the owner can create, view, update, or delete their own articles.  
- **"Recently viewed" tracking**: stored as a JSONB array in the `users` table; updated when the owner views an article.  
- **Pagination** for listing articles.  
- **Lightweight testing scripts** using Node's built-in `fetch`, without Jest/Mocha.  
- **Docker support**: Dockerfile for the Node app and docker-compose to run Postgres + app together.  

This project uses raw SQL queries with the `pg` package rather than an ORM or query builder, for simplicity under time constraints.

---

## Tech Stack

- **Runtime/Language**: Node.js (v18+)  
- **Framework**: Express.js  
- **Database**: PostgreSQL  
- **Database Client**: `pg` (node-postgres) for raw SQL queries  
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), bcrypt (`bcryptjs`) for password hashing  
- **Validation**: `express-validator`  
- **Environment Management**: `dotenv`  
- **Testing**: Lightweight Node scripts using built-in `fetch`  
- **Containerization**: Docker & Docker Compose  

---

## Prerequisites

- **Node.js** v18 or higher  
- **npm** (comes with Node.js)  
- **PostgreSQL** (locally installed or via Docker)  
- **psql** CLI or pgAdmin4 for manual database setup  
- **Docker** and **Docker Compose** (for containerized setup)  

---

## Environment Variables

Create a `.env` file in the project root with these variables:

```env
# Server
PORT=3000

# Database (local or container)
DB_HOST=localhost       # For Docker Compose, override to `db`
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

# Recently viewed limit
RECENT_VIEW_LIMIT=10
```

Copy from `.env.example`:

```bash
cp .env.example .env
```

Fill in real values. Ensure `JWT_SECRET` is set to a strong random string.

---

## Database Setup

Since no migration framework is used, schema is created manually via SQL script.

### 1. Create the Database

#### Using pgAdmin
- Open pgAdmin4, connect to your local Postgres server.
- Create a new role/user if desired (e.g., `cms_user`) with login privileges.
- Under "Databases", create a new database named as in your `.env` (`DB_NAME`, e.g., `cmsdb`) and set owner to your role.

#### Using psql CLI
```bash
export PGPASSWORD=your_db_password
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
```

Adjust `DB_HOST`, `DB_USER`, `DB_NAME` as per your `.env`.

If the user lacks CREATE DATABASE privileges, use a superuser or grant privileges first.

### 2. Create Tables

A SQL script `scripts/create_tables.sql` is provided. It contains:

```sql
-- scripts/create_tables.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  recent_views JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Run the script:

```bash
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f scripts/create_tables.sql
```

Verify tables in pgAdmin or via `\dt` in psql.

If you re-run, `IF NOT EXISTS` prevents errors.

---

## Install Dependencies

In project root (`cms-backend/`), run:

```bash
npm install
```

This installs dependencies listed in `package.json`, including `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `express-validator`, `dotenv`. DevDependencies may include `nodemon` if configured.

---

## Running Locally

Ensure `.env` is configured and database tables exist.

Start the server:

```bash
# If you have a dev script:
npm run dev   # e.g., uses nodemon
# Or directly:
node app.js
```

The server listens on `PORT` (default 3000).

Test the health endpoint:

```bash
curl http://localhost:3000/health
# Expected: { "status": "OK" }
```

Use tools like curl or Postman to interact with endpoints (see [API Endpoints](#api-endpoints)).

---

## Testing Locally

Lightweight test scripts are provided under `tests/`:

- **Model tests**: `tests/test-models.js`  
  Verifies `userModel` and `articleModel` functions directly against the database.

- **Auth endpoint tests**: `tests/test-auth.js`  
  Tests registration and login flows.

- **Article endpoint tests**: `tests/test-articles.js`  
  Tests protected article CRUD and recently-viewed logic.

### Running a test script

Ensure the database is running and tables exist. Then:

```bash
node tests/test-models.js
node tests/test-auth.js
node tests/test-articles.js
```

Each script starts the server on an ephemeral port, runs HTTP requests via built-in `fetch`, logs results, and exits with code 0 on success or 1 on failure. Inspect console output for any errors.

---

## Docker

### Dockerfile

A `Dockerfile` is included to build a production-like image:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY . .
ARG PORT=3000
EXPOSE ${PORT}
ENV NODE_ENV=production
CMD ["node", "app.js"]
```

- Builds a lightweight image with dependencies installed.
- Exposes port from `PORT` (default 3000).
- In production, you may set environment variables externally.

### Running via Docker

```bash
# Build image
docker build -t cms-backend .

# Run container (assumes a reachable Postgres instance)
docker run -d \
  -e DB_HOST=<host> \
  -e DB_PORT=5432 \
  -e DB_USER=<user> \
  -e DB_PASSWORD=<password> \
  -e DB_NAME=<dbname> \
  -e JWT_SECRET=<secret> \
  -e JWT_EXPIRES_IN=1h \
  -e RECENT_VIEW_LIMIT=10 \
  -e PORT=3000 \
  -p 3000:3000 \
  cms-backend

# Verify
curl http://localhost:3000/health
```

### Docker Compose

A `docker-compose.yml` is provided to run Postgres and the Node app together:

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./scripts/create_tables.sql:/docker-entrypoint-initdb.d/create_tables.sql
    ports:
      - "5432:5432"

  app:
    build: .
    restart: unless-stopped
    env_file:
      - ./.env
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - PORT=${PORT:-3000}
      - NODE_ENV=development
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    depends_on:
      - db

volumes:
  db-data:
```

#### Usage

1. Ensure `.env` contains at least `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, etc.

2. Start services:
   ```bash
   docker-compose up --build
   ```
   - On first run, Postgres creates the user and database, and runs `create_tables.sql` to create tables.
   - App connects to Postgres at host `db`.

3. Test health:
   ```bash
   curl http://localhost:3000/health
   ```

4. Stop services:
   ```bash
   docker-compose down
   ```
   - Data persists in the `db-data` volume; use `docker-compose down -v` for a fresh start.

---

## Folder Structure

```
cms-backend/               # project root
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── app.js                  # Express app entrypoint
├── config/
│   └── db.js               # pg Pool setup
├── scripts/
│   └── create_tables.sql   # SQL to create users & articles tables
├── models/
│   ├── userModel.js        # raw SQL functions for users
│   └── articleModel.js     # raw SQL functions for articles
├── services/
│   ├── authService.js      # business logic for auth
│   └── articleService.js   # business logic for articles & recently viewed
├── controllers/
│   ├── authController.js   # Express handlers for auth routes
│   └── articleController.js# Express handlers for article routes
├── routes/
│   ├── authRoutes.js       # /auth/register, /auth/login
│   └── articleRoutes.js    # /articles endpoints, protected
├── middlewares/
│   ├── validateMiddleware.js  # input validation using express-validator
│   ├── authMiddleware.js      # JWT verification
│   └── errorHandler.js        # global error handler
├── tests/
│   ├── test-models.js         # direct model function tests
│   ├── test-auth.js           # auth endpoint tests
│   └── test-articles.js       # article endpoint tests
├── validations/               # (optional) for complex schemas
├── utils/                     # (optional) helper functions
└── node_modules/
```

---

## API Endpoints

**Base URL**: `http://localhost:<PORT>`

### Health Check

#### `GET /health`

**Response**: `200 OK`

```json
{ "status": "OK" }
```

### Authentication

#### `POST /auth/register`

**Description**: Register a new user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation**:
- `email` must be a valid email.
- `password` must be at least 6 characters.

**Response**:
- `201 Created`:
  ```json
  { "user": { "id": 1, "email": "user@example.com" } }
  ```
- `400 Bad Request` if email is invalid, password too short, or email already registered:
  ```json
  { "errors": [ ... ] }      # validation errors
  # or
  { "error": "Email already registered" }
  ```

#### `POST /auth/login`

**Description**: Log in an existing user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation**:
- `email` must be valid.
- `password` required.

**Response**:
- `200 OK`:
  ```json
  { "token": "<jwt_token>" }
  ```
- `401 Unauthorized` on invalid credentials:
  ```json
  { "error": "Invalid credentials" }
  ```
- `400 Bad Request` for validation errors.

### Articles (Protected Routes)

All article routes require `Authorization: Bearer <token>` header with a valid JWT obtained from login.

#### `POST /articles`

**Description**: Create a new article.

**Request Body**:
```json
{
  "title": "My Article",
  "content": "Article content..."
}
```

**Validation**:
- `title` must not be empty.
- `content` must not be empty.

**Response**:
- `201 Created`:
  ```json
  { "article": { "id": 1, "user_id": 1, "title": "...", "content": "...", "created_at": "...", "updated_at": "..." } }
  ```
- `401 Unauthorized` if missing/invalid token.
- `400 Bad Request` for validation errors.

#### `GET /articles`

**Description**: List articles of the authenticated user, with pagination.

**Query Parameters**:
- `page` (optional, integer ≥ 1, default 1)
- `limit` (optional, integer ≥ 1, default 10)

**Response**:
- `200 OK`:
  ```json
  {
    "items": [
      { "id": 2, "user_id": 1, "title": "...", "content": "...", "created_at": "...", "updated_at": "..." },
      ...
    ],
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
  ```
- `401 Unauthorized` if missing/invalid token.

#### `GET /articles/:id`

**Description**: Get details of a specific article (must belong to the user). Also updates the "recently viewed" list.

**Path Parameter**:
- `id` (integer)

**Response**:
- `200 OK`:
  ```json
  { "article": { "id": 1, "user_id": 1, "title": "...", "content": "...", "created_at": "...", "updated_at": "..." } }
  ```
- `401 Unauthorized` if missing/invalid token.
- `403 Forbidden` if the article does not belong to the user.
- `404 Not Found` if no such article exists.

#### `GET /articles/recently-viewed`

**Description**: Get the list of recently viewed articles (most recent first) for the authenticated user.

**Response**:
- `200 OK`:
  ```json
  { "articles": [ { ... }, ... ] }
  ```
  - May be empty array if none viewed.
  - Skips deleted articles automatically.
- `401 Unauthorized` if missing/invalid token.

#### `PUT /articles/:id`

**Description**: Update an existing article (must belong to the user).

**Path Parameter**:
- `id` (integer)

**Request Body** (one or both fields):
```json
{
  "title": "New Title",    // optional
  "content": "New content" // optional
}
```

**Validation**:
- `title`, if provided, must not be empty.
- `content`, if provided, must not be empty.

**Response**:
- `200 OK`:
  ```json
  { "article": { "id": 1, "user_id": 1, "title": "...", "content": "...", "created_at": "...", "updated_at": "..." } }
  ```
- `401 Unauthorized` if missing/invalid token.
- `403 Forbidden` if not the owner.
- `404 Not Found` if article doesn't exist.
- `400 Bad Request` for validation errors.

#### `DELETE /articles/:id`

**Description**: Delete an existing article (must belong to the user).

**Path Parameter**:
- `id` (integer)

**Response**:
- `204 No Content` on success.
- `401 Unauthorized` if missing/invalid token.
- `403 Forbidden` if not the owner.
- `404 Not Found` if no such article.

---

## Error Handling

A global error-handling middleware sends JSON responses:

```json
{ "error": "Error message" }
```

with the appropriate HTTP status code:

- `400` for bad requests (validation failures, duplicate email)
- `401` for unauthorized (missing/invalid token or user not found)
- `403` for forbidden actions
- `404` for not found
- `500` for internal server errors

Validation errors from `express-validator` return:

```json
{ "errors": [ { "msg": "...", "param": "...", ... }, ... ] }
```

---

## Logging

Development uses `console.log` / `console.error` to log key events: server start, DB connection errors, authentication errors, etc.

In production, replace with a proper logger (e.g., winston) as needed.

---

## Future Enhancements

- **Migrations**: Integrate a migration tool (e.g., `node-pg-migrate`) for version-controlled schema changes.
- **Separate recent-views table**: Normalize "recently viewed" into its own table for scalability and analytics.
- **Pagination improvements**: Cursor-based pagination for large datasets.
- **Search & filtering**: Add full-text search on articles, filtering by date, etc.
- **Role-based access**: Support admin roles, public articles, or shared articles.
- **File uploads**: Allow images or attachments for articles (e.g., via AWS S3).
- **Caching**: Use Redis or in-memory cache for read-heavy endpoints.
- **Rate limiting & security**: Add rate limiting, Helmet for headers, CORS configuration.
- **Testing framework**: Migrate lightweight scripts to Jest/Mocha for structured tests.
- **CI/CD**: Configure GitHub Actions to run test scripts on push.
- **Deployment**: Container registry, Kubernetes or cloud deployment pipelines.
