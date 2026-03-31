# Deploy InventraX on Vercel (frontend + backend)

Create **two Vercel projects** from the same Git repo, each with a different **Root Directory**.

## Prerequisites

- GitHub (or GitLab/Bitbucket) repo connected to Vercel  
- **MongoDB Atlas** (or another cloud MongoDB) — Vercel cannot reach `mongodb://127.0.0.1`  
- Deploy **backend first**, copy its URL, then configure the frontend build  

---

## 1. Backend API project

1. **Vercel** → *Add New Project* → import this repository.  
2. **Root Directory:** `Order Management System backend`  
   - *Edit* the root path in the import screen (folder name includes spaces — keep them exact).  
3. **Framework Preset:** Other (no framework), or leave auto-detect.  
4. **Build Command:** leave empty (no build step).  
5. **Output Directory:** leave default / N/A for serverless API.  
6. **Install Command:** `npm install`  

### Backend — Environment variables

Add these in the project **Settings → Environment Variables** (Production / Preview as needed):

| Name | Example / notes |
| ---- | ----------------- |
| `MONGODB_URI` | Atlas SRV connection string |
| `JWT_SECRET` | Long random string (required) |
| `JWT_EXPIRES_IN` | Optional, e.g. `7d` |
| `CORS_ORIGIN` | Your **frontend** URL only, e.g. `https://your-app.vercel.app` (no trailing slash) |
| `FIREBASE_PROJECT_ID` | Same as Firebase Console / `VITE_FIREBASE_PROJECT_ID` if you use Firebase auth |
| `NODE_ENV` | `production` |

Optional: `ADMIN_EMAILS`, `DEMO_EMAIL`, `DEMO_AS_ADMIN` — see `Order Management System backend/.env.example`.

### How the backend runs on Vercel

- `vercel.json` rewrites all routes to the serverless function in **`api/index.js`**.  
- That file loads `src/app.js` (Express), runs `assertJwtSecret()` + `connectDb()` once per cold start (Mongo connection is cached for warm invocations).  
- Health check: `GET https://<backend>.vercel.app/health`  
- API base path: `https://<backend>.vercel.app/api/...` (same as local).  

Local development is unchanged: `npm run dev` still uses `src/server.js`.

---

## 2. Frontend project

1. **Vercel** → *Add New Project* → same repo again.  
2. **Root Directory:** `Order Management System frontend`  
3. **Framework Preset:** Vite (auto).  
4. **Build Command:** `npm run build`  
5. **Output Directory:** `dist`  

### Frontend — Environment variables (build time)

`VITE_*` variables are baked in at **build** time. Set them before deploy / redeploy after changes:

| Name | Value |
| ---- | ----- |
| `VITE_USE_REMOTE_API` | `true` |
| `VITE_API_BASE_URL` | `https://<your-backend>.vercel.app/api` |

Add any Firebase / demo keys you use locally — see `Order Management System frontend/.env.example`.

### SPA routing

`vercel.json` in the frontend folder rewrites unknown paths to `index.html` so React Router works.

---

## 3. After both deploy

1. Set backend **`CORS_ORIGIN`** to the exact frontend URL (e.g. `https://inventrax-web.vercel.app`).  
2. Redeploy backend if you change CORS.  
3. If you use **Firebase Auth**, configure **authorized domains** (see below).  
4. Optional: assign a custom domain in Vercel and update `CORS_ORIGIN` + `VITE_API_BASE_URL` accordingly, then **rebuild** the frontend.  

### Firebase — “This domain is not allowed for sign-in”

Firebase only allows auth (especially **Google sign-in** and the Auth popup) on hosts you explicitly allow.

1. Open **[Firebase Console](https://console.firebase.google.com/)** → your project.  
2. Go to **Build → Authentication** → **Settings** (gear tab) → **Authorized domains**.  
3. Click **Add domain** and add **only the host** (no `https://`, no path):

   | Where you open the app | Domain to add |
   | ---------------------- | --------------- |
   | Local Vite | `localhost` |
   | Vercel preview / production | `your-app.vercel.app` (your real subdomain) |
   | Custom domain | e.g. `app.example.com` |

4. Defaults already include `localhost` and your **Firebase Hosting** domain (`your-project-id.firebaseapp.com`). They do **not** include arbitrary Vercel URLs until you add them.  
5. Save, wait a minute, then try sign-in again (hard refresh or incognito if the browser cached the error).

---

## Troubleshooting

| Issue | What to check |
| ----- | ------------- |
| “Domain is not allowed for sign-in” (Firebase) | **Authentication → Settings → Authorized domains** — add your exact frontend host (`localhost` or `*.vercel.app` hostname) |
| API 500 / Mongo errors | `MONGODB_URI` in Vercel; Atlas IP allowlist **0.0.0.0/0** (or Vercel egress) |
| CORS errors in browser | `CORS_ORIGIN` matches frontend origin exactly (scheme + host, no path) |
| Frontend calls wrong API | `VITE_API_BASE_URL` includes `/api` and **trigger a new deploy** after editing env |
| Cold start slow | Normal for serverless + Mongo; consider Atlas tier / connection pooling |

---

## CLI (optional)

```bash
npm i -g vercel
cd "Order Management System backend"
vercel
```

Repeat with `Order Management System frontend`. Link each folder to its own Vercel project when prompted.
