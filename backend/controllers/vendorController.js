const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const Item = require('../models/Item')
const Order = require('../models/Order')
const User = require('../models/User')
const { resolveShopForRequest } = require('../utils/shopAccess')
const { publishShopEvent } = require('../events/shopEventBus')

const LIVE_ORDER_STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY']
const PAYMENT_STATUSES = ['PAID', 'PENDING', 'FAILED', 'REFUNDED']
const PUBLIC_ROOT = path.join(__dirname, '..', 'public')

const formatDateForLabel = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const resolveDateWindow = (dateString) => {
  if (!dateString) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end, label: formatDateForLabel(start) }
  }

  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return null

  const start = new Date(year, month - 1, day)
  if (Number.isNaN(start.getTime())) return null

  if (
    start.getFullYear() !== year ||
    start.getMonth() !== month - 1 ||
    start.getDate() !== day
  ) {
    return null
  }

  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end, label: dateString }
}

exports.getVendorManagerOverview = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req)
    const dateWindow = resolveDateWindow(req.query.date)

    if (!dateWindow) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' })
    }

    const shopObjectId = new mongoose.Types.ObjectId(shop._id)
    const todayMatch = {
      shop: shop._id,
      createdAt: { $gte: dateWindow.start, $lt: dateWindow.end },
    }

    const [
      todayOrders,
      liveOrders,
      completedOrders,
      rejectedOrders,
      activeItems,
      revenueToday,
      paymentStatusSummary,
      recentOrders,
      chefs,
    ] = await Promise.all([
      Order.countDocuments(todayMatch),
      Order.countDocuments({
        shop: shop._id,
        status: { $in: LIVE_ORDER_STATUSES },
      }),
      Order.countDocuments({
        ...todayMatch,
        status: 'COMPLETED',
      }),
      Order.countDocuments({
        ...todayMatch,
        status: 'REJECTED',
      }),
      Item.countDocuments({
        shop: shop._id,
        isAvailable: true,
      }),
      Order.aggregate([
        {
          $match: {
            shop: shopObjectId,
            createdAt: { $gte: dateWindow.start, $lt: dateWindow.end },
            'payment.status': 'PAID',
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            shop: shopObjectId,
            createdAt: { $gte: dateWindow.start, $lt: dateWindow.end },
          },
        },
        {
          $group: {
            _id: '$payment.status',
            count: { $sum: 1 },
            amount: { $sum: '$totalAmount' },
          },
        },
      ]),
      Order.find(todayMatch)
        .select('orderNumber totalAmount status payment createdAt completedAt')
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(12),
      User.find({
        role: 'chef',
        assignedShop: shop._id,
      })
        .select('_id name email phone createdAt')
        .sort({ createdAt: -1 }),
    ])

    const paymentSummary = PAYMENT_STATUSES.reduce((acc, status) => {
      acc[status] = { count: 0, amount: 0 }
      return acc
    }, {})

    paymentStatusSummary.forEach((entry) => {
      if (!paymentSummary[entry._id]) return
      paymentSummary[entry._id] = {
        count: entry.count || 0,
        amount: entry.amount || 0,
      }
    })

    res.json({
      date: dateWindow.label,
      shop: {
        id: shop._id,
        name: shop.name,
        isOpen: shop.isOpen,
        thumbnailUrl: shop.thumbnailUrl || '',
        lastStatusChangedAt: shop.lastStatusChangedAt || shop.updatedAt,
      },
      stats: {
        todayOrders,
        liveOrders,
        completedOrders,
        rejectedOrders,
        activeItems,
        revenueToday: revenueToday[0]?.total || 0,
      },
      paymentSummary,
      recentOrders,
      chefs,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

const removeLocalPosterIfExists = (thumbnailUrl) => {
  if (!thumbnailUrl || typeof thumbnailUrl !== 'string' || !thumbnailUrl.startsWith('/uploads/')) {
    return
  }

  const relativePath = thumbnailUrl.replace(/^\//, '')
  const absolutePath = path.normalize(path.join(PUBLIC_ROOT, relativePath))
  const normalizedPublicRoot = path.normalize(PUBLIC_ROOT + path.sep)

  if (!absolutePath.startsWith(normalizedPublicRoot)) {
    return
  }

  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath)
    }
  } catch (_error) {
    // Ignore cleanup failures; poster update should still succeed.
  }
}

exports.updateShopPoster = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Poster image file is required' })
    }

    const shop = await resolveShopForRequest(req)
    const previousThumbnail = shop.thumbnailUrl || ''
    const nextThumbnail = `/uploads/shops/${req.file.filename}`

    shop.thumbnailUrl = nextThumbnail
    await shop.save()

    removeLocalPosterIfExists(previousThumbnail)

    publishShopEvent({
      shopId: shop._id,
      type: 'shop.thumbnail.changed',
      payload: {
        thumbnailUrl: shop.thumbnailUrl,
      },
    })

    res.json({
      message: 'Shop poster updated successfully',
      shop: {
        id: shop._id,
        name: shop.name,
        thumbnailUrl: shop.thumbnailUrl,
      },
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.createChefAccount = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    const trimmedName = name?.trim()
    const normalizedEmail = email?.trim().toLowerCase()
    const trimmedPhone = phone?.trim()

    if (!trimmedName || !normalizedEmail || !trimmedPhone || !password) {
      return res.status(400).json({ message: 'Name, email, phone and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' })
    }

    const shop = await resolveShopForRequest(req)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const chef = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
      role: 'chef',
      assignedShop: shop._id,
      createdByManager: req.user._id,
    })

    publishShopEvent({
      shopId: shop._id,
      type: 'shop.chef.created',
      payload: {
        chefId: chef._id,
        chefName: chef.name,
      },
    })

    res.status(201).json({
      message: 'Chef account created successfully',
      chef: {
        id: chef._id,
        name: chef.name,
        email: chef.email,
        phone: chef.phone,
        role: chef.role,
        assignedShop: shop._id,
      },
    })
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(409).json({ message: 'User with this email already exists' })
    }

    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.getChefAccounts = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req)

    const chefs = await User.find({
      role: 'chef',
      assignedShop: shop._id,
    })
      .select('_id name email phone createdAt')
      .sort({ createdAt: -1 })

    res.json({
      shop: {
        id: shop._id,
        name: shop.name,
      },
      chefs,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.setVendorShopStatus = async (req, res) => {
  try {
    const { isOpen } = req.body

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ message: 'isOpen (boolean) is required' })
    }

    const shop = await resolveShopForRequest(req, req.body.shopId)

    shop.isOpen = isOpen
    shop.lastStatusChangedAt = new Date()
    shop.lastStatusChangedBy = req.user?._id || null
    await shop.save()

    publishShopEvent({
      shopId: shop._id,
      type: 'shop.status.changed',
      payload: {
        isOpen: shop.isOpen,
        changedBy: req.user?._id || null,
      },
    })

    res.json({
      message: isOpen ? 'Shop opened successfully' : 'Shop closed successfully',
      shop: {
        id: shop._id,
        name: shop.name,
        isOpen: shop.isOpen,
        lastStatusChangedAt: shop.lastStatusChangedAt,
      },
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
