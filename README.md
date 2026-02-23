# Campus Eats

Campus Eats is a full-stack campus food ordering system built for real operations, not just CRUD demos.
It supports student ordering, vendor/chef workflows, role-based security, and production-ready deployment patterns.

## Highlights
- Multi-role architecture: `student`, `vendor` (manager), `chef`, `admin`
- JWT auth with role-aware routing and API protection
- Order lifecycle state machine:
  - `PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED`
  - Rejection path: `PLACED -> REJECTED`
- Atomic order status updates for concurrency safety
- Closed-shop restrictions enforced in backend and frontend checkout flow
- SSE-based live updates for vendor manager and kitchen views
- Vendor-only shop poster upload (local file upload)
- Deployment assets for clustered backend + Nginx reverse proxy

## Tech Stack
- Frontend: React (Vite), Tailwind CSS, Axios, Framer Motion
- Backend: Node.js, Express, MongoDB (Mongoose), JWT, Multer
- Realtime: Server-Sent Events (SSE)
- Deployment: Docker, Nginx, PM2

## Repository Structure
```text
backend/     API, models, controllers, middleware, load tests
frontend/    React app (student/admin/vendor/chef UIs)
deploy/      Nginx config and compose file for clustered deployment
```

## Core Functional Modules
- Auth & Roles
  - Registration: student/vendor
  - Login role validation
  - Chef accounts created by vendor manager
- Student Portal
  - Shop browsing, cart isolation per shop, payment simulation, order tracking
- Vendor Manager
  - Live order board, accept/reject, mark pickup, shop status controls
  - Chef account management and poster image upload
- Chef Kitchen View
  - Controlled status transitions only (`ACCEPTED -> PREPARING -> READY`)
- Admin
  - Shop/vendor assignment and platform-level oversight

## Local Setup

### 1) Install dependencies
```bash
# root (optional)
npm install

# backend
cd backend
npm install

# frontend
cd ../frontend
npm install
```

### 2) Configure environment files
```bash
# backend
copy backend/.env.example backend/.env

# frontend
copy frontend/.env.example frontend/.env
```

Update `backend/.env` with real values:
- `MONGO_URI`
- `JWT_SECRET`
- `PORT` (default `5000`)
- `MONGOOSE_AUTO_INDEX` (`true` for local dev, `false` for production)

### 3) Run development servers
```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:5000`

## Production / Deployment
- Backend production notes:
  - `backend/PRODUCTION.md`
- Cluster deployment with Nginx:
  - `deploy/README.md`
  - `deploy/docker-compose.cluster.yml`
  - `deploy/nginx/campus-eats.conf`

## Migrations & Performance Utilities
- Vendor-shop unique index migration:
```bash
cd backend
npm run migrate:vendor-shop-index
```

- Load tests:
```bash
cd backend
npm run loadtest:autocannon
npm run loadtest:k6
```
See `backend/loadtests/README.md` for required env variables.

## Versioning Strategy
This project uses Semantic Versioning and changelog-based releases:
- Changelog: `CHANGELOG.md`
- Initial release tag target: `v1.0.0`

Recommended release flow:
1. `feature/*` branch
2. PR/merge into `main`
3. Create version tag (`vX.Y.Z`)
4. Deploy tagged release

## Current Baseline
Current baseline is release candidate for:
- role-segregated operations
- realtime vendor updates
- concurrency-safe order transitions
- deployment-ready backend architecture

