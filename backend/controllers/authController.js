const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Shop = require('../models/Shop')

const REGISTRABLE_ROLES = ['student', 'vendor']

const normalizeRole = role => {
  if (!role) return null
  return role.toString().trim().toLowerCase()
}

const validateRegistrationPayload = payload => {
  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  const phone = payload.phone?.trim()
  const password = payload.password
  const role = normalizeRole(payload.role) || 'student'

  if (!name || !email || !phone || !password) {
    return { message: 'Name, email, phone and password are required' }
  }

  if (password.length < 6) {
    return { message: 'Password must be at least 6 characters' }
  }

  if (!REGISTRABLE_ROLES.includes(role)) {
    return { message: 'Only student and vendor registration is allowed' }
  }

  return {
    value: { name, email, phone, password, role },
  }
}

exports.register = async (req, res) => {
  try {
    const validation = validateRegistrationPayload(req.body)
    if (validation.message) {
      return res.status(400).json({ message: validation.message })
    }

    const { name, email, phone, password, role } = validation.value

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    })

    res.status(201).json({
      message: `${role[0].toUpperCase()}${role.slice(1)} registered successfully`,
      userId: user._id,
      role: user.role,
    })
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({ message: 'User already exists' })
    }

    res.status(500).json({ message: 'Server error' })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    const requestedRole = normalizeRole(req.body.role)

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    if (requestedRole && requestedRole !== user.role) {
      return res.status(403).json({
        message: `This account is registered as ${user.role}, not ${requestedRole}`,
      })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    let shop = null
    if (user.role === 'vendor') {
      const managedShop = await Shop.findOne({ createdBy: user._id })
        .sort({ createdAt: 1 })
        .select('_id name isOpen')

      if (managedShop) {
        shop = managedShop
      }
    }

    if (user.role === 'chef' && user.assignedShop) {
      const assignedShop = await Shop.findById(user.assignedShop).select('_id name isOpen')
      if (assignedShop) {
        shop = assignedShop
      }
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        shopId: shop?._id || null,
        shopName: shop?.name || null,
        shopOpen: shop?.isOpen || false,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
