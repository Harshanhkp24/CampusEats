const mongoose = require('mongoose')
const Shop = require('../models/Shop')

const createHttpError = (status, message) => {
  const error = new Error(message)
  error.status = status
  return error
}

const resolveRequestedShopId = (req, explicitShopId) => {
  if (explicitShopId) return explicitShopId.toString()
  if (req.params?.shopId) return req.params.shopId
  if (req.body?.shopId) return req.body.shopId
  if (req.body?.shop) return req.body.shop
  if (req.query?.shopId) return req.query.shopId
  return null
}

const resolveShopForRequest = async (req, explicitShopId) => {
  const requestedShopId = resolveRequestedShopId(req, explicitShopId)

  if (requestedShopId) {
    if (!mongoose.Types.ObjectId.isValid(requestedShopId)) {
      throw createHttpError(400, 'Invalid shop id')
    }

    const shop = await Shop.findById(requestedShopId)
    if (!shop) {
      throw createHttpError(404, 'Shop not found')
    }

    if (req.user?.role === 'vendor' && shop.createdBy?.toString() !== req.user._id.toString()) {
      throw createHttpError(403, 'Not allowed to access this shop')
    }

    if (req.user?.role === 'chef' && shop._id.toString() !== req.user.assignedShop?.toString()) {
      throw createHttpError(403, 'Chef is not allowed to access this shop')
    }

    return shop
  }

  if (!req.user) {
    throw createHttpError(401, 'Authentication required')
  }

  if (req.user.role === 'chef') {
    if (!req.user.assignedShop) {
      throw createHttpError(404, 'No shop assigned to this chef account')
    }

    const chefShop = await Shop.findById(req.user.assignedShop)
    if (!chefShop) {
      throw createHttpError(404, 'Assigned shop was not found')
    }

    return chefShop
  }

  const managedShop = await Shop.findOne({ createdBy: req.user._id }).sort({ createdAt: 1 })
  if (!managedShop) {
    throw createHttpError(404, 'No shop assigned to this account')
  }

  return managedShop
}

module.exports = {
  createHttpError,
  resolveShopForRequest,
}
