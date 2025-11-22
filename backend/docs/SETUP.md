# Setup Guide - Number Discussion App

This guide will walk you through setting up the Number Discussion App locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Yarn** (v1.22 or higher) - [Install](https://classic.yarnpkg.com/en/docs/install)
- **Docker** & **Docker Compose** - [Install](https://docs.docker.com/get-docker/)
- **Git** - [Install](https://git-scm.com/downloads)

## Project Structure

```text
ellty-second-task/
├── backend/          # Node.js + Express + Prisma API
├── frontend/         # React + Vite frontend
└── docker-compose.yml # PostgreSQL database
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

**Required Environment Variables:**

| Variable                 | Description                                                                      | Example                                                                        |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`           | Full database connection string                                                  | `postgresql://ellty_user:ellty_password@localhost:5432/ellty_db?schema=public` |
| `SEED_USER_PASSWORD`     | Password for demo users (min 8 chars, must contain uppercase, lowercase, number) | `Demo@123456`                                                                  |
| `JWT_SECRET`             | Secret key for JWT tokens                                                        | `your-super-secret-jwt-key`                                                    |
| `JWT_ACCESS_EXPIRES_IN`  | Access token expiration                                                          | `1d`                                                                           |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration                                                         | `7d`                                                                           |
| `PORT`                   | Server port                                                                      | `8080`                                                                         |
| `NODE_ENV`               | Environment mode                                                                 | `development`                                                                  |

> [!IMPORTANT]
> **Environment Validation**
> All environment variables are validated using Zod schema. The application will not start if required variables are missing or invalid.

### 4. Start PostgreSQL Database

From the **root directory** (not backend):

```bash
cd ..
docker-compose up -d
```

This will:

- Pull the PostgreSQL 16 Alpine image
- Create a PostgreSQL container named `ellty-postgres`
- Expose PostgreSQL on port `5432`
- Create a persistent volume for data

**Verify database is running:**

```bash
docker ps
```

You should see `ellty-postgres` in the list.

**Check database health:**

```bash
docker-compose logs postgres
```

### 5. Run Database Migrations

Navigate back to backend:

```bash
cd backend
```

Generate Prisma Client:

```bash
yarn prisma:generate
```

Run migrations to create database schema:

```bash
yarn prisma:migrate
```

When prompted for a migration name, enter something like: `init`

### 6. Seed Database with Demo Data

```bash
yarn prisma:seed
```

This will create:

- **5 demo users** (<alice@demo.com>, <bob@demo.com>, <charlie@demo.com>, <diana@demo.com>, <eve@demo.com>)
- **7 discussions** with various starting values
- **30+ operations** forming realistic calculation trees

**Demo User Credentials:**

- Email: `alice@demo.com` (or any demo user)
- Password: Value of `SEED_USER_PASSWORD` from your `.env` file

### 7. Start Backend Server

```bash
yarn dev
```

The backend will start on `http://localhost:8080`

**Available Endpoints:**

- API: `http://localhost:8080/api`
- Swagger Docs: `http://localhost:8080/docs`
- Health Check: `http://localhost:8080/health`

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd ../frontend
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Configuration

Create a `.env` file:

```bash
touch .env
```

Add the following:

```env
VITE_API_ENDPOINT=http://localhost:8080/api
```

### 4. Start Frontend Development Server

```bash
yarn dev
```

The frontend will start on `http://localhost:5173`

## Verification

### 1. Test Backend API

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### 2. Test Database Connection

Open Prisma Studio to browse the database:

```bash
cd backend
yarn prisma:studio
```

This opens a web interface at `http://localhost:5555`

### 3. Test Frontend

1. Open `http://localhost:5173` in your browser
2. Click "Login"
3. Use demo credentials:
   - Email: `alice@demo.com`
   - Password: Your `SEED_USER_PASSWORD`
4. You should see the list of discussions

## Common Issues & Troubleshooting

### Issue: Database Connection Failed

**Error:** `Can't reach database server at localhost:5432`

**Solution:**

1. Ensure Docker is running: `docker ps`
2. Check if PostgreSQL container is up: `docker-compose ps`
3. Restart the container: `docker-compose restart postgres`
4. Check logs: `docker-compose logs postgres`

### Issue: Environment Validation Failed

**Error:** `Environment validation failed: SEED_USER_PASSWORD: must contain uppercase, lowercase, and number`

**Solution:**
Update your `.env` file with a password that meets requirements:

```env
SEED_USER_PASSWORD=Demo@123456
```

### Issue: Prisma Migration Failed

**Error:** `P1001: Can't reach database server`

**Solution:**

1. Verify `DATABASE_URL` in `.env` matches your PostgreSQL configuration
2. Ensure PostgreSQL is running
3. Test connection manually:

   ```bash
   docker exec -it ellty-postgres psql -U ellty_user -d ellty_db
   ```

### Issue: Seed Script Fails

**Error:** `Unique constraint failed on the fields: (email)`

**Solution:**
Reset the database and try again:

```bash
yarn prisma:reset
```

This will:

1. Drop the database
2. Recreate it
3. Run migrations
4. Run seed script automatically

### Issue: Port Already in Use

**Error:** `Port 8080 is already in use`

**Solution:**

1. Find the process using the port:

   ```bash
   lsof -i :8080
   ```

2. Kill the process or change the `PORT` in `.env`

## Database Management Commands

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `yarn prisma:studio`   | Open Prisma Studio (database GUI)              |
| `yarn prisma:migrate`  | Create and run a new migration                 |
| `yarn prisma:reset`    | Reset database (drop, recreate, migrate, seed) |
| `yarn prisma:seed`     | Run seed script only                           |
| `yarn prisma:generate` | Generate Prisma Client                         |
| `yarn prisma:format`   | Format schema.prisma file                      |
| `yarn prisma:validate` | Validate schema.prisma file                    |

## Docker Commands

| Command                                                         | Description                                       |
| --------------------------------------------------------------- | ------------------------------------------------- |
| `docker-compose up -d`                                          | Start PostgreSQL in background                    |
| `docker-compose down`                                           | Stop and remove containers                        |
| `docker-compose down -v`                                        | Stop containers and remove volumes (deletes data) |
| `docker-compose logs postgres`                                  | View PostgreSQL logs                              |
| `docker-compose restart postgres`                               | Restart PostgreSQL                                |
| `docker exec -it ellty-postgres psql -U ellty_user -d ellty_db` | Access PostgreSQL CLI                             |

## Development Workflow

### Daily Development

1. Start PostgreSQL:

   ```bash
   docker-compose up -d
   ```

2. Start backend:

   ```bash
   cd backend
   yarn dev
   ```

3. Start frontend (in a new terminal):

   ```bash
   cd frontend
   yarn dev
   ```

### After Pulling New Changes

1. Update dependencies:

   ```bash
   cd backend && yarn install
   cd ../frontend && yarn install
   ```

2. Run new migrations:

   ```bash
   cd backend
   yarn prisma:migrate
   ```

3. Regenerate Prisma Client:

   ```bash
   yarn prisma:generate
   ```

### Resetting Everything

If you want to start fresh:

```bash
# Stop and remove database
docker-compose down -v

# Start fresh database
docker-compose up -d

# Reset backend database
cd backend
yarn prisma:reset

# Restart servers
yarn dev
```

## Next Steps

- Read the [API Documentation](./API.md) to understand available endpoints
- Check the [Tree Update Algorithm](./TREE_UPDATE_ALGORITHM.md) to understand operation recalculation
- Explore the Swagger docs at `http://localhost:8080/docs`
- Open Prisma Studio to browse the database: `yarn prisma:studio`

## Understanding Prisma Client Singleton (`src/apps/prisma.ts`)

The project uses a centralized Prisma Client instance defined in `src/apps/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

### Benefits of This Pattern

**1. Single Database Connection Pool**

- Prevents creating multiple Prisma Client instances
- Avoids exhausting database connections
- Improves performance by reusing connections

**2. Consistent Configuration**

- All database queries use the same client configuration
- Easier to add middleware or logging globally
- Centralized error handling

**3. Development Hot-Reload Safety**

- In development, Next.js/ts-node-dev hot-reloads modules
- Without singleton pattern, each reload creates a new connection
- Can quickly exhaust database connection limits

**4. Easier Testing**

- Single import point makes mocking easier
- Can swap with test database client
- Consistent across all modules

### Usage Example

Instead of creating a new client in each file:

```typescript
// ❌ Bad: Creates multiple connections
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

Import the singleton:

```typescript
// ✅ Good: Reuses single connection pool
import prisma from '@/apps/prisma';

const users = await prisma.user.findMany();
```

### Connection Pooling

Prisma automatically manages connection pooling. The singleton ensures:

- Maximum connection efficiency
- Automatic connection recycling
- Graceful handling of connection limits

For production, you can configure pool size in `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=20"
```

## Support

If you encounter any issues not covered in this guide, please:

1. Check the [GitHub Issues](https://github.com/mohammed-taysser/ellty-second-task/issues)
2. Review the application logs
3. Ensure all prerequisites are correctly installed
