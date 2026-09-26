import { Router, Response } from 'express';
import { getDB, getCompanyStock, getLocationStock, getIncomingStock, getOutgoingStock } from '../db.ts';
import { requireAuth } from '../auth.ts';

const router = Router();

router.get('/stats', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { warehouse_id, category_id } = req.query;

  let products = db.products.filter(p => p.active);
  if (category_id && typeof category_id === 'string' && category_id !== 'all') {
    products = products.filter(p => p.category_id === category_id);
  }

  // Calculate product stocks (filtered by warehouse if specified)
  let totalProductsInStock = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalValuation = 0;

  const lowStockItems: any[] = [];

  products.forEach(p => {
    let stock = 0;
    if (warehouse_id && typeof warehouse_id === 'string' && warehouse_id !== 'all') {
      const whLocations = db.locations.filter(l => l.warehouse_id === warehouse_id && l.type === 'internal');
      stock = whLocations.reduce((sum, loc) => sum + getLocationStock(p.id, loc.id), 0);
    } else {
      stock = getCompanyStock(p.id);
    }

    if (stock > 0) totalProductsInStock++;
    if (stock === 0) outOfStockCount++;
    if (stock <= p.reorder_level) {
      lowStockCount++;
      const cat = db.categories.find(c => c.id === p.category_id);
      lowStockItems.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: cat?.name || 'General',
        on_hand: stock,
        reorder_level: p.reorder_level,
        reorder_quantity: p.reorder_quantity,
        cost_price: p.cost_price,
        shortage: p.reorder_level - stock
      });
    }
    totalValuation += stock * p.cost_price;
  });

  // Pending Operations
  const pendingReceipts = db.receipts.filter(r => {
    const matchWh = (!warehouse_id || warehouse_id === 'all' || r.destination_warehouse_id === warehouse_id);
    return matchWh && (r.status === 'READY' || r.status === 'DRAFT');
  }).length;

  const pendingDeliveries = db.deliveries.filter(d => {
    const matchWh = (!warehouse_id || warehouse_id === 'all' || d.source_warehouse_id === warehouse_id);
    return matchWh && (d.status === 'READY' || d.status === 'WAITING' || d.status === 'DRAFT');
  }).length;

  const scheduledTransfers = db.transfers.filter(t => {
    const matchWh = (!warehouse_id || warehouse_id === 'all' || t.source_warehouse_id === warehouse_id || t.destination_warehouse_id === warehouse_id);
    return matchWh && (t.status === 'READY' || t.status === 'DRAFT');
  }).length;

  // Stock by Category
  const stockByCategory = db.categories.map(cat => {
    const catProds = db.products.filter(p => p.category_id === cat.id && p.active);
    let catUnits = 0;
    let catValuation = 0;

    catProds.forEach(p => {
      const stock = getCompanyStock(p.id);
      catUnits += stock;
      catValuation += stock * p.cost_price;
    });

    return {
      category_id: cat.id,
      category_name: cat.name,
      product_count: catProds.length,
      total_units: catUnits,
      total_valuation: catValuation
    };
  }).filter(c => c.total_units > 0 || c.product_count > 0);

  // Warehouse Utilization
  const warehouseUtilization = db.warehouses.map(wh => {
    const whLocs = db.locations.filter(l => l.warehouse_id === wh.id && l.type === 'internal');
    let whUnits = 0;
    let whValuation = 0;

    db.products.forEach(p => {
      whLocs.forEach(l => {
        const qty = getLocationStock(p.id, l.id);
        whUnits += qty;
        whValuation += qty * p.cost_price;
      });
    });

    return {
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      warehouse_code: wh.code,
      location_count: whLocs.length,
      total_units: whUnits,
      total_valuation: whValuation
    };
  });

  // Recent Operations Feed
  const recentOps: any[] = [];
  db.receipts.forEach(r => {
    recentOps.push({
      id: r.id,
      doc_type: 'RECEIPT',
      reference: r.reference,
      partner: r.supplier_name,
      status: r.status,
      date: r.created_at,
      total_items: r.lines.reduce((s, l) => s + l.demanded_qty, 0)
    });
  });
  db.deliveries.forEach(d => {
    recentOps.push({
      id: d.id,
      doc_type: 'DELIVERY',
      reference: d.reference,
      partner: d.customer_name,
      status: d.status,
      date: d.created_at,
      total_items: d.lines.reduce((s, l) => s + l.demanded_qty, 0)
    });
  });
  db.transfers.forEach(t => {
    recentOps.push({
      id: t.id,
      doc_type: 'TRANSFER',
      reference: t.reference,
      partner: 'Internal Route',
      status: t.status,
      date: t.created_at,
      total_items: t.lines.reduce((s, l) => s + l.demanded_qty, 0)
    });
  });
  db.adjustments.forEach(a => {
    recentOps.push({
      id: a.id,
      doc_type: 'ADJUSTMENT',
      reference: a.reference,
      partner: a.reason,
      status: a.status,
      date: a.created_at,
      total_items: a.lines.reduce((s, l) => s + Math.abs(l.difference), 0)
    });
  });

  recentOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Movements over time breakdown (incoming vs outgoing)
  const incomingTotal = db.stock_ledger.filter(l => l.type === 'IN').reduce((sum, l) => sum + l.quantity, 0);
  const outgoingTotal = db.stock_ledger.filter(l => l.type === 'OUT').reduce((sum, l) => sum + l.quantity, 0);

  res.json({
    kpis: {
      total_products_in_stock: totalProductsInStock,
      low_stock_items: lowStockCount,
      out_of_stock_items: outOfStockCount,
      pending_receipts: pendingReceipts,
      pending_deliveries: pendingDeliveries,
      scheduled_transfers: scheduledTransfers,
      total_inventory_valuation: totalValuation,
      incoming_units_total: incomingTotal,
      outgoing_units_total: outgoingTotal
    },
    low_stock_list: lowStockItems.sort((a, b) => b.shortage - a.shortage).slice(0, 5),
    stock_by_category: stockByCategory,
    warehouse_utilization: warehouseUtilization,
    recent_operations: recentOps.slice(0, 7)
  });
});

export default router;
