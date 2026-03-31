import mongoose from 'mongoose'
import { User } from '../models/User.js'

/**
 * Connect to MongoDB. Exits process on failure in production-style apps.
 */
export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('MongoDB connected')

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
