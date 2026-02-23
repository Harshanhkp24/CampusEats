const express = require('express')
const router = express.Router()

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getOrdersByShop,
  getVendorOrderBoard,
  acceptOrder,
  updateOrderStatus,
  rejectOrder,
  getShopQueue,
} = require('../controllers/orderController')
const { streamShopEvents } = require('../controllers/streamController')

const protect = require('../middleware/authMiddleware')
const sseProtect = require('../middleware/sseAuthMiddleware')
const requireRole = require('../middleware/requireRole')

router.post('/', protect, createOrder)
router.get('/stream', sseProtect, requireRole(['vendor', 'chef', 'admin']), streamShopEvents)

router.get('/shop/board', protect, requireRole(['vendor', 'chef', 'admin']), getVendorOrderBoard)
router.get('/shop', protect, requireRole(['vendor', 'chef', 'admin']), getOrdersByShop)
router.get('/shop/:shopId', protect, requireRole(['vendor', 'chef', 'admin']), getOrdersByShop)

router.patch('/:orderId/accept', protect, requireRole('vendor'), acceptOrder)
router.patch('/:orderId/status', protect, requireRole(['vendor', 'chef', 'admin']), updateOrderStatus)
router.put('/:orderId/reject', protect, requireRole('vendor'), rejectOrder)

router.get('/my', protect, getMyOrders)
router.get('/my/:orderId', protect, getMyOrderById)

router.get('/queue', protect, requireRole(['vendor', 'chef', 'admin']), getShopQueue)
router.get('/queue/:shopId', getShopQueue)

module.exports = router
