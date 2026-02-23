const express = require('express')
const router = express.Router()

const protect = require('../middleware/authMiddleware')
const requireRole = require('../middleware/requireRole')

const {
  createShop,
  assignVendorToShop,
  getAllShops,
  getShopById,
  openShop,
  closeShop,
} = require('../controllers/shopController')

router.get('/', getAllShops)
router.get('/:shopId', getShopById)

router.post('/', protect, requireRole('admin'), createShop)
router.put('/:shopId/assign-vendor', protect, requireRole('admin'), assignVendorToShop)
router.put('/:shopId/open', protect, requireRole('admin'), openShop)
router.put('/:shopId/close', protect, requireRole('admin'), closeShop)

module.exports = router
