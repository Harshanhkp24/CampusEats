import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.LOADTEST_BASE_URL || 'http://localhost:5000';
const STUDENT_EMAIL = __ENV.LOADTEST_STUDENT_EMAIL || '';
const STUDENT_PASSWORD = __ENV.LOADTEST_STUDENT_PASSWORD || '';
const STUDENT_ROLE = __ENV.LOADTEST_STUDENT_ROLE || 'student';
const VENDOR_EMAIL = __ENV.LOADTEST_VENDOR_EMAIL || '';
const VENDOR_PASSWORD = __ENV.LOADTEST_VENDOR_PASSWORD || '';
const VENDOR_ROLE = __ENV.LOADTEST_VENDOR_ROLE || 'vendor';
const SHOP_ID = __ENV.LOADTEST_SHOP_ID || '';
const ITEM_ID = __ENV.LOADTEST_ITEM_ID || '';

export const options = {
  scenarios: {
    login_burst: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 80,
      exec: 'loginBurst',
    },
    board_reads: {
      executor: 'constant-vus',
      vus: 15,
      duration: '1m',
      exec: 'boardReads',
      startTime: '5s',
    },
    create_orders: {
      executor: 'constant-vus',
      vus: 8,
      duration: '1m',
      exec: 'createOrders',
      startTime: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800'],
  },
};

const login = (email, password, role) => {
  if (!email || !password) return null;

  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password, role }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login' },
    },
  );

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => !!r.json('token'),
  });

  if (res.status !== 200) return null;
  return res.json('token');
};

export function setup() {
  const studentToken = login(STUDENT_EMAIL, STUDENT_PASSWORD, STUDENT_ROLE);
  const vendorToken = login(VENDOR_EMAIL, VENDOR_PASSWORD, VENDOR_ROLE);
  return { studentToken, vendorToken };
}

export function loginBurst() {
  login(STUDENT_EMAIL, STUDENT_PASSWORD, STUDENT_ROLE);
  sleep(0.1);
}

export function boardReads(data) {
  if (!data.vendorToken) return;

  const res = http.get(`${BASE_URL}/api/orders/shop/board`, {
    headers: { Authorization: `Bearer ${data.vendorToken}` },
    tags: { endpoint: 'board' },
  });

  check(res, {
    'board status is 200': (r) => r.status === 200,
  });

  sleep(0.2);
}

export function createOrders(data) {
  if (!data.studentToken || !SHOP_ID || !ITEM_ID) return;

  const payload = {
    shopId: SHOP_ID,
    paymentMethod: 'UPI',
    transactionId: `LOAD-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    items: [{ item: ITEM_ID, quantity: 1 }],
  };

  const res = http.post(`${BASE_URL}/api/orders`, JSON.stringify(payload), {
    headers: {
      Authorization: `Bearer ${data.studentToken}`,
      'Content-Type': 'application/json',
    },
    tags: { endpoint: 'create-order' },
  });

  check(res, {
    'create order accepted': (r) => r.status === 201 || r.status === 400 || r.status === 409,
  });

  sleep(0.3);
}
