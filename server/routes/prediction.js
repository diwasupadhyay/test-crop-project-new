import express from 'express'
import axios from 'axios'

const router = express.Router()

function getMLUrl() {
  return process.env.ML_SERVICE_URL || 'http://ml-service:5001'
}

// Helper to proxy GET requests with query params
const proxyGet = (mlPath) => async (req, res) => {
  try {
    const response = await axios.get(`${getMLUrl()}${mlPath}`, {
      params: req.query,
      timeout: 120000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      res.status(503).json({ error: 'ML service is starting up or unavailable. Please try again in a moment.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
}

/**
 * POST /api/predict — Proxy prediction request to the ML microservice.
 */
router.post('/predict', async (req, res) => {
  try {
    const response = await axios.post(`${getMLUrl()}/predict`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      res.status(503).json({ error: 'ML service is starting up or unavailable. Please try again in a moment.', status: 'error' })
    } else {
      res.status(500).json({ error: `ML service error: ${error.message}`, status: 'error' })
    }
  }
})

// GET /api/commodities
router.get('/commodities', proxyGet('/commodities'))

// GET /api/markets
router.get('/markets', proxyGet('/markets'))

// ── Cascading dropdown endpoints ──
// GET /api/states
router.get('/states', proxyGet('/states'))

// GET /api/districts?state=...
router.get('/districts', proxyGet('/districts'))

// GET /api/markets-by-district?district=...
router.get('/markets-by-district', proxyGet('/markets-by-district'))

// GET /api/commodities-by-market?market=...
router.get('/commodities-by-market', proxyGet('/commodities-by-market'))

// GET /api/price-range?commodity=...
router.get('/price-range', proxyGet('/price-range'))

export default router
