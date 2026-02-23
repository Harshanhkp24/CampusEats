const express = require('express')
const protect = require('../middleware/authMiddleware')

const router = express.Router()

router.get('/me', protect, (req, res) => {
  res.json(req.user)
})
const {register, login} = require('../controllers/authController')

router.post('/register', register)
router.post('/login', login)

module.exports = router
