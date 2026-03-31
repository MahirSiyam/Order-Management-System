import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler.js'
import apiRoutes from './routes/index.js'

/** CORS_ORIGIN must be a single browser origin (e.g. http://localhost:5173), not MONGODB_URI. */
function resolveCorsOrigin() {
  const raw = process.env.CORS_ORIGIN?.trim()
  if (!raw) return true
  if (/^mongodb(\+srv)?:\/\//i.test(raw)) {
    console.warn(
      '[cors] CORS_ORIGIN looks like a MongoDB URI — use MONGODB_URI for the database. ' +
        'Set CORS_ORIGIN to your frontend URL (e.g. http://localhost:5173). Using permissive origin for now.'
    )
    return true
  }
  try {
    const u = new URL(raw)
    if (u.protocol === 'http:' || u.protocol === 'https:') return raw
  } catch {
    /* fall through */
  }
  console.warn(
    `[cors] CORS_ORIGIN "${raw.slice(0, 40)}..." is not a valid http(s) URL; using permissive origin.`
  )
  return true
}

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: resolveCorsOrigin(),
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

/** Public health check (no auth). */
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'order-management-api' })
})

app.use('/api', apiRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' })
})

app.use(errorHandler)

export default app
