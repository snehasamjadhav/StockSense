import { Router, Response } from 'express';
import { getDB, getLocationStock, getCompanyStock, getIncomingStock, getOutgoingStock } from '../db.ts';
import { requireAuth } from '../auth.ts';

const router = Router();

// =======================
// STOCK OVERVIEW
// =======================

router.get('/overview', requireAuth, (_req, res: Response) => {
  const db = getDB();

  const overview = db.products.map(p => {
    const onHand = getCompanyStock(p.id);
    const incoming = getIncomingStock(p.id);
    const outgoing = getOutgoingStock(p.id);
    const forecast = onHand + incoming - outgoing;
    const cat = db.categories.find(c => c.id === p.category_id);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category_name: cat ? cat.name : 'General',
      unit_of_measure: p.unit_of_measure,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      reorder_level: p.reorder_level,
      reorder_quantity: p.reorder_quantity,
      on_hand: onHand,
      incoming,
      outgoing,
      forecast,
      valuation: onHand * p.cost_price,
      status: onHand === 0 ? 'OUT_OF_STOCK' : (onHand <= p.reorder_level ? 'LOW_STOCK' : 'NORMAL')
    };
  });

  res.json(overview);
});

// =======================
// STOCK BY LOCATION
// =======================

router.get('/by-location', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { warehouse_id } = req.query;

  let warehouses = db.warehouses;
  if (warehouse_id && typeof warehouse_id === 'string' && warehouse_id !== 'all') {
    warehouses = warehouses.filter(w => w.id === warehouse_id);
  }

  const result = warehouses.map(wh => {
    const locations = db.locations.filter(l => l.warehouse_id === wh.id);

    const locationsWithStock = locations.map(loc => {
      // Find all products that have ever had stock here or currently have stock
      const productStocks = db.products.map(prod => {
        const qty = getLocationStock(prod.id, loc.id);
        return {
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit_of_measure: prod.unit_of_measure,
          cost_price: prod.cost_price,
          quantity: qty,
          valuation: qty * prod.cost_price
        };
      }).filter(ps => ps.quantity > 0);

      const totalItems = productStocks.reduce((sum, p) => sum + p.quantity, 0);
      const totalValuation = productStocks.reduce((sum, p) => sum + p.valuation, 0);

      return {
        ...loc,
        total_items: totalItems,
        total_valuation: totalValuation,
        products: productStocks
      };
    });

    const whTotalItems = locationsWithStock.reduce((sum, l) => sum + l.total_items, 0);
    const whTotalValuation = locationsWithStock.reduce((sum, l) => sum + l.total_valuation, 0);

    return {
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      warehouse_code: wh.code,
      warehouse_address: wh.address,
      total_items: whTotalItems,
      total_valuation: whTotalValuation,
      locations: locationsWithStock
    };
  });

  res.json(result);
});

// =======================
// STOCK LEDGER
// =======================

router.get('/ledger', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { product_id, warehouse_id, location_id, type } = req.query;

  let list = db.stock_ledger.map(entry => {
    const prod = db.products.find(p => p.id === entry.product_id);
    const wh = db.warehouses.find(w => w.id === entry.warehouse_id);
    const loc = db.locations.find(l => l.id === entry.location_id);
    const move = db.stock_movements.find(m => m.id === entry.movement_id);

    return {
      ...entry,
      product_name: prod?.name || 'Unknown',
      product_sku: prod?.sku || 'Unknown',
      unit_of_measure: prod?.unit_of_measure || 'Units',
      warehouse_name: wh?.name || 'Unknown Warehouse',
      location_name: loc?.name || 'Unknown Location',
      user_name: move?.user_name || 'System Auditor',
      total_value: entry.quantity * (entry.unit_cost || prod?.cost_price || 0)
    };
  });

  if (product_id && typeof product_id === 'string' && product_id !== 'all') {
    list = list.filter(e => e.product_id === product_id);
  }

  if (warehouse_id && typeof warehouse_id === 'string' && warehouse_id !== 'all') {
    list = list.filter(e => e.warehouse_id === warehouse_id);
  }

  if (location_id && typeof location_id === 'string' && location_id !== 'all') {
    list = list.filter(e => e.location_id === location_id);
  }

  if (type && typeof type === 'string' && (type === 'IN' || type === 'OUT')) {
    list = list.filter(e => e.type === type);
  }

  res.json(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

export default router;
