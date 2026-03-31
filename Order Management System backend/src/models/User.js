import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    /** Local password login; omit when user only signs in via Firebase. */
    passwordHash: { type: String, select: false },
    /** Firebase Auth uid — set for accounts created or linked via Firebase. */
    firebaseUid: { type: String, sparse: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
