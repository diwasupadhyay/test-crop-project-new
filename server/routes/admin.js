import express from 'express'
import axios from 'axios'
import auth from '../middleware/auth.js'
import adminOnly from '../middleware/adminOnly.js'

const router = express.Router()

const getMLUrl = () => process.env.ML_SERVICE_URL || 'http://localhost:5001'

/**
 * All admin routes require authentication + admin role.
 */
router.use(auth)
router.use(adminOnly)

// ── POST /api/admin/retrain — trigger model retrain ──────
router.post('/retrain', async (req, res) => {
  try {
    const response = await axios.post(`${getMLUrl()}/admin/retrain`, {}, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ML service is unavailable.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
})

// ── GET /api/admin/retrain/status ────────────────────────
router.get('/retrain/status', async (req, res) => {
  try {
    const response = await axios.get(`${getMLUrl()}/admin/retrain/status`, { timeout: 10000 })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ML service is unavailable.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
})

// ── GET /api/admin/retrain/history ───────────────────────
router.get('/retrain/history', async (req, res) => {
  try {
    const response = await axios.get(`${getMLUrl()}/admin/retrain/history`, { timeout: 10000 })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ML service is unavailable.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
})

// ── GET /api/admin/data/stats ────────────────────────────
router.get('/data/stats', async (req, res) => {
  try {
    const response = await axios.get(`${getMLUrl()}/admin/data/stats`, { timeout: 10000 })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ML service is unavailable.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
})

// ── GET /api/admin/backups ───────────────────────────────
router.get('/backups', async (req, res) => {
  try {
    const response = await axios.get(`${getMLUrl()}/admin/backups`, { timeout: 10000 })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'ML service is unavailable.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
})

export default router
