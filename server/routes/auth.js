import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = express.Router()

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

export default router
