const mongoose = require('mongoose')
const Shop = require('../models/Shop')
const User = require('../models/User')
const { publishShopEvent } = require('../events/shopEventBus')

const assertValidVendorOwner = async (ownerId, currentShopId = null) => {
  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    return { status: 400, message: 'Invalid vendor id' }
  }

  const owner = await User.findById(ownerId)
  if (!owner || owner.role !== 'vendor') {
    return { status: 400, message: 'Owner must be a valid vendor account' }
  }

  const existingShop = await Shop.findOne({
    createdBy: ownerId,
    ...(currentShopId ? { _id: { $ne: currentShopId } } : {}),
  })

  if (existingShop) {
    return { status: 400, message: 'This vendor already has a shop assigned' }
  }

  return null
}

exports.createShop = async (req, res) => {
  try {
    const { name, ownerId } = req.body

    if (!name || !ownerId) {
      return res.status(400).json({ message: 'Shop name and vendor owner are required' })
    }

    const normalizedName = name.trim()
    if (!normalizedName) {
      return res.status(400).json({ message: 'Shop name is required' })
    }

    const shopExists = await Shop.findOne({ name: normalizedName })
    if (shopExists) {
      return res.status(400).json({ message: 'Shop already exists' })
    }

    const ownerError = await assertValidVendorOwner(ownerId)
    if (ownerError) {
      return res.status(ownerError.status).json({ message: ownerError.message })
    }

    const shop = await Shop.create({
      name: normalizedName,
      createdBy: ownerId,
    })

    const populatedShop = await shop.populate('createdBy', 'name email')
    res.status(201).json(populatedShop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


exports.assignVendorToShop = async (req, res) => {
  try {
    const { shopId } = req.params
    const { ownerId } = req.body

    if (!ownerId) {
      return res.status(400).json({ message: 'Vendor owner is required' })
    }

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ message: 'Invalid shop id' })
    }

    const shop = await Shop.findById(shopId)
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' })
    }

    const ownerError = await assertValidVendorOwner(ownerId, shop._id)
    if (ownerError) {
      return res.status(ownerError.status).json({ message: ownerError.message })
    }

    shop.createdBy = ownerId
    await shop.save()

    const populatedShop = await shop.populate('createdBy', 'name email')

    res.json({
      message: 'Vendor assigned to shop successfully',
      shop: populatedShop,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    res.json(shops)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId).populate('createdBy', 'name email')
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' })
    }
    res.json(shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.closeShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' })
    }

    shop.isOpen = false
    shop.lastStatusChangedAt = new Date()
    shop.lastStatusChangedBy = req.user?._id || null
    await shop.save()

    publishShopEvent({
      shopId: shop._id,
      type: 'shop.status.changed',
      payload: {
        isOpen: false,
        changedBy: req.user?._id || null,
      },
    })

    res.json({
      message: 'Shop closed successfully',
      shop,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.openShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' })
    }

    shop.isOpen = true
    shop.lastStatusChangedAt = new Date()
    shop.lastStatusChangedBy = req.user?._id || null
    await shop.save()

    publishShopEvent({
      shopId: shop._id,
      type: 'shop.status.changed',
      payload: {
        isOpen: true,
        changedBy: req.user?._id || null,
      },
    })

    res.json({
      message: 'Shop opened successfully',
      shop,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
