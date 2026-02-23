const { EventEmitter } = require('events')

const SHOP_EVENT_NAME = 'shop:event'
const MAX_LISTENERS = 2000

const shopEventBus = new EventEmitter()
shopEventBus.setMaxListeners(MAX_LISTENERS)

const publishShopEvent = ({ shopId, type, payload = {} }) => {
  if (!shopId || !type) return

  const event = {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    shopId: shopId.toString(),
    type,
    payload,
    at: new Date().toISOString(),
  }

  shopEventBus.emit(SHOP_EVENT_NAME, event)
}

const subscribeShopEvents = (handler) => {
  shopEventBus.on(SHOP_EVENT_NAME, handler)

  return () => {
    shopEventBus.off(SHOP_EVENT_NAME, handler)
  }
}

module.exports = {
  publishShopEvent,
  subscribeShopEvents,
}
