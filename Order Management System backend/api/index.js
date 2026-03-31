/**
 * Vercel serverless entry — all HTTP traffic is routed here via vercel.json.
 * Local development still uses `npm run dev` → src/server.js
 */
import 'dotenv/config'
import app from '../src/app.js'
import { connectDb } from '../src/config/db.js'
import { assertJwtSecret } from '../src/utils/jwt.js'

let ready

async function ensureReady() {
  if (!ready) {
    ready = (async () => {
      assertJwtSecret()
      await connectDb()
    })()
  }
  await ready
}

export default async function handler(req, res) {
  await ensureReady()
  await new Promise((resolve, reject) => {
    res.on('finish', resolve)
    res.on('error', reject)
    app(req, res)
  })
}
