const express = require('express')
const protect = require('../middleware/authMiddleware')
const requireRole = require('../middleware/requireRole')
const {
  getPlatformStats,
  getVendors,
} = require('../controllers/adminController')

const router = express.Router()

router.get('/dashboard', protect, requireRole('admin'), (req, res) => {
  res.json({
    message: 'Welcome Admin',
    admin: req.user.name,
  })
})

router.get('/platform-stats', protect, requireRole('admin'), getPlatformStats)
router.get('/vendors', protect, requireRole('admin'), getVendors)

module.exports = router
