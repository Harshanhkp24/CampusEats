const fs = require('fs')
const path = require('path')
const multer = require('multer')

const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads', 'shops')

if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_ROOT)
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase()
    const safeExtension = extension || '.jpg'
    const uniqueName = `shop-${Date.now()}-${Math.floor(Math.random() * 1000000)}${safeExtension}`
    cb(null, uniqueName)
  },
})

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'))
    return
  }

  cb(null, true)
}

const uploadShopPoster = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

module.exports = uploadShopPoster
