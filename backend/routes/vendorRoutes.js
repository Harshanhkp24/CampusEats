const express = require('express')
const protect = require('../middleware/authMiddleware')
const requireRole = require('../middleware/requireRole')
const uploadShopPoster = require('../middleware/uploadShopPoster')
const { getVendorStats } = require('../controllers/adminController')
const {
  getVendorManagerOverview,
  setVendorShopStatus,
  createChefAccount,
  getChefAccounts,
  updateShopPoster,
} = require('../controllers/vendorController')

const router = express.Router()

router.get('/stats', protect, requireRole(['vendor', 'admin']), getVendorStats)
router.get('/stats/:shopId', protect, requireRole(['vendor', 'admin']), getVendorStats)
router.get('/manager/overview', protect, requireRole('vendor'), getVendorManagerOverview)
router.patch('/manager/shop-status', protect, requireRole('vendor'), setVendorShopStatus)
router.post(
  '/manager/poster',
  protect,
  requireRole('vendor'),
  (req, res, next) => {
    uploadShopPoster.single('poster')(req, res, (error) => {
      if (!error) {
        next()
        return
      }

      res.status(400).json({ message: error.message || 'Invalid poster upload request' })
    })
  },
  updateShopPoster,
)
router.get('/manager/chefs', protect, requireRole('vendor'), getChefAccounts)
router.post('/manager/chefs', protect, requireRole('vendor'), createChefAccount)

module.exports = router
