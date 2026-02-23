const mongoose = require('mongoose')

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    lastStatusChangedAt: {
      type: Date,
      default: Date.now,
    },
    lastStatusChangedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
)

shopSchema.index(
  { createdBy: 1 },
  {
    unique: true,
    partialFilterExpression: { createdBy: { $type: 'objectId' } },
    name: 'unique_vendor_shop_per_owner',
  },
)

module.exports = mongoose.model('Shop', shopSchema)
