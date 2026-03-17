# Newsletter CRM

A full-stack CRM for managing newsletter content — users, posts, newsletters, and subscribers.

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React + TypeScript + Vite + Tailwind    |
| Backend    | Node.js + TypeScript + Express          |
| ORM        | Prisma                                  |
| Database   | PostgreSQL                              |
| Auth       | JWT + bcrypt                            |
| Testing    | Vitest + Supertest · Vitest + RTL       |
| Containers | Docker Compose                          |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- That's it — no local Node.js or PostgreSQL needed

---

## Running the project

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd react_crm
cp .env.example .env
```

The defaults in `.env` work out of the box — no changes needed for local development.

### 2. Start all services

```bash
docker-compose up --build
```

This starts three containers:
- `crm_postgres` — PostgreSQL on port 5432
- `crm_backend` — Express API on port 4000
- `crm_frontend` — Vite dev server on port 5173

Wait until you see:
```
crm_backend  | Server running on port 4000
crm_frontend | ➜  Local: http://localhost:5173/
```

### 3. Run database migration

In a new terminal:

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 4. Seed the database

```bash
docker-compose exec backend npx prisma db seed
```

This creates:
- **3 categories**: Technology, Business, Design
- **1 admin user**: `admin@crm.com` / `admin123`

### 5. Open the app

| URL                              | Description                  |
|----------------------------------|------------------------------|
| http://localhost:5173            | CRM (redirects to login)     |
| http://localhost:5173/login      | Login page                   |
| http://localhost:5173/subscribe  | Public newsletter signup     |
| http://localhost:4000/health     | API health check             |

Log in with:
- **Email**: `admin@crm.com`
- **Password**: `admin123`

---

## Pages

| Page           | Route          | Access    | Description                              |
|----------------|----------------|-----------|------------------------------------------|
| Login          | `/login`       | Public    | JWT authentication                       |
| Users          | `/users`       | Protected | Create, edit, activate/deactivate users  |
| Posts          | `/posts`       | Protected | Create and manage posts by category      |
| Newsletters    | `/newsletters` | Protected | Build newsletters from 3 category sections |
| Subscribers    | `/subscribers` | Protected | View all newsletter subscribers          |
| Subscribe      | `/subscribe`   | Public    | Email signup form (no account needed)    |

---

## API Endpoints

All endpoints under `/api/*` except `POST /api/auth/login` and `POST /api/subscribers` require a `Authorization: Bearer <token>` header.

```
POST   /api/auth/login
GET    /api/users
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id
GET    /api/posts
POST   /api/posts
PATCH  /api/posts/:id
DELETE /api/posts/:id
GET    /api/categories
GET    /api/newsletters
POST   /api/newsletters
GET    /api/newsletters/:id
PATCH  /api/newsletters/:id
POST   /api/newsletters/:id/sections/:sectionId/posts
DELETE /api/newsletters/:id/sections/:sectionId/posts/:postId
POST   /api/subscribers
GET    /api/subscribers
```

---

## Running tests

### Backend

```bash
docker-compose exec backend npm test
```

Or locally (requires Node.js):

```bash
cd backend
npm test
```

### Frontend

```bash
docker-compose exec frontend npm test
```

Or locally:

```bash
cd frontend
npm test
```

### Troubleshooting: `vitest: not found` in the frontend container

This can happen if the frontend image was built before `vitest` was added to `devDependencies`, or if the container's `node_modules` volume is stale from a previous build.

Docker Compose uses a named anonymous volume for `node_modules` inside each container to prevent the host folder from overwriting the container's installed packages. If that volume was created from an older image, it won't include newly added packages.

Fix — run `npm install` inside the running container to refresh it:

```bash
docker-compose exec frontend npm install --legacy-peer-deps
docker-compose exec frontend npm test
```

If the problem persists, force a full volume recreate:

```bash
docker-compose down -v
docker-compose up --build -d
# Then re-run migration and seed (see steps 3 and 4 above)
```

---

## Stopping the project

```bash
# Stop containers (keeps database data)
docker-compose down

# Stop and wipe the database volume (full reset)
docker-compose down -v
```

After a full reset (`down -v`), repeat steps 3 and 4 to re-migrate and re-seed.

---

## Project structure

```
react_crm/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── app.ts            # Express app factory
│       ├── index.ts          # Server entry point
│       ├── middleware/
│       │   └── auth.ts       # JWT middleware
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── users.ts
│       │   ├── posts.ts
│       │   ├── categories.ts
│       │   ├── newsletters.ts
│       │   └── subscribers.ts
│       └── __tests__/
└── frontend/
    ├── Dockerfile
    └── src/
        ├── api/              # React Query hooks
        ├── auth/             # Auth context + provider
        ├── components/       # Layout, ProtectedRoute
        ├── pages/            # One file per route
        └── __tests__/
```
