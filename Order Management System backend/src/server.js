import 'dotenv/config'
import { connectDb } from './config/db.js'
import { assertJwtSecret } from './utils/jwt.js'
import app from './app.js'

const PORT = Number(process.env.PORT) || 5000

async function main() {
  assertJwtSecret()
  await connectDb()

  if (!process.env.FIREBASE_PROJECT_ID?.trim()) {
    console.warn(
      '[auth] FIREBASE_PROJECT_ID is not set — POST /api/auth/firebase will return 503 until it matches your Firebase project ID.'
    )
  } else {
    console.log(
      `[auth] Firebase ID token verification enabled (project: ${process.env.FIREBASE_PROJECT_ID.trim()})`
    )
  }

  app.listen(PORT, () => {
    console.log(`Smart Inventory API listening on port ${PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
