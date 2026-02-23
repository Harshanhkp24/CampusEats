const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

const shouldAutoIndex = process.env.MONGOOSE_AUTO_INDEX === 'true'
mongoose.set('autoIndex', shouldAutoIndex)

const authRoutes = require('./routes/authRoutes')


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err))

app.get('/', (req, res) => {
  res.send('Capus Eats API running')
})

const PORT = process.env.PORT || 5000

app.use('/api/auth', authRoutes)

const adminRoutes = require('./routes/adminRoutes')
const vendorRoutes = require('./routes/vendorRoutes')

app.use('/api/admin', adminRoutes)
app.use('/api/vendor', vendorRoutes)

const shopRoutes = require('./routes/shopRoutes')
app.use('/api/shops', shopRoutes)

const itemRoutes = require('./routes/itemRoutes')

app.use('/api/items', itemRoutes)


const orderRoutes = require('./routes/orderRoutes')
app.use('/api/orders', orderRoutes)


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
