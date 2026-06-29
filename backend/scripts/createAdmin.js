const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('../models/User')

const adminName = process.env.ADMIN_NAME || 'System Admin'
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campus-eats.local').toLowerCase().trim()
const adminPhone = process.env.ADMIN_PHONE || '0000000000'
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234'

async function createAdminAccount() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in backend/.env')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const existingAdmin = await User.findOne({ email: adminEmail })
  if (existingAdmin) {
    console.log(`Admin account already exists for ${adminEmail} (role: ${existingAdmin.role}).`)
    return
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(adminPassword, salt)

  const adminUser = await User.create({
    name: adminName,
    email: adminEmail,
    phone: adminPhone,
    password: hashedPassword,
    role: 'admin',
  })

  console.log('Admin account created successfully:')
  console.log(`- ID: ${adminUser._id}`)
  console.log(`- Email: ${adminUser.email}`)
  console.log(`- Role: ${adminUser.role}`)
  console.log('Use these credentials to log in as admin.')
}

createAdminAccount()
  .catch(error => {
    console.error('Failed to create admin account:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
