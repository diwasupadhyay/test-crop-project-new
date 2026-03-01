import User from '../models/User.js'

/**
 * Middleware that restricts access to admin users only.
 * Must be used AFTER the auth middleware (req.userId is required).
 */
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found', status: 'error' })
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required', status: 'error' })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: 'Server error', status: 'error' })
  }
}

export default adminOnly
