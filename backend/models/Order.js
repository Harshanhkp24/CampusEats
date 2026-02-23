const mongoose = require('mongoose')

const orderStatusEnum = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED']

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
        },
        quantity: {
          type: Number,
          default: 1,
        },
        itemName: {
          type: String,
          trim: true,
        },
        unitPrice: {
          type: Number,
          default: 0,
        },
        lineTotal: {
          type: Number,
          default: 0,
        },
      },
    ],
    subtotalAmount: {
      type: Number,
      default: 0,
    },
    convenienceFeeAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: orderStatusEnum,
      default: 'PLACED',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: orderStatusEnum,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedByRole: {
          type: String,
          enum: ['student', 'vendor', 'chef', 'admin', 'system'],
          default: 'system',
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    payment: {
      method: {
        type: String,
        enum: ['UPI', 'CARD', 'CASH', 'WALLET'],
        default: 'UPI',
      },
      status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PAID',
      },
      transactionId: {
        type: String,
        trim: true,
      },
      paidAt: {
        type: Date,
        default: Date.now,
      },
    },
    orderNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
)

orderSchema.index({ shop: 1, status: 1, createdAt: -1 })
orderSchema.index({ shop: 1, createdAt: -1 })
orderSchema.index({ user: 1, createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
