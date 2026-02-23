const mongoose = require('mongoose')
const Order = require('../models/Order')
const Item = require('../models/Item')
const Shop = require('../models/Shop')
const { resolveShopForRequest } = require('../utils/shopAccess')
const { publishShopEvent } = require('../events/shopEventBus')

const LIVE_ORDER_STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY']
const PREVIOUS_ORDER_STATUSES = ['COMPLETED', 'REJECTED']

const transitionMap = {
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
}

const statusTransitionPermissionByRole = {
  vendor: {
    READY: ['COMPLETED'],
  },
  chef: {
    ACCEPTED: ['PREPARING'],
    PREPARING: ['READY'],
  },
  admin: transitionMap,
}

const validPaymentMethods = ['UPI', 'CARD', 'CASH', 'WALLET']
const ORDER_NUMBER_RETRY_LIMIT = 3

const formatDateForLabel = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toBusinessDateWindow = (dateString) => {
  if (!dateString) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end, dateLabel: formatDateForLabel(start) }
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

  return { start, end, dateLabel: dateString }
}

const pushStatusHistory = (order, status, req, note) => {
  order.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: req.user?._id,
    changedByRole: req.user?.role || 'system',
    note,
  })
}

const buildStatusHistoryEntry = (status, req, note) => ({
  status,
  changedAt: new Date(),
  changedBy: req.user?._id,
  changedByRole: req.user?.role || 'system',
  note,
})

const generateOrderNumber = () => {
  const randomPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0')
  return `CE-${Date.now()}-${randomPart}`
}

exports.createOrder = async (req, res) => {
  try {
    const { shopId, items, paymentMethod, transactionId } = req.body

    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required' })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items selected' })
    }

    const shop = await Shop.findById(shopId)
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' })
    }

    if (!shop.isOpen) {
      return res.status(400).json({
        message: 'Shop is currently closed. Orders are not allowed.',
      })
    }

    const normalizedItems = items.map((selected) => ({
      item: selected.item,
      quantity: Number(selected.quantity) || 1,
    }))

    if (normalizedItems.some((selected) => !selected.item || selected.quantity <= 0)) {
      return res.status(400).json({ message: 'Invalid order item payload' })
    }

    if (normalizedItems.some((selected) => !mongoose.Types.ObjectId.isValid(selected.item))) {
      return res.status(400).json({ message: 'Invalid item id in order payload' })
    }

    const quantityByItemId = new Map()
    normalizedItems.forEach((selected) => {
      const itemId = selected.item.toString()
      quantityByItemId.set(itemId, (quantityByItemId.get(itemId) || 0) + selected.quantity)
    })

    const itemIds = [...quantityByItemId.keys()]
    const catalogItems = await Item.find({
      _id: { $in: itemIds },
      shop: shopId,
      isAvailable: true,
    }).select('_id name price shop')

    if (catalogItems.length !== itemIds.length) {
      return res.status(400).json({ message: 'One or more items are unavailable' })
    }

    const catalogMap = new Map(
      catalogItems.map((item) => [item._id.toString(), item]),
    )

    let subtotal = 0
    const orderItems = itemIds.map((itemId) => {
      const catalogItem = catalogMap.get(itemId)
      if (!catalogItem) {
        throw new Error('One or more items are unavailable')
      }

      const quantity = quantityByItemId.get(itemId) || 1
      const lineTotal = catalogItem.price * quantity
      subtotal += lineTotal

      return {
        item: catalogItem._id,
        quantity,
        itemName: catalogItem.name,
        unitPrice: catalogItem.price,
        lineTotal,
      }
    })

    const convenienceFeeAmount = subtotal > 0 ? 5 : 0
    const totalAmount = subtotal + convenienceFeeAmount

    const resolvedPaymentMethod = validPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : 'UPI'

    const resolvedTransactionId = String(
      transactionId || `SIM-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    )

    const orderPayload = {
      user: req.user._id,
      shop: shopId,
      items: orderItems,
      subtotalAmount: subtotal,
      convenienceFeeAmount,
      totalAmount,
      status: 'PLACED',
      statusHistory: [
        {
          status: 'PLACED',
          changedAt: new Date(),
          changedBy: req.user._id,
          changedByRole: req.user.role || 'student',
          note: 'Order placed and payment confirmed',
        },
      ],
      payment: {
        method: resolvedPaymentMethod,
        status: 'PAID',
        transactionId: resolvedTransactionId,
        paidAt: new Date(),
      },
    }

    let order = null
    let attempts = 0

    while (!order && attempts < ORDER_NUMBER_RETRY_LIMIT) {
      attempts += 1

      try {
        order = await Order.create({
          ...orderPayload,
          orderNumber: generateOrderNumber(),
        })
      } catch (createError) {
        if (createError?.code === 11000 && createError?.keyPattern?.orderNumber) {
          continue
        }
        throw createError
      }
    }

    if (!order) {
      return res.status(503).json({
        message: 'Unable to generate order number. Please try again.',
      })
    }

    publishShopEvent({
      shopId,
      type: 'order.created',
      payload: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      },
    })

    const populatedOrder = await Order.findById(order._id)
      .populate('shop', 'name')
      .populate('items.item', 'name price')

    res.status(201).json(populatedOrder)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getOrdersByShop = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req)

    const orders = await Order.find({ shop: shop._id })
      .populate('user', 'name email')
      .populate('items.item', 'name price')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.getVendorOrderBoard = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req)
    const dayWindow = toBusinessDateWindow(req.query.date)

    if (!dayWindow) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' })
    }

    const [liveOrders, previousOrders] = await Promise.all([
      Order.find({
        shop: shop._id,
        status: { $in: LIVE_ORDER_STATUSES },
      })
        .populate('user', 'name email')
        .populate('items.item', 'name price')
        .sort({ createdAt: 1 }),
      Order.find({
        shop: shop._id,
        status: { $in: PREVIOUS_ORDER_STATUSES },
        createdAt: { $gte: dayWindow.start, $lt: dayWindow.end },
      })
        .populate('user', 'name email')
        .populate('items.item', 'name price')
        .sort({ updatedAt: -1 }),
    ])

    const completedCount = previousOrders.filter((order) => order.status === 'COMPLETED').length
    const rejectedCount = previousOrders.filter((order) => order.status === 'REJECTED').length

    res.json({
      shop: {
        id: shop._id,
        name: shop.name,
        isOpen: shop.isOpen,
      },
      date: dayWindow.dateLabel,
      summary: {
        liveCount: liveOrders.length,
        completedCount,
        rejectedCount,
      },
      liveOrders,
      previousOrders,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.acceptOrder = async (req, res) => {
  try {
    if (req.user?.role !== 'vendor') {
      return res.status(403).json({ message: 'Only manager can accept orders' })
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({ message: 'Invalid order id' })
    }

    const shop = await resolveShopForRequest(req)

    if (!shop.isOpen) {
      return res.status(400).json({
        message: 'Shop is closed. Open the shop before accepting orders.',
      })
    }

    const acceptedOrder = await Order.findOneAndUpdate(
      {
        _id: req.params.orderId,
        shop: shop._id,
        status: 'PLACED',
      },
      {
        $set: { status: 'ACCEPTED' },
        $push: {
          statusHistory: buildStatusHistoryEntry('ACCEPTED', req, 'Order accepted by vendor'),
        },
      },
      { new: true },
    )

    if (acceptedOrder) {
      publishShopEvent({
        shopId: shop._id,
        type: 'order.status.changed',
        payload: {
          orderId: acceptedOrder._id,
          orderNumber: acceptedOrder.orderNumber,
          previousStatus: 'PLACED',
          status: acceptedOrder.status,
        },
      })
      return res.json(acceptedOrder)
    }

    const existingOrder = await Order.findOne({
      _id: req.params.orderId,
      shop: shop._id,
    }).select('status')

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' })
    }

    return res.status(409).json({
      message: `Order is already in ${existingOrder.status} state. Refresh queue.`,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body

    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({ message: 'Invalid order id' })
    }

    const shop = await resolveShopForRequest(req)

    const currentOrder = await Order.findOne({
      _id: req.params.orderId,
      shop: shop._id,
    }).select('status')

    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const allowedTransitions = statusTransitionPermissionByRole[req.user?.role]
    if (!allowedTransitions) {
      return res.status(403).json({ message: 'Not allowed to update order status' })
    }

    if (!allowedTransitions[currentOrder.status]?.includes(status)) {
      return res.status(403).json({
        message: 'Status transition not allowed for this role',
      })
    }

    const updateOps = {
      $set: {
        status,
      },
      $push: {
        statusHistory: buildStatusHistoryEntry(
          status,
          req,
          status === 'COMPLETED' ? 'Order picked up by customer' : `Order moved to ${status}`,
        ),
      },
    }

    if (status === 'COMPLETED') {
      updateOps.$set.completedAt = new Date()
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: req.params.orderId,
        shop: shop._id,
        status: currentOrder.status,
      },
      updateOps,
      { new: true },
    )

    if (!updatedOrder) {
      const latestOrder = await Order.findOne({
        _id: req.params.orderId,
        shop: shop._id,
      }).select('status')

      return res.status(409).json({
        message: `Order status changed to ${
          latestOrder?.status || 'another state'
        } by another user. Refresh queue.`,
      })
    }

    publishShopEvent({
      shopId: shop._id,
      type: 'order.status.changed',
      payload: {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        previousStatus: currentOrder.status,
        status: updatedOrder.status,
      },
    })

    res.json(updatedOrder)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('shop', 'name')
      .populate('items.item', 'name price')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getMyOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({ message: 'Invalid order id' })
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    })
      .populate('shop', 'name')
      .populate('items.item', 'name price')

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.rejectOrder = async (req, res) => {
  try {
    if (req.user?.role !== 'vendor') {
      return res.status(403).json({ message: 'Only manager can reject orders' })
    }

    const { orderId } = req.params

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' })
    }

    const shop = await resolveShopForRequest(req)

    if (!shop.isOpen) {
      return res.status(400).json({
        message: 'Shop is closed. Open the shop before rejecting orders.',
      })
    }

    const rejectedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        shop: shop._id,
        status: 'PLACED',
      },
      {
        $set: { status: 'REJECTED' },
        $push: {
          statusHistory: buildStatusHistoryEntry('REJECTED', req, 'Order rejected by vendor'),
        },
      },
      { new: true },
    )

    if (!rejectedOrder) {
      const existingOrder = await Order.findOne({
        _id: orderId,
        shop: shop._id,
      }).select('status')

      if (!existingOrder) {
        return res.status(404).json({ message: 'Order not found' })
      }

      return res.status(409).json({
        message: `Cannot reject order in ${existingOrder.status} state`,
      })
    }

    publishShopEvent({
      shopId: shop._id,
      type: 'order.status.changed',
      payload: {
        orderId: rejectedOrder._id,
        orderNumber: rejectedOrder.orderNumber,
        previousStatus: 'PLACED',
        status: rejectedOrder.status,
      },
    })

    res.json({
      message: 'Order rejected successfully',
      order: rejectedOrder,
    })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message })
  }
}

exports.getShopQueue = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req)

    const pendingOrders = await Order.countDocuments({
      shop: shop._id,
      status: { $in: LIVE_ORDER_STATUSES },
    })

    const avgPrepTime = 3
    const waitTime = pendingOrders * avgPrepTime

    res.json({
      shop: {
        id: shop._id,
        name: shop.name,
      },
      queue: pendingOrders,
      estimatedWait: waitTime,
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
