# AXP Admin Server

Backend API server for the AXP Admin Dashboard. Provides REST APIs for managing pricing plans, partner testimonials, and partner logos.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 5
- **Language:** TypeScript 5
- **Database:** PostgreSQL 14+
- **File Uploads:** Multer (local disk storage)

## API Endpoints

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | `GET` | `/api/plans` | Fetch all pricing plans |
| 2 | `PUT` | `/api/plans` | Bulk-save pricing plans |
| 3 | `GET` | `/api/partners` | Fetch all partner testimonials |
| 4 | `PUT` | `/api/partners/featured` | Update featured partner selection (max 3) |
| 5 | `GET` | `/api/logos` | Fetch all partner logos |
| 6 | `PUT` | `/api/logos` | Bulk-save partner logos |
| 7 | `POST` | `/api/logos/upload` | Upload a logo image (multipart/form-data) |
| - | `GET` | `/api/health` | Health check |

## Project Structure

```
src/
├── server.ts                 # Entry point
├── app.ts                    # Express app setup (middleware, routes, CORS)
├── config/
│   └── index.ts              # Environment variable configuration
├── database/
│   ├── pool.ts               # PostgreSQL connection pool
│   ├── migrate.ts            # Table creation script
│   └── seed.ts               # Initial data seeder
├── routes/
│   ├── plans.routes.ts       # /api/plans routes
│   ├── partners.routes.ts    # /api/partners routes
│   └── logos.routes.ts       # /api/logos routes
├── controllers/
│   ├── plans.controller.ts   # Request handlers for plans
│   ├── partners.controller.ts
│   └── logos.controller.ts
├── services/
│   ├── plans.service.ts      # Database queries for plans
│   ├── partners.service.ts
│   └── logos.service.ts
└── middleware/
    ├── error-handler.ts      # Global error handling
    └── upload.ts             # Multer file upload configuration
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example` for reference):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USER` | Yes | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | Yes | *(empty)* | PostgreSQL password |
| `DB_NAME` | Yes | `axp_admin` | PostgreSQL database name |
| `UPLOAD_DIR` | No | `uploads` | Directory for uploaded images |
| `MAX_FILE_SIZE` | No | `2097152` | Max upload size in bytes (default 2 MB) |

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (installed and running)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SawLuNaung/axp_admin_server.git
cd axp_admin_server

# 2. Install dependencies
npm install

# 3. Create .env file (copy and edit with your credentials)
cp .env.example .env
# Edit .env with your database credentials

# 4. Create the database (if it doesn't exist)
createdb axp_admin

# 5. Create tables
npm run migrate

# 6. Insert initial data
npm run seed

# 7. Start the development server
npm run dev
```

The server will be running at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with auto-reload (nodemon + ts-node) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start production server (from `dist/`) |
| `npm run migrate` | Create database tables |
| `npm run seed` | Seed initial data (clears existing data first) |

## Docker Deployment

### Build and Run

```bash
# Build the Docker image
docker build -t axp-admin-server .

# Run the container
docker run -d \
  --name axp-admin-server \
  -p 3000:3000 \
  -v axp-uploads:/app/uploads \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=axp_admin \
  axp-admin-server
```

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=axp_admin
      - DB_PASSWORD=your_secure_password
      - DB_NAME=axp_admin
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=axp_admin
      - POSTGRES_PASSWORD=your_secure_password
      - POSTGRES_DB=axp_admin
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U axp_admin -d axp_admin"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  uploads:
```

Then run:

```bash
# Start both containers
docker compose up -d

# Run migration (first time only)
docker compose exec api npm run migrate

# Run seed (first time only)
docker compose exec api npm run seed
```

### Important: Persistent Volumes

| Volume | Mount Point | Purpose |
|--------|-------------|---------|
| `uploads` | `/app/uploads` | Uploaded logo images — must persist across container restarts |
| `pgdata` | `/var/lib/postgresql/data` | PostgreSQL data — must persist across container restarts |

If these volumes are lost, uploaded images and database data will be gone.

## Database Tables

The migration script creates 3 tables:

**plans** — Pricing plans

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(64) PK | |
| title | VARCHAR(255) | |
| price | VARCHAR(50) | e.g. "$9" |
| period | VARCHAR(50) | e.g. "/month" |
| features | JSONB | Array of feature strings |
| button_text | VARCHAR(100) | |
| button_variant | VARCHAR(20) | "primary" or "secondary" |
| is_popular | BOOLEAN | |
| sort_order | INTEGER | Preserves display order |

**partners** — Partner testimonials

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(64) PK | |
| name | VARCHAR(255) | |
| title | VARCHAR(255) | Job title |
| company | VARCHAR(255) | |
| quote | TEXT | |
| image_url | VARCHAR(500) | |
| featured | BOOLEAN | Max 3 can be true |

**partner_logos** — Partner logo strip

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(64) PK | |
| name | VARCHAR(255) | |
| image_url | VARCHAR(500) | URL or uploaded file path |
| link_url | VARCHAR(500) | |
| sort_order | INTEGER | Preserves display order |

## Notes

- **CORS** is currently set to allow all origins (`*`). For production, restrict to the frontend domain.
- **No authentication** is implemented. Add auth middleware if the API will be exposed publicly.
- **Static files**: Uploaded images are served at `/uploads/<filename>`.
