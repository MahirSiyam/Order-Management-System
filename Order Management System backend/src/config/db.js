import mongoose from 'mongoose'
import { User } from '../models/User.js'

const cacheKey = '__orderManagementMongoose'

async function runPostConnectMigrations() {
  const r = await User.updateMany(
    { role: 'manager' },
    { $set: { role: 'user' } }
  )
  if (r.modifiedCount > 0) {
    console.log(
      `Migrated ${r.modifiedCount} document(s): role manager → user (schema no longer uses manager)`
    )
  }
}

/**
 * Connect to MongoDB. Reuses one connection on Vercel serverless cold/warm invocations.
 */
export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  const g = globalThis
  if (!g[cacheKey]) {
    g[cacheKey] = { promise: null }
  }
  const bucket = g[cacheKey]

  if (mongoose.connection.readyState === 1) {
    return
  }

  if (!bucket.promise) {
    mongoose.set('strictQuery', true)
    bucket.promise = mongoose
      .connect(uri)
      .then(async () => {
        console.log('MongoDB connected')
        await runPostConnectMigrations()
        return mongoose.connection
      })
      .catch((err) => {
        bucket.promise = null
        throw err
      })
  }

  await bucket.promise
}
