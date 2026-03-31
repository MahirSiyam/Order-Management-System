# InventraX — Order Management System

Full-stack inventory and order management app: **React + Vite** frontend, **Express + MongoDB** backend, with optional **Firebase Authentication** (email/password and Google) and JWT sessions against the REST API.

## Features

- Dashboard, products, categories, orders, restock flows, and activity logs  
- Role-based access (**admin** vs **portal user**)  
- Auth: local demo mode, JWT + MongoDB, or Firebase + `POST /api/auth/firebase` token exchange  
- Responsive UI (**Tailwind CSS** + **DaisyUI**), split-screen auth with **InventraX** branding  

## Tech stack

| Layer    | Stack |
| -------- | ----- |
| Frontend | React 19, TypeScript, Vite 8, React Router 7, TanStack Query, Axios, Firebase JS SDK, Recharts |
| Backend  | Node.js 18+, Express 4, Mongoose 8, JWT, bcrypt, Helmet, CORS |
| Database | MongoDB |

## Repository layout

```
├── Order Management System frontend/   # Vite + React SPA
└── Order Management System backend/    # Express API (`/api` routes)
```

## Prerequisites

- **Node.js** ≥ 18  
- **MongoDB** running locally or a **MongoDB Atlas** connection string  

## Quick start

### 1. Backend

```bash
cd "Order Management System backend"
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, optional FIREBASE_* / ADMIN_EMAILS
npm install
npm run dev
```

API defaults to **http://localhost:5000** (see `PORT` in `.env`).

### 2. Frontend

```bash
cd "Order Management System frontend"
cp .env.example .env
# Edit .env — see below for API URL and optional Firebase
npm install
npm run dev
```

App defaults to **http://localhost:5173**.

### 3. Point the SPA at the API

For local development, set the API base URL in the frontend `.env` (see `.env.example`):

```env
VITE_USE_REMOTE_API=true
VITE_API_BASE_URL=http://localhost:5000/api
```

Alternatively add a `server.proxy` entry in `vite.config.ts` for `/api` → `http://localhost:5000` and keep `VITE_API_BASE_URL=/api`.

Restart `npm run dev` after changing env vars.

## Environment configuration

- **Backend:** `Order Management System backend/.env.example` — MongoDB, `JWT_SECRET`, `FIREBASE_PROJECT_ID`, service account path/JSON for Firebase token verify, CORS, admin/demo flags.  
- **Frontend:** `Order Management System frontend/.env.example` — API base URL, demo login emails, optional `VITE_USE_FIREBASE_AUTH` and `VITE_FIREBASE_*`, hero image URLs, `VITE_ADMIN_EMAILS`.  

Never commit real `.env` files or Firebase service account keys.

## Scripts

| Location | Command | Purpose |
| -------- | ------- | ------- |
| Frontend | `npm run dev` | Vite dev server |
| Frontend | `npm run build` | Typecheck + production build → `dist/` |
| Frontend | `npm run preview` | Preview production build |
| Frontend | `npm run lint` | ESLint |
| Backend | `npm run dev` | Express with `--watch` |
| Backend | `npm start` | Production-style start |

## Production notes

- Serve the **frontend** `dist/` behind any static host or CDN; set `VITE_API_BASE_URL` at build time to your public API URL.  
- Run the **backend** with `NODE_ENV=production`, a strong `JWT_SECRET`, and locked-down `CORS_ORIGIN`.  
- Ensure MongoDB indexes/backups and Firebase authorized domains match your deployment hostnames.  

## License

Private / unlicensed unless you add a `LICENSE` file.
