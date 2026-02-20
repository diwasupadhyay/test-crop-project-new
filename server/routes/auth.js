import express from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'
import { sendResetEmail } from '../utils/email.js'

const router = express.Router()

// Simple in-memory rate limiter for forgot-password
const resetAttempts = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 3

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// ── Register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }

    const user = new User({ name, email, password, provider: 'local' })
    await user.save()

    const token = generateToken(user._id)

    res.status(201).json({ token, user: user.toJSON() })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// ── Login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({ error: 'This account uses Google sign-in. Please login with Google.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const token = generateToken(user._id)

    res.json({ token, user: user.toJSON() })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// ── Google OAuth ────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' })
    }

    // Verify the access token with Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google token' })
    }

    const { sub: googleId, email, name, picture } = await googleRes.json()

    if (!email) {
      return res.status(400).json({ error: 'Could not retrieve email from Google' })
    }

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (user) {
      // Link Google account if user exists but hasn't linked Google yet
      if (!user.googleId) {
        user.googleId = googleId
        if (!user.avatar && picture) user.avatar = picture
        await user.save()
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        provider: 'google'
      })
      await user.save()
    }

    const token = generateToken(user._id)

    res.json({ token, user: user.toJSON() })
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(500).json({ error: 'Google authentication failed. Please try again.' })
  }
})

// ── Get Current User ────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: user.toJSON() })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── Forgot Password ─────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Rate limit: max 3 requests per email per minute
    const key = email.toLowerCase().trim()
    const now = Date.now()
    const attempts = resetAttempts.get(key) || []
    const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW)
    if (recent.length >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' })
    }
    recent.push(now)
    resetAttempts.set(key, recent)

    const user = await User.findOne({ email })

    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' })
    }

    if (user.provider === 'google' && !user.password) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' })
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex')
    // Store hashed token in DB (more secure)
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    // Send the plain token in email (user clicks it), hashed version is in DB
    await sendResetEmail(user.email, resetToken)

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Failed to process request. Please try again.' })
  }
})

// ── Reset Password ──────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' })
    }

    // Set new password and clear reset token
    user.password = password
    user.resetToken = undefined
    user.resetTokenExpiry = undefined
    await user.save()

    res.json({ message: 'Password reset successful. You can now log in with your new password.' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Failed to reset password. Please try again.' })
  }
})

export default router
