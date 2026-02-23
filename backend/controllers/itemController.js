const Item = require('../models/Item')
const { resolveShopForRequest } = require('../utils/shopAccess')
const { publishShopEvent } = require('../events/shopEventBus')

// ADMIN / VENDOR: Add item
exports.addItem = async (req, res) => {
  try {
    const { name, price } = req.body

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ message: 'Name and price are required' })
    }

    const shop = await resolveShopForRequest(req)

    const item = await Item.create({
      name,
      price,
      shop: shop._id,
      createdBy: req.user._id,
    })

    publishShopEvent({
      shopId: shop._id,
      type: 'shop.menu.changed',
      payload: {
        itemId: item._id,
        name: item.name,
      },
    })

    res.status(201).json(item)
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message })
  }
}

// STUDENT: Get items by shop
exports.getItemsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    const items = await Item.find({
      shop: shopId,
      isAvailable: true,
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

