import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import authRoutes from './routes/auth.js'
import predictionRoutes from './routes/prediction.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

const app = express()

// Trust reverse proxy (Render, Railway, etc.) so rate-limiter gets real client IPs
app.set('trust proxy', 1)

// ── Security middleware ──────────────────────────────────────
// Helmet — sets secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet())

// Prevent NoSQL injection — strips $ and . from req.body/query/params
app.use(mongoSanitize())

// Global rate limiter — 200 requests per 15 min per IP (public + prediction routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', status: 'error' }
})

// Stricter rate limiter for auth endpoints — 20 requests per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.', status: 'error' }
})

// Admin limiter — generous (500 req / 15 min) because the panel polls status frequently
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests, please try again later.', status: 'error' }
})

// CORS — supports multiple origins via comma-separated CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS policy: ${origin} not allowed`))
    }
  },
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', adminLimiter, adminRoutes)
app.use('/api', globalLimiter, predictionRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
