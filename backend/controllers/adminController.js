const mongoose = require('mongoose')
const Item = require('../models/Item')
const Order = require('../models/Order')
const Shop = require('../models/Shop')
const User = require('../models/User')
const { resolveShopForRequest } = require('../utils/shopAccess')

exports.getVendorStats = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req)
    const shopId = shop._id

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayOrders, pendingOrders, activeItems, revenue] = await Promise.all([
      Order.countDocuments({
        shop: shopId,
        createdAt: { $gte: today },
      }),
      Order.countDocuments({
        shop: shopId,
        status: { $in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] },
      }),
      Item.countDocuments({
        shop: shopId,
        isAvailable: true,
      }),
      Order.aggregate([
        { $match: { shop: new mongoose.Types.ObjectId(shopId) } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ])

    res.json({
      shop: {
        id: shop._id,
        name: shop.name,
        isOpen: shop.isOpen,
      },
      todayOrders,
      revenue: revenue[0]?.total || 0,
      pendingOrders,
      activeItems,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.getPlatformStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalStudents, totalVendors, totalShops, openShops, todayOrders, revenueToday] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'vendor' }),
        Shop.countDocuments(),
        Shop.countDocuments({ isOpen: true }),
        Order.countDocuments({ createdAt: { $gte: today } }),
        Order.aggregate([
          { $match: { createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ])

    const vendorsWithoutShop = await User.countDocuments({
      role: 'vendor',
      _id: {
        $nin: await Shop.distinct('createdBy'),
      },
    })

    res.json({
      totalStudents,
      totalVendors,
      totalShops,
      openShops,
      todayOrders,
      revenueToday: revenueToday[0]?.total || 0,
      vendorsWithoutShop,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getVendors = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' })
      .select('_id name email phone createdAt')
      .sort({ createdAt: -1 })
      .lean()

    const shops = await Shop.find({
      createdBy: { $in: vendors.map(vendor => vendor._id) },
    })
      .select('_id name createdBy isOpen')
      .lean()

    const shopByOwnerId = new Map(
      shops.map(shop => [shop.createdBy.toString(), shop]),
    )

    const vendorList = vendors.map(vendor => {
      const assignedShop = shopByOwnerId.get(vendor._id.toString()) || null

      return {
        ...vendor,
        shop: assignedShop
          ? {
              id: assignedShop._id,
              name: assignedShop.name,
              isOpen: assignedShop.isOpen,
            }
          : null,
      }
    })

    res.json(vendorList)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
