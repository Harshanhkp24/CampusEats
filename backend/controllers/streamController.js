const { resolveShopForRequest } = require('../utils/shopAccess')
const { subscribeShopEvents } = require('../events/shopEventBus')

const HEARTBEAT_MS = 20000

const writeSseEvent = (res, eventName, payload) => {
  res.write(`event: ${eventName}\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

exports.streamShopEvents = async (req, res) => {
  try {
    const shop = await resolveShopForRequest(req, req.query?.shopId)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    writeSseEvent(res, 'ready', {
      shopId: shop._id.toString(),
      shopName: shop.name,
      at: new Date().toISOString(),
    })

    const unsubscribe = subscribeShopEvents((event) => {
      if (event.shopId !== shop._id.toString()) return
      writeSseEvent(res, 'shop-event', event)
    })

    const heartbeatTimer = setInterval(() => {
      writeSseEvent(res, 'heartbeat', { at: new Date().toISOString() })
    }, HEARTBEAT_MS)

    req.on('close', () => {
      clearInterval(heartbeatTimer)
      unsubscribe()
      res.end()
    })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message })
  }
}
