const express = require('express')
const router = express.Router()

const { addItem, getItemsByShop } = require('../controllers/itemController')
const authMiddleware = require('../middleware/authMiddleware')
const requireRole = require('../middleware/requireRole')

// Admin / Vendor adds item
router.post('/', authMiddleware, requireRole(['vendor', 'admin']), addItem)

// Student views items
router.get('/:shopId', getItemsByShop)


module.exports = router
