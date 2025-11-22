# Number Discussion App

A full-stack demo project where users communicate using numbers through operations, forming calculation trees.  
Built for the **Ellty Full-Stack Developer Test Assignment**.

---

## 🚀 Stack

| Layer     | Tech                                 |
| --------- | ------------------------------------ |
| Backend   | Node.js, Express, TypeScript, Prisma |
| Frontend  | React, Vite, TypeScript, Ant Design  |
| DB        | PostgreSQL                           |
| Auth      | JWT + bcrypt                         |
| Container | Docker Compose                       |

---

## 🧩 Features

- User signup/login with JWT authentication
- Create discussions with starting values
- Add operations (+ − × ÷) forming calculation trees
- Root operations and nested child operations
- Real-time calculation updates
- Data persisted in PostgreSQL via Prisma
- Comprehensive API documentation with Swagger

---

## 📚 Documentation

- **[Setup Guide](./backend/docs/SETUP.md)** - Complete installation and configuration instructions
- **[Swagger API Docs](http://localhost:8080/docs)** - Interactive API documentation (when running)
- **[Tree Update Algorithm](./backend/docs/TREE_UPDATE_ALGORITHM.md)** - How operation recalculation works

---

## 🛠️ Quick Start

### Prerequisites

- Node.js (v18+)
- Yarn (v1.22+)
- Docker & Docker Compose
- Git

### 1. Clone Repository

```bash
git clone https://github.com/mohammed-taysser/ellty-second-task.git
cd ellty-second-task
```

### 2. Setup Backend

```bash
cd backend
yarn install
cp .env.example .env
```

Edit `.env` and configure your environment variables (see [Setup Guide](./backend/docs/SETUP.md) for details).

### 3. Start Database

```bash
cd ..
docker-compose up -d
```

### 4. Run Migrations & Seed

```bash
cd backend
yarn prisma:migrate
yarn prisma:seed
```

### 5. Start Backend

```bash
yarn dev
```

Backend runs on `http://localhost:8080`

### 6. Setup Frontend

```bash
cd ../frontend
yarn install
echo "VITE_API_ENDPOINT=http://localhost:8080/api" > .env
yarn dev
```

Frontend runs on `http://localhost:5173`

---

## 🔐 Demo Credentials

After seeding the database, you can login with:

- **Email:** `alice@demo.com` (or bob, charlie, diana, eve)
- **Password:** Value of `SEED_USER_PASSWORD` from your `.env` (default: `Demo@123456`)

---

## 📖 Learn More

For detailed setup instructions, troubleshooting, and API usage, see the [Setup Guide](./backend/docs/SETUP.md).

---

## 🧪 Available Scripts

### Backend

| Script                | Description                          |
| --------------------- | ------------------------------------ |
| `yarn dev`            | Start development server             |
| `yarn build`          | Build for production                 |
| `yarn start`          | Run production build                 |
| `yarn prisma:migrate` | Run database migrations              |
| `yarn prisma:seed`    | Seed database with demo data         |
| `yarn prisma:studio`  | Open Prisma Studio (database GUI)    |
| `yarn prisma:reset`   | Reset database (drop, migrate, seed) |

### Frontend

| Script         | Description              |
| -------------- | ------------------------ |
| `yarn dev`     | Start development server |
| `yarn build`   | Build for production     |
| `yarn preview` | Preview production build |

---

## 🏗️ Project Structure

```
ellty-second-task/
├── backend/
│   ├── docs/              # Documentation
│   ├── prisma/            # Database schema & migrations
│   ├── src/
│   │   ├── modules/       # Feature modules (auth, users, discussions, operations)
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           # API clients
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── apps/          # Application logic
│   └── package.json
└── docker-compose.yml     # PostgreSQL setup
```

---

## 🤝 Contributing

This is a test assignment project. For issues or suggestions, please open an issue on GitHub.

---

## 📄 License

MIT

---

## 👤 Author

**Mohammed Taysser**

- GitHub: [@mohammed-taysser](https://github.com/mohammed-taysser)
- Email: mohammedtaysser983@gmail.com
- Portfolio: [https://mohammed-taysser.github.io/portfolio](https://mohammed-taysser.github.io/portfolio)
