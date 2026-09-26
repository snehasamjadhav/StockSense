import { Router, Response } from 'express';
import { getDB, saveDB, logAudit, getCompanyStock, getIncomingStock, getOutgoingStock } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../auth.ts';
import { Product, ProductCategory, ReorderRule, Receipt } from '../types.ts';

const router = Router();

// =======================
// PRODUCTS
// =======================

router.get('/products', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { search, category_id, status, low_stock } = req.query;

  let list = db.products.map(p => {
    const onHand = getCompanyStock(p.id);
    const incoming = getIncomingStock(p.id);
    const outgoing = getOutgoingStock(p.id);
    const forecast = onHand + incoming - outgoing;
    const isLow = onHand <= p.reorder_level;
    const isOutOfStock = onHand === 0;
    const category = db.categories.find(c => c.id === p.category_id);

    return {
      ...p,
      category_name: category ? category.name : 'Uncategorized',
      on_hand: onHand,
      incoming,
      outgoing,
      forecast,
      is_low_stock: isLow,
      is_out_of_stock: isOutOfStock,
      total_valuation: onHand * p.cost_price
    };
  });

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (category_id && typeof category_id === 'string' && category_id !== 'all') {
    list = list.filter(p => p.category_id === category_id);
  }

  if (status === 'active') {
    list = list.filter(p => p.active);
  } else if (status === 'archived') {
    list = list.filter(p => !p.active);
  }

  if (low_stock === 'true') {
    list = list.filter(p => p.is_low_stock);
  }

  res.json(list);
});

router.get('/products/:id', requireAuth, (req, res: Response) => {
  const db = getDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const onHand = getCompanyStock(product.id);
  const incoming = getIncomingStock(product.id);
  const outgoing = getOutgoingStock(product.id);

  res.json({
    ...product,
    on_hand: onHand,
    incoming,
    outgoing,
    forecast: onHand + incoming - outgoing
  });
});

router.post('/products', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const {
    name,
    sku,
    barcode,
    description,
    category_id,
    unit_of_measure,
    cost_price,
    selling_price,
    weight,
    reorder_level,
    reorder_quantity
  } = req.body;

  if (!name || !sku) {
    res.status(400).json({ error: 'Product name and SKU are required' });
    return;
  }

  const db = getDB();
  const existingSku = db.products.find(p => p.sku.toLowerCase() === sku.toLowerCase().trim());
  if (existingSku) {
    res.status(400).json({ error: `Product with SKU '${sku}' already exists` });
    return;
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    sku: sku.trim().toUpperCase(),
    barcode: barcode?.trim() || `GEN-${Date.now().toString().slice(-8)}`,
    description: description?.trim() || '',
    category_id: category_id || (db.categories[0]?.id ?? 'cat-raw'),
    unit_of_measure: unit_of_measure || 'Units',
    cost_price: Number(cost_price) || 0,
    selling_price: Number(selling_price) || 0,
    weight: Number(weight) || 0,
    reorder_level: Number(reorder_level) || 10,
    reorder_quantity: Number(reorder_quantity) || 50,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: req.user!.id,
    updated_by: req.user!.id
  };

  db.products.push(newProduct);
  saveDB();

  logAudit(req.user!, 'CREATE_PRODUCT', 'PRODUCT', newProduct.id, `Created product ${newProduct.name} (${newProduct.sku})`);
  res.status(201).json(newProduct);
});

router.put('/products/:id', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const {
    name,
    sku,
    barcode,
    description,
    category_id,
    unit_of_measure,
    cost_price,
    selling_price,
    weight,
    reorder_level,
    reorder_quantity,
    active
  } = req.body;

  if (sku && sku.toLowerCase().trim() !== product.sku.toLowerCase()) {
    const conflict = db.products.find(p => p.id !== product.id && p.sku.toLowerCase() === sku.toLowerCase().trim());
    if (conflict) {
      res.status(400).json({ error: `SKU '${sku}' is already used by another product` });
      return;
    }
    product.sku = sku.trim().toUpperCase();
  }

  if (name) product.name = name.trim();
  if (barcode !== undefined) product.barcode = barcode;
  if (description !== undefined) product.description = description;
  if (category_id) product.category_id = category_id;
  if (unit_of_measure) product.unit_of_measure = unit_of_measure;
  if (cost_price !== undefined) product.cost_price = Number(cost_price);
  if (selling_price !== undefined) product.selling_price = Number(selling_price);
  if (weight !== undefined) product.weight = Number(weight);
  if (reorder_level !== undefined) product.reorder_level = Number(reorder_level);
  if (reorder_quantity !== undefined) product.reorder_quantity = Number(reorder_quantity);
  if (active !== undefined) product.active = Boolean(active);

  product.updated_at = new Date().toISOString();
  product.updated_by = req.user!.id;

  saveDB();
  logAudit(req.user!, 'UPDATE_PRODUCT', 'PRODUCT', product.id, `Updated product ${product.sku}`);
  res.json(product);
});

// Delete or archive product
router.delete('/products/:id', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const product = db.products[index];
  const hasHistory = db.stock_movements.some(m => m.product_id === product.id) ||
    db.receipts.some(r => r.lines.some(l => l.product_id === product.id)) ||
    db.deliveries.some(d => d.lines.some(l => l.product_id === product.id));

  if (hasHistory) {
    // Archival policy: Never hard-delete products with transaction history
    product.active = false;
    product.updated_at = new Date().toISOString();
    product.updated_by = req.user!.id;
    saveDB();
    logAudit(req.user!, 'ARCHIVE_PRODUCT', 'PRODUCT', product.id, `Archived product ${product.sku} due to existing transaction ledger`);
    res.json({
      archived: true,
      message: 'Product has historical ledger records and cannot be permanently deleted. It has been deactivated/archived instead.',
      product
    });
    return;
  }

  db.products.splice(index, 1);
  saveDB();
  logAudit(req.user!, 'DELETE_PRODUCT', 'PRODUCT', product.id, `Permanently deleted product ${product.sku}`);
  res.json({ archived: false, message: 'Product permanently removed.' });
});

// =======================
// CATEGORIES
// =======================

router.get('/categories', requireAuth, (_req, res: Response) => {
  const db = getDB();
  const list = db.categories.map(c => {
    const parent = db.categories.find(p => p.id === c.parent_category_id);
    const productCount = db.products.filter(p => p.category_id === c.id).length;
    return {
      ...c,
      parent_name: parent ? parent.name : null,
      product_count: productCount
    };
  });
  res.json(list);
});

router.post('/categories', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const { name, code, description, parent_category_id } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const db = getDB();
  const newCat: ProductCategory = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    code: (code || name.substring(0, 4)).toUpperCase().trim(),
    description: description?.trim() || '',
    parent_category_id: parent_category_id || null,
    active: true
  };

  db.categories.push(newCat);
  saveDB();

  logAudit(req.user!, 'CREATE_CATEGORY', 'CATEGORY', newCat.id, `Created category ${newCat.name}`);
  res.status(201).json(newCat);
});

router.put('/categories/:id', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const { name, code, description, parent_category_id, active } = req.body;

  // Circular dependency check
  if (parent_category_id) {
    if (parent_category_id === cat.id) {
      res.status(400).json({ error: 'A category cannot be its own parent' });
      return;
    }
    // Check if new parent is a descendant of this category
    let currentParentId: string | null = parent_category_id;
    while (currentParentId) {
      if (currentParentId === cat.id) {
        res.status(400).json({ error: 'Circular category hierarchy detected. Cannot set child as parent.' });
        return;
      }
      const parent = db.categories.find(c => c.id === currentParentId);
      currentParentId = parent?.parent_category_id || null;
    }
  }

  if (name) cat.name = name.trim();
  if (code) cat.code = code.trim().toUpperCase();
  if (description !== undefined) cat.description = description.trim();
  if (parent_category_id !== undefined) cat.parent_category_id = parent_category_id || null;
  if (active !== undefined) cat.active = Boolean(active);

  saveDB();
  logAudit(req.user!, 'UPDATE_CATEGORY', 'CATEGORY', cat.id, `Updated category ${cat.name}`);
  res.json(cat);
});

router.delete('/categories/:id', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const catId = req.params.id;
  const inUse = db.products.some(p => p.category_id === catId);
  if (inUse) {
    res.status(400).json({ error: 'Cannot delete category that has assigned products. Reassign products first.' });
    return;
  }

  const hasChildren = db.categories.some(c => c.parent_category_id === catId);
  if (hasChildren) {
    res.status(400).json({ error: 'Cannot delete category with child subcategories. Reassign child categories first.' });
    return;
  }

  const idx = db.categories.findIndex(c => c.id === catId);
  if (idx === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const removed = db.categories.splice(idx, 1)[0];
  saveDB();
  logAudit(req.user!, 'DELETE_CATEGORY', 'CATEGORY', catId, `Deleted category ${removed.name}`);
  res.json({ message: 'Category removed successfully' });
});

// =======================
// REORDERING RULES
// =======================

router.get('/reorder-rules', requireAuth, (_req, res: Response) => {
  const db = getDB();
  const rules = db.reorder_rules.map(r => {
    const product = db.products.find(p => p.id === r.product_id);
    const warehouse = db.warehouses.find(w => w.id === r.warehouse_id);
    const onHand = product ? getCompanyStock(product.id) : 0;
    const isTriggered = onHand <= r.min_quantity;

    return {
      ...r,
      product_name: product?.name || 'Unknown',
      product_sku: product?.sku || 'Unknown',
      warehouse_name: warehouse?.name || 'All Warehouses',
      current_on_hand: onHand,
      is_triggered: isTriggered
    };
  });
  res.json(rules);
});

router.post('/reorder-rules', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const { product_id, warehouse_id, min_quantity, max_quantity, reorder_quantity, auto_create_receipt } = req.body;
  if (!product_id || !warehouse_id || min_quantity === undefined || reorder_quantity === undefined) {
    res.status(400).json({ error: 'Product, warehouse, min quantity, and reorder quantity are required' });
    return;
  }

  const db = getDB();
  const rule: ReorderRule = {
    id: `rr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    product_id,
    warehouse_id,
    min_quantity: Number(min_quantity),
    max_quantity: Number(max_quantity) || Number(reorder_quantity) * 2,
    reorder_quantity: Number(reorder_quantity),
    active: true,
    auto_create_receipt: Boolean(auto_create_receipt)
  };

  db.reorder_rules.push(rule);
  saveDB();

  logAudit(req.user!, 'CREATE_REORDER_RULE', 'REORDER_RULE', rule.id, `Created reorder rule for product ${product_id}`);
  res.status(201).json(rule);
});

router.put('/reorder-rules/:id', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const rule = db.reorder_rules.find(r => r.id === req.params.id);
  if (!rule) {
    res.status(404).json({ error: 'Reorder rule not found' });
    return;
  }

  const { min_quantity, max_quantity, reorder_quantity, active, auto_create_receipt } = req.body;
  if (min_quantity !== undefined) rule.min_quantity = Number(min_quantity);
  if (max_quantity !== undefined) rule.max_quantity = Number(max_quantity);
  if (reorder_quantity !== undefined) rule.reorder_quantity = Number(reorder_quantity);
  if (active !== undefined) rule.active = Boolean(active);
  if (auto_create_receipt !== undefined) rule.auto_create_receipt = Boolean(auto_create_receipt);

  saveDB();
  logAudit(req.user!, 'UPDATE_REORDER_RULE', 'REORDER_RULE', rule.id, `Updated reorder rule`);
  res.json(rule);
});

router.delete('/reorder-rules/:id', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const idx = db.reorder_rules.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Reorder rule not found' });
    return;
  }
  db.reorder_rules.splice(idx, 1);
  saveDB();
  logAudit(req.user!, 'DELETE_REORDER_RULE', 'REORDER_RULE', req.params.id, `Deleted reorder rule`);
  res.json({ message: 'Reorder rule deleted' });
});

// Run replenishment check and generate purchase receipt for low stock
router.post('/reorder-rules/replenish/:productId', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const product = db.products.find(p => p.id === req.params.productId);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const defaultWh = db.warehouses[0];
  const inboundLoc = db.locations.find(l => l.warehouse_id === defaultWh.id && l.type === 'internal') || db.locations[0];

  const qtyToOrder = product.reorder_quantity || 50;
  const count = db.receipts.length + 1;
  const ref = `REC-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

  const receipt: Receipt = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reference: ref,
    supplier_name: 'Auto-Replenishment System / Preferred Supplier',
    destination_warehouse_id: defaultWh.id,
    destination_location_id: inboundLoc.id,
    status: 'READY',
    scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: `Automated replenishment receipt triggered by low stock alert (${product.sku})`,
    lines: [
      {
        id: `line-${Date.now()}`,
        product_id: product.id,
        demanded_qty: qtyToOrder,
        received_qty: 0,
        unit_price: product.cost_price
      }
    ],
    created_by: req.user!.id,
    created_at: new Date().toISOString()
  };

  db.receipts.push(receipt);
  saveDB();

  logAudit(req.user!, 'AUTO_REORDER_RECEIPT', 'RECEIPT', receipt.id, `Generated replenishment receipt ${ref} for ${product.sku} (Qty: ${qtyToOrder})`);
  res.status(201).json({ success: true, receipt });
});

export default router;
