# Production Notes

## 1) Run migration-safe unique index

```bash
npm run migrate:vendor-shop-index
```

This enforces one vendor -> one shop at DB level.

## 2) Start in cluster mode with PM2

Install PM2 globally once:

```bash
npm i -g pm2
```

Start:

```bash
npm run start:cluster
```

## 3) Auto index behavior

By default, `MONGOOSE_AUTO_INDEX=false` is expected in production.
Use `MONGOOSE_AUTO_INDEX=true` only for local development.

## 4) Real-time order stream (SSE)

Endpoint:

`GET /api/orders/stream?token=<jwt>`

The stream is scoped to the manager/chef assigned shop and emits:

- `order.created`
- `order.status.changed`
- `shop.status.changed`
- `shop.menu.changed`
- `shop.chef.created`
