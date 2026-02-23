const { spawnSync } = require('child_process')

const BASE_URL = process.env.LOADTEST_BASE_URL || 'http://localhost:5000'
const EMAIL = process.env.LOADTEST_LOGIN_EMAIL || ''
const PASSWORD = process.env.LOADTEST_LOGIN_PASSWORD || ''
const ROLE = process.env.LOADTEST_LOGIN_ROLE || 'student'
const TOKEN = process.env.LOADTEST_VENDOR_TOKEN || ''

const runAutocannon = (label, args) => {
  console.log(`\n=== ${label} ===`)
  const result = spawnSync('npx', ['autocannon', ...args], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error(`${label} failed`)
  }
}

const main = () => {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'LOADTEST_LOGIN_EMAIL and LOADTEST_LOGIN_PASSWORD are required for autocannon login test',
    )
  }

  const loginBody = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    role: ROLE,
  })

  runAutocannon('Login Endpoint', [
    '-c',
    '50',
    '-d',
    '30',
    '-m',
    'POST',
    '-H',
    'content-type=application/json',
    '-b',
    loginBody,
    `${BASE_URL}/api/auth/login`,
  ])

  if (TOKEN) {
    runAutocannon('Order Board Endpoint', [
      '-c',
      '50',
      '-d',
      '30',
      '-m',
      'GET',
      '-H',
      `authorization=Bearer ${TOKEN}`,
      `${BASE_URL}/api/orders/shop/board`,
    ])
  } else {
    console.log('\nSkipping order board test (LOADTEST_VENDOR_TOKEN not provided).')
  }
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
