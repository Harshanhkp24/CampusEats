# Load Tests

## k6 (workflow load)

Required env vars:

- `LOADTEST_BASE_URL` (default: `http://localhost:5000`)
- `LOADTEST_STUDENT_EMAIL`
- `LOADTEST_STUDENT_PASSWORD`
- `LOADTEST_VENDOR_EMAIL`
- `LOADTEST_VENDOR_PASSWORD`
- `LOADTEST_SHOP_ID`
- `LOADTEST_ITEM_ID`

Run:

```bash
npm run loadtest:k6
```

## autocannon (endpoint stress)

Required env vars:

- `LOADTEST_BASE_URL` (default: `http://localhost:5000`)
- `LOADTEST_LOGIN_EMAIL`
- `LOADTEST_LOGIN_PASSWORD`
- `LOADTEST_LOGIN_ROLE` (default: `student`)

Optional:

- `LOADTEST_VENDOR_TOKEN` (if provided, order-board endpoint test will run)

Run:

```bash
npm run loadtest:autocannon
```
