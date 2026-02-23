require('dotenv').config()
const mongoose = require('mongoose')
const Shop = require('../models/Shop')

const INDEX_NAME = 'unique_vendor_shop_per_owner'

const formatDuplicateRow = (row) => {
  const shopPreview = (row.shops || [])
    .map((shop) => `${shop._id}:${shop.name}`)
    .join(', ')
  return `owner=${row._id} count=${row.count} shops=[${shopPreview}]`
}

const runMigration = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const duplicates = await Shop.aggregate([
    { $match: { createdBy: { $type: 'objectId' } } },
    {
      $group: {
        _id: '$createdBy',
        count: { $sum: 1 },
        shops: {
          $push: {
            _id: '$_id',
            name: '$name',
          },
        },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ])

  if (duplicates.length > 0) {
    console.error('Cannot create unique vendor-shop index. Duplicate mappings found:')
    duplicates.forEach((row) => console.error(` - ${formatDuplicateRow(row)}`))
    process.exitCode = 1
    return
  }

  await Shop.collection.createIndex(
    { createdBy: 1 },
    {
      name: INDEX_NAME,
      unique: true,
      partialFilterExpression: { createdBy: { $type: 'objectId' } },
      background: true,
    },
  )

  console.log(`Index ensured: ${INDEX_NAME}`)
}

runMigration()
  .catch((err) => {
    console.error('Migration failed:', err.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
