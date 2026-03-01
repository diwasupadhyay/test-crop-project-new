import express from 'express'
import axios from 'axios'

const router = express.Router()

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:5001'

/**
 * POST /api/predict
 * Proxy prediction request to the ML microservice.
 */
router.post('/predict', async (req, res) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'ML service is unavailable. Please try again later.',
        status: 'error'
      })
    } else {
      res.status(500).json({
        error: `ML service error: ${error.message}`,
        status: 'error'
      })
    }
  }
})

/**
 * GET /api/commodities
 * Proxy commodities list from the ML microservice.
 */
router.get('/commodities', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/commodities`, {
      timeout: 10000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else {
      res.status(503).json({
        error: 'ML service is unavailable. Please try again later.',
        status: 'error'
      })
    }
  }
})

/**
 * GET /api/markets
 * Proxy markets list from the ML microservice.
 */
router.get('/markets', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/markets`, {
      timeout: 10000
    })
    res.status(response.status).json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data)
    } else {
      res.status(503).json({
        error: 'ML service is unavailable. Please try again later.',
        status: 'error'
      })
    }
  }
})

export default router
