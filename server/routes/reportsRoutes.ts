import { Router, Response } from 'express';
import { getDB, getCompanyStock } from '../db.ts';
import { requireAuth } from '../auth.ts';

const router = Router();

// Inventory Valuation & Health Report
router.get('/inventory', requireAuth, (_req, res: Response) => {
  const db = getDB();

  const report = db.products.map(p => {
    const stock = getCompanyStock(p.id);
    const cat = db.categories.find(c => c.id === p.category_id);
    const inventoryValuation = stock * p.cost_price;
    const potentialRevenue = stock * p.selling_price;
    const margin = p.selling_price > 0 ? ((p.selling_price - p.cost_price) / p.selling_price) * 100 : 0;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: cat?.name || 'General',
      unit_of_measure: p.unit_of_measure,
      on_hand_qty: stock,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      inventory_valuation: inventoryValuation,
      potential_revenue: potentialRevenue,
      margin_pct: Number(margin.toFixed(1)),
      reorder_level: p.reorder_level,
      reorder_status: stock === 0 ? 'CRITICAL_OUT' : (stock <= p.reorder_level ? 'LOW_STOCK' : 'HEALTHY')
    };
  });

  const totalValuation = report.reduce((sum, r) => sum + r.inventory_valuation, 0);
  const totalUnits = report.reduce((sum, r) => sum + r.on_hand_qty, 0);

  res.json({
    summary: {
      total_units: totalUnits,
      total_valuation: totalValuation,
      total_skus: report.length
    },
    items: report
  });
});

// Low Stock Report
router.get('/low-stock', requireAuth, (_req, res: Response) => {
  const db = getDB();

  const lowStock = db.products
    .filter(p => p.active)
    .map(p => {
      const stock = getCompanyStock(p.id);
      const cat = db.categories.find(c => c.id === p.category_id);
      const shortage = Math.max(0, p.reorder_level - stock);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: cat?.name || 'General',
        on_hand: stock,
        reorder_level: p.reorder_level,
        reorder_quantity: p.reorder_quantity,
        shortage,
        cost_price: p.cost_price,
        estimated_restock_cost: p.reorder_quantity * p.cost_price,
        urgency: stock === 0 ? 'HIGH' : 'MEDIUM'
      };
    })
    .filter(p => p.on_hand <= p.reorder_level)
    .sort((a, b) => b.shortage - a.shortage);

  res.json(lowStock);
});

// Movements Aggregated Flow Report
router.get('/movements', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { doc_type } = req.query;

  let movements = db.stock_movements;
  if (doc_type && typeof doc_type === 'string' && doc_type !== 'all') {
    movements = movements.filter(m => m.reference_doc_type === doc_type);
  }

  const byType: Record<string, { count: number; total_qty: number; total_val: number }> = {};
  movements.forEach(m => {
    if (!byType[m.reference_doc_type]) {
      byType[m.reference_doc_type] = { count: 0, total_qty: 0, total_val: 0 };
    }
    byType[m.reference_doc_type].count += 1;
    byType[m.reference_doc_type].total_qty += m.quantity;
    byType[m.reference_doc_type].total_val += m.total_value;
  });

  res.json({
    breakdown_by_type: byType,
    total_movement_records: movements.length
  });
});

// Adjustment Audit Report
router.get('/adjustments', requireAuth, (_req, res: Response) => {
  const db = getDB();

  const adjustments = db.adjustments.map(adj => {
    const wh = db.warehouses.find(w => w.id === adj.warehouse_id);
    const loc = db.locations.find(l => l.id === adj.location_id);
    const user = db.users.find(u => u.id === adj.created_by);

    let netUnitsDiff = 0;
    let netValueDiff = 0;

    const detailedLines = adj.lines.map(line => {
      const prod = db.products.find(p => p.id === line.product_id);
      const valDiff = line.difference * line.unit_cost;
      netUnitsDiff += line.difference;
      netValueDiff += valDiff;

      return {
        ...line,
        product_name: prod?.name || 'Unknown',
        product_sku: prod?.sku || 'Unknown',
        value_difference: valDiff
      };
    });

    return {
      id: adj.id,
      reference: adj.reference,
      warehouse_name: wh?.name || 'Unknown',
      location_name: loc?.name || 'Unknown',
      reason: adj.reason,
      status: adj.status,
      counted_date: adj.counted_date,
      created_by_name: user?.name || 'Auditor',
      net_units_difference: netUnitsDiff,
      net_value_difference: netValueDiff,
      lines: detailedLines
    };
  });

  res.json(adjustments);
});

export default router;
