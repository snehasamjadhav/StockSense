import { Router, Response } from 'express';
import { getDB, saveDB, logAudit, getLocationStock, getCompanyStock } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../auth.ts';
import {
  Receipt,
  DeliveryOrder,
  InternalTransfer,
  InventoryAdjustment,
  StockMovement,
  StockLedgerEntry
} from '../types.ts';

const router = Router();

// =======================
// RECEIPTS (Incoming Shipments)
// =======================

router.get('/receipts', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { status, warehouse_id } = req.query;

  let list = db.receipts.map(r => {
    const wh = db.warehouses.find(w => w.id === r.destination_warehouse_id);
    const loc = db.locations.find(l => l.id === r.destination_location_id);
    const creator = db.users.find(u => u.id === r.created_by);
    const totalQty = r.lines.reduce((acc, l) => acc + l.demanded_qty, 0);
    const totalValue = r.lines.reduce((acc, l) => acc + (l.demanded_qty * (l.unit_price || 0)), 0);

    return {
      ...r,
      destination_warehouse_name: wh?.name || 'Unknown Warehouse',
      destination_location_name: loc?.name || 'Unknown Location',
      created_by_name: creator?.name || 'Unknown',
      total_items: totalQty,
      total_value: totalValue
    };
  });

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(r => r.status === status);
  }

  if (warehouse_id && typeof warehouse_id === 'string' && warehouse_id !== 'all') {
    list = list.filter(r => r.destination_warehouse_id === warehouse_id);
  }

  res.json(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

router.get('/receipts/:id', requireAuth, (req, res: Response) => {
  const db = getDB();
  const receipt = db.receipts.find(r => r.id === req.params.id);
  if (!receipt) {
    res.status(404).json({ error: 'Receipt not found' });
    return;
  }

  const wh = db.warehouses.find(w => w.id === receipt.destination_warehouse_id);
  const loc = db.locations.find(l => l.id === receipt.destination_location_id);
  const linesWithDetails = receipt.lines.map(line => {
    const product = db.products.find(p => p.id === line.product_id);
    return {
      ...line,
      product_name: product?.name || 'Unknown',
      product_sku: product?.sku || 'Unknown',
      unit_of_measure: product?.unit_of_measure || 'Units'
    };
  });

  res.json({
    ...receipt,
    destination_warehouse_name: wh?.name,
    destination_location_name: loc?.name,
    lines: linesWithDetails
  });
});

router.post('/receipts', requireAuth, (req: AuthRequest, res: Response) => {
  const { supplier_name, destination_warehouse_id, destination_location_id, scheduled_date, notes, lines } = req.body;

  if (!supplier_name || !destination_warehouse_id || !lines || lines.length === 0) {
    res.status(400).json({ error: 'Supplier, destination warehouse, and at least one item line are required' });
    return;
  }

  const db = getDB();
  const destLoc = destination_location_id ||
    db.locations.find(l => l.warehouse_id === destination_warehouse_id && l.type === 'internal')?.id ||
    db.locations[0].id;

  const count = db.receipts.length + 1;
  const ref = `REC-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

  const receipt: Receipt = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reference: ref,
    supplier_name: supplier_name.trim(),
    destination_warehouse_id,
    destination_location_id: destLoc,
    status: 'READY',
    scheduled_date: scheduled_date || new Date().toISOString(),
    notes: notes?.trim() || '',
    lines: lines.map((l: any, idx: number) => {
      const prod = db.products.find(p => p.id === l.product_id);
      return {
        id: `line-${Date.now()}-${idx}`,
        product_id: l.product_id,
        demanded_qty: Number(l.demanded_qty) || 1,
        received_qty: 0,
        unit_price: Number(l.unit_price) || prod?.cost_price || 0
      };
    }),
    created_by: req.user!.id,
    created_at: new Date().toISOString()
  };

  db.receipts.push(receipt);
  saveDB();

  logAudit(req.user!, 'CREATE_RECEIPT', 'RECEIPT', receipt.id, `Created incoming receipt ${ref} from ${receipt.supplier_name}`);
  res.status(201).json(receipt);
});

// Validate Receipt (Posts to Stock Ledger & Movements)
router.post('/receipts/:id/validate', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const receipt = db.receipts.find(r => r.id === req.params.id);
  if (!receipt) {
    res.status(404).json({ error: 'Receipt not found' });
    return;
  }

  if (receipt.status === 'DONE') {
    res.status(400).json({ error: 'Receipt has already been validated and posted' });
    return;
  }

  if (receipt.status === 'CANCELLED') {
    res.status(400).json({ error: 'Cannot validate a cancelled receipt' });
    return;
  }

  const now = new Date().toISOString();
  const supplierLoc = db.locations.find(l => l.type === 'supplier') || db.locations[0];

  // Process each line into stock movements and ledger
  receipt.lines.forEach((line, idx) => {
    const qty = line.received_qty > 0 ? line.received_qty : line.demanded_qty;
    line.received_qty = qty; // mark as received

    const prod = db.products.find(p => p.id === line.product_id);
    const unitCost = line.unit_price || prod?.cost_price || 0;
    const moveId = `mov-${Date.now()}-${idx}`;

    // 1. Create Stock Movement
    const movement: StockMovement = {
      id: moveId,
      reference_doc_type: 'RECEIPT',
      reference_doc_id: receipt.id,
      reference_doc_number: receipt.reference,
      product_id: line.product_id,
      source_location_id: supplierLoc.id,
      destination_location_id: receipt.destination_location_id,
      quantity: qty,
      unit_cost: unitCost,
      total_value: qty * unitCost,
      date: now,
      user_id: req.user!.id,
      user_name: req.user!.name
    };
    db.stock_movements.push(movement);

    // 2. Compute balance before at destination location
    const balanceBefore = getLocationStock(line.product_id, receipt.destination_location_id);
    const balanceAfter = balanceBefore + qty;

    // 3. Post Stock Ledger Entry (+IN)
    const ledgerEntry: StockLedgerEntry = {
      id: `led-${Date.now()}-${idx}`,
      date: now,
      movement_id: moveId,
      reference: receipt.reference,
      product_id: line.product_id,
      warehouse_id: receipt.destination_warehouse_id,
      location_id: receipt.destination_location_id,
      type: 'IN',
      quantity: qty,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      unit_cost: unitCost,
      notes: `Receipt from ${receipt.supplier_name}`,
      created_at: now
    };
    db.stock_ledger.push(ledgerEntry);
  });

  receipt.status = 'DONE';
  receipt.validated_at = now;
  receipt.validated_by = req.user!.id;

  saveDB();
  logAudit(req.user!, 'VALIDATE_RECEIPT', 'RECEIPT', receipt.id, `Validated receipt ${receipt.reference} and updated stock ledger`);

  res.json({ success: true, receipt, message: 'Receipt validated and inventory ledger updated successfully.' });
});

// =======================
// DELIVERY ORDERS (Outgoing Shipments)
// =======================

router.get('/deliveries', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { status, warehouse_id } = req.query;

  let list = db.deliveries.map(d => {
    const wh = db.warehouses.find(w => w.id === d.source_warehouse_id);
    const loc = db.locations.find(l => l.id === d.source_location_id);
    const creator = db.users.find(u => u.id === d.created_by);
    const totalQty = d.lines.reduce((acc, l) => acc + l.demanded_qty, 0);
    const totalValue = d.lines.reduce((acc, l) => acc + (l.demanded_qty * (l.unit_price || 0)), 0);

    return {
      ...d,
      source_warehouse_name: wh?.name || 'Unknown Warehouse',
      source_location_name: loc?.name || 'Unknown Location',
      created_by_name: creator?.name || 'Unknown',
      total_items: totalQty,
      total_value: totalValue
    };
  });

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(d => d.status === status);
  }

  if (warehouse_id && typeof warehouse_id === 'string' && warehouse_id !== 'all') {
    list = list.filter(d => d.source_warehouse_id === warehouse_id);
  }

  res.json(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

router.get('/deliveries/:id', requireAuth, (req, res: Response) => {
  const db = getDB();
  const delivery = db.deliveries.find(d => d.id === req.params.id);
  if (!delivery) {
    res.status(404).json({ error: 'Delivery order not found' });
    return;
  }

  const wh = db.warehouses.find(w => w.id === delivery.source_warehouse_id);
  const loc = db.locations.find(l => l.id === delivery.source_location_id);
  const linesWithDetails = delivery.lines.map(line => {
    const product = db.products.find(p => p.id === line.product_id);
    const currentLocStock = getLocationStock(line.product_id, delivery.source_location_id);
    return {
      ...line,
      product_name: product?.name || 'Unknown',
      product_sku: product?.sku || 'Unknown',
      unit_of_measure: product?.unit_of_measure || 'Units',
      available_stock_at_location: currentLocStock
    };
  });

  res.json({
    ...delivery,
    source_warehouse_name: wh?.name,
    source_location_name: loc?.name,
    lines: linesWithDetails
  });
});

router.post('/deliveries', requireAuth, (req: AuthRequest, res: Response) => {
  const { customer_name, source_warehouse_id, source_location_id, scheduled_date, notes, lines } = req.body;

  if (!customer_name || !source_warehouse_id || !lines || lines.length === 0) {
    res.status(400).json({ error: 'Customer name, source warehouse, and items are required' });
    return;
  }

  const db = getDB();
  const srcLoc = source_location_id ||
    db.locations.find(l => l.warehouse_id === source_warehouse_id && l.type === 'internal')?.id ||
    db.locations[0].id;

  const count = db.deliveries.length + 1;
  const ref = `OUT-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

  const delivery: DeliveryOrder = {
    id: `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reference: ref,
    customer_name: customer_name.trim(),
    source_warehouse_id,
    source_location_id: srcLoc,
    status: 'READY',
    scheduled_date: scheduled_date || new Date().toISOString(),
    notes: notes?.trim() || '',
    lines: lines.map((l: any, idx: number) => {
      const prod = db.products.find(p => p.id === l.product_id);
      return {
        id: `line-${Date.now()}-${idx}`,
        product_id: l.product_id,
        demanded_qty: Number(l.demanded_qty) || 1,
        reserved_qty: Number(l.demanded_qty) || 1,
        delivered_qty: 0,
        unit_price: Number(l.unit_price) || prod?.selling_price || 0
      };
    }),
    created_by: req.user!.id,
    created_at: new Date().toISOString()
  };

  db.deliveries.push(delivery);
  saveDB();

  logAudit(req.user!, 'CREATE_DELIVERY', 'DELIVERY_ORDER', delivery.id, `Created delivery order ${ref} for ${delivery.customer_name}`);
  res.status(201).json(delivery);
});

// Validate Delivery Order (Deducts stock from source location)
router.post('/deliveries/:id/validate', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const delivery = db.deliveries.find(d => d.id === req.params.id);
  if (!delivery) {
    res.status(404).json({ error: 'Delivery order not found' });
    return;
  }

  if (delivery.status === 'DONE') {
    res.status(400).json({ error: 'Delivery order has already been validated and shipped' });
    return;
  }

  if (delivery.status === 'CANCELLED') {
    res.status(400).json({ error: 'Cannot validate a cancelled delivery' });
    return;
  }

  // Stock availability check: Ensure source location has sufficient quantity
  const shortages: string[] = [];
  for (const line of delivery.lines) {
    const qty = line.delivered_qty > 0 ? line.delivered_qty : line.demanded_qty;
    const currentStock = getLocationStock(line.product_id, delivery.source_location_id);
    if (currentStock < qty) {
      const prod = db.products.find(p => p.id === line.product_id);
      shortages.push(`${prod?.name || line.product_id}: required ${qty}, available at location ${currentStock}`);
    }
  }

  if (shortages.length > 0) {
    res.status(400).json({
      error: 'Insufficient stock at selected location to complete shipment',
      details: shortages
    });
    return;
  }

  const now = new Date().toISOString();
  const custLoc = db.locations.find(l => l.type === 'customer') || db.locations[0];

  delivery.lines.forEach((line, idx) => {
    const qty = line.delivered_qty > 0 ? line.delivered_qty : line.demanded_qty;
    line.delivered_qty = qty;

    const prod = db.products.find(p => p.id === line.product_id);
    const unitCost = prod?.cost_price || 0;
    const moveId = `mov-${Date.now()}-${idx}`;

    // 1. Create Stock Movement (OUT)
    const movement: StockMovement = {
      id: moveId,
      reference_doc_type: 'DELIVERY',
      reference_doc_id: delivery.id,
      reference_doc_number: delivery.reference,
      product_id: line.product_id,
      source_location_id: delivery.source_location_id,
      destination_location_id: custLoc.id,
      quantity: qty,
      unit_cost: unitCost,
      total_value: qty * unitCost,
      date: now,
      user_id: req.user!.id,
      user_name: req.user!.name
    };
    db.stock_movements.push(movement);

    // 2. Post Stock Ledger Entry (-OUT)
    const balanceBefore = getLocationStock(line.product_id, delivery.source_location_id);
    const balanceAfter = balanceBefore - qty;

    const ledgerEntry: StockLedgerEntry = {
      id: `led-${Date.now()}-${idx}`,
      date: now,
      movement_id: moveId,
      reference: delivery.reference,
      product_id: line.product_id,
      warehouse_id: delivery.source_warehouse_id,
      location_id: delivery.source_location_id,
      type: 'OUT',
      quantity: qty,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      unit_cost: unitCost,
      notes: `Dispatched to ${delivery.customer_name}`,
      created_at: now
    };
    db.stock_ledger.push(ledgerEntry);
  });

  delivery.status = 'DONE';
  delivery.validated_at = now;
  delivery.validated_by = req.user!.id;

  saveDB();
  logAudit(req.user!, 'VALIDATE_DELIVERY', 'DELIVERY_ORDER', delivery.id, `Validated delivery ${delivery.reference}`);

  res.json({ success: true, delivery, message: 'Delivery order shipped and stock ledger updated.' });
});

// =======================
// INTERNAL TRANSFERS
// =======================

router.get('/transfers', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { status } = req.query;

  let list = db.transfers.map(t => {
    const srcWh = db.warehouses.find(w => w.id === t.source_warehouse_id);
    const srcLoc = db.locations.find(l => l.id === t.source_location_id);
    const dstWh = db.warehouses.find(w => w.id === t.destination_warehouse_id);
    const dstLoc = db.locations.find(l => l.id === t.destination_location_id);
    const creator = db.users.find(u => u.id === t.created_by);
    const totalQty = t.lines.reduce((acc, l) => acc + l.demanded_qty, 0);

    return {
      ...t,
      source_warehouse_name: srcWh?.name || 'Unknown',
      source_location_name: srcLoc?.name || 'Unknown',
      destination_warehouse_name: dstWh?.name || 'Unknown',
      destination_location_name: dstLoc?.name || 'Unknown',
      created_by_name: creator?.name || 'Unknown',
      total_items: totalQty
    };
  });

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(t => t.status === status);
  }

  res.json(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

router.get('/transfers/:id', requireAuth, (req, res: Response) => {
  const db = getDB();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    res.status(404).json({ error: 'Transfer not found' });
    return;
  }

  const srcLoc = db.locations.find(l => l.id === transfer.source_location_id);
  const dstLoc = db.locations.find(l => l.id === transfer.destination_location_id);

  const linesWithDetails = transfer.lines.map(line => {
    const product = db.products.find(p => p.id === line.product_id);
    const availableAtSource = getLocationStock(line.product_id, transfer.source_location_id);
    return {
      ...line,
      product_name: product?.name || 'Unknown',
      product_sku: product?.sku || 'Unknown',
      unit_of_measure: product?.unit_of_measure || 'Units',
      available_at_source: availableAtSource
    };
  });

  res.json({
    ...transfer,
    source_location_name: srcLoc?.name,
    destination_location_name: dstLoc?.name,
    lines: linesWithDetails
  });
});

router.post('/transfers', requireAuth, (req: AuthRequest, res: Response) => {
  const {
    source_warehouse_id,
    source_location_id,
    destination_warehouse_id,
    destination_location_id,
    scheduled_date,
    notes,
    lines
  } = req.body;

  if (!source_location_id || !destination_location_id || !lines || lines.length === 0) {
    res.status(400).json({ error: 'Source location, destination location, and transfer items are required' });
    return;
  }

  if (source_location_id === destination_location_id) {
    res.status(400).json({ error: 'Source and destination locations cannot be identical' });
    return;
  }

  const db = getDB();
  const count = db.transfers.length + 1;
  const ref = `INT-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

  const transfer: InternalTransfer = {
    id: `trn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reference: ref,
    source_warehouse_id: source_warehouse_id || db.warehouses[0].id,
    source_location_id,
    destination_warehouse_id: destination_warehouse_id || source_warehouse_id || db.warehouses[0].id,
    destination_location_id,
    status: 'READY',
    scheduled_date: scheduled_date || new Date().toISOString(),
    notes: notes?.trim() || '',
    lines: lines.map((l: any, idx: number) => ({
      id: `line-${Date.now()}-${idx}`,
      product_id: l.product_id,
      demanded_qty: Number(l.demanded_qty) || 1,
      transferred_qty: 0
    })),
    created_by: req.user!.id,
    created_at: new Date().toISOString()
  };

  db.transfers.push(transfer);
  saveDB();

  logAudit(req.user!, 'CREATE_TRANSFER', 'INTERNAL_TRANSFER', transfer.id, `Created internal transfer ${ref}`);
  res.status(201).json(transfer);
});

// Validate Internal Transfer
// Core Principle:
// 1. Total company stock is UNCHANGED.
// 2. Exactly 2 Stock Ledger entries are generated: -OUT at source, +IN at destination.
router.post('/transfers/:id/validate', requireAuth, (req: AuthRequest, res: Response) => {
  const db = getDB();
  const transfer = db.transfers.find(t => t.id === req.params.id);
  if (!transfer) {
    res.status(404).json({ error: 'Transfer not found' });
    return;
  }

  if (transfer.status === 'DONE') {
    res.status(400).json({ error: 'Transfer has already been executed' });
    return;
  }

  // Stock check at source location
  const shortages: string[] = [];
  for (const line of transfer.lines) {
    const qty = line.transferred_qty > 0 ? line.transferred_qty : line.demanded_qty;
    const available = getLocationStock(line.product_id, transfer.source_location_id);
    if (available < qty) {
      const prod = db.products.find(p => p.id === line.product_id);
      shortages.push(`${prod?.name || line.product_id}: required ${qty}, available at source ${available}`);
    }
  }

  if (shortages.length > 0) {
    res.status(400).json({
      error: 'Cannot transfer stock: Source location does not have enough on-hand quantity',
      details: shortages
    });
    return;
  }

  const now = new Date().toISOString();

  transfer.lines.forEach((line, idx) => {
    const qty = line.transferred_qty > 0 ? line.transferred_qty : line.demanded_qty;
    line.transferred_qty = qty;

    const prod = db.products.find(p => p.id === line.product_id);
    const unitCost = prod?.cost_price || 0;
    const moveId = `mov-${Date.now()}-${idx}`;

    // 1. Single atomic stock movement from Source to Destination
    const movement: StockMovement = {
      id: moveId,
      reference_doc_type: 'INTERNAL_TRANSFER',
      reference_doc_id: transfer.id,
      reference_doc_number: transfer.reference,
      product_id: line.product_id,
      source_location_id: transfer.source_location_id,
      destination_location_id: transfer.destination_location_id,
      quantity: qty,
      unit_cost: unitCost,
      total_value: qty * unitCost,
      date: now,
      user_id: req.user!.id,
      user_name: req.user!.name
    };
    db.stock_movements.push(movement);

    // 2. Double-entry Stock Ledger: OUT from source
    const srcBalanceBefore = getLocationStock(line.product_id, transfer.source_location_id);
    db.stock_ledger.push({
      id: `led-${Date.now()}-out-${idx}`,
      date: now,
      movement_id: moveId,
      reference: transfer.reference,
      product_id: line.product_id,
      warehouse_id: transfer.source_warehouse_id,
      location_id: transfer.source_location_id,
      type: 'OUT',
      quantity: qty,
      balance_before: srcBalanceBefore,
      balance_after: srcBalanceBefore - qty,
      unit_cost: unitCost,
      notes: `Transfer OUT to ${transfer.destination_location_id}`,
      created_at: now
    });

    // 3. Double-entry Stock Ledger: IN to destination
    const dstBalanceBefore = getLocationStock(line.product_id, transfer.destination_location_id);
    db.stock_ledger.push({
      id: `led-${Date.now()}-in-${idx}`,
      date: now,
      movement_id: moveId,
      reference: transfer.reference,
      product_id: line.product_id,
      warehouse_id: transfer.destination_warehouse_id,
      location_id: transfer.destination_location_id,
      type: 'IN',
      quantity: qty,
      balance_before: dstBalanceBefore,
      balance_after: dstBalanceBefore + qty,
      unit_cost: unitCost,
      notes: `Transfer IN from ${transfer.source_location_id}`,
      created_at: now
    });
  });

  transfer.status = 'DONE';
  transfer.validated_at = now;
  transfer.validated_by = req.user!.id;

  saveDB();
  logAudit(req.user!, 'VALIDATE_TRANSFER', 'INTERNAL_TRANSFER', transfer.id, `Executed internal transfer ${transfer.reference}`);

  res.json({
    success: true,
    transfer,
    message: 'Internal transfer completed. Relocated inventory with zero change in total company stock.'
  });
});

// =======================
// INVENTORY ADJUSTMENTS
// =======================

router.get('/adjustments', requireAuth, (req, res: Response) => {
  const db = getDB();
  const list = db.adjustments.map(a => {
    const wh = db.warehouses.find(w => w.id === a.warehouse_id);
    const loc = db.locations.find(l => l.id === a.location_id);
    const creator = db.users.find(u => u.id === a.created_by);
    const totalDiff = a.lines.reduce((acc, l) => acc + l.difference, 0);

    return {
      ...a,
      warehouse_name: wh?.name || 'Unknown',
      location_name: loc?.name || 'Unknown',
      created_by_name: creator?.name || 'Unknown',
      total_difference_qty: totalDiff
    };
  });

  res.json(list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

router.post('/adjustments', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const { warehouse_id, location_id, reason, notes, lines } = req.body;

  if (!warehouse_id || !location_id || !lines || lines.length === 0) {
    res.status(400).json({ error: 'Warehouse, location, and counted lines are required' });
    return;
  }

  const db = getDB();
  const count = db.adjustments.length + 1;
  const ref = `ADJ-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;

  // Automatically calculate system qty and discrepancy for each line
  const processedLines = lines.map((l: any, idx: number) => {
    const prod = db.products.find(p => p.id === l.product_id);
    const systemQty = getLocationStock(l.product_id, location_id);
    const countedQty = Number(l.counted_qty) ?? systemQty;
    const diff = countedQty - systemQty;

    return {
      id: `line-${Date.now()}-${idx}`,
      product_id: l.product_id,
      system_qty: systemQty,
      counted_qty: countedQty,
      difference: diff,
      unit_cost: prod?.cost_price || 0
    };
  });

  const adjustment: InventoryAdjustment = {
    id: `adj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reference: ref,
    warehouse_id,
    location_id,
    reason: reason || 'Routine Audit',
    status: 'DRAFT',
    counted_date: new Date().toISOString(),
    notes: notes?.trim() || '',
    lines: processedLines,
    created_by: req.user!.id,
    created_at: new Date().toISOString()
  };

  db.adjustments.push(adjustment);
  saveDB();

  logAudit(req.user!, 'CREATE_ADJUSTMENT', 'INVENTORY_ADJUSTMENT', adjustment.id, `Created inventory adjustment draft ${ref}`);
  res.status(201).json(adjustment);
});

// Validate Inventory Adjustment
router.post('/adjustments/:id/validate', requireAuth, requireRole(['ADMIN', 'INVENTORY_MANAGER']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const adjustment = db.adjustments.find(a => a.id === req.params.id);
  if (!adjustment) {
    res.status(404).json({ error: 'Adjustment record not found' });
    return;
  }

  if (adjustment.status === 'DONE') {
    res.status(400).json({ error: 'Adjustment has already been validated and posted' });
    return;
  }

  const now = new Date().toISOString();
  const scrapLoc = db.locations.find(l => l.type === 'inventory_loss') || db.locations[0];

  adjustment.lines.forEach((line, idx) => {
    if (line.difference === 0) return; // No change needed

    const moveId = `mov-${Date.now()}-${idx}`;
    const absDiff = Math.abs(line.difference);

    if (line.difference > 0) {
      // Positive Adjustment (Found Stock): +IN to location
      const movement: StockMovement = {
        id: moveId,
        reference_doc_type: 'ADJUSTMENT',
        reference_doc_id: adjustment.id,
        reference_doc_number: adjustment.reference,
        product_id: line.product_id,
        source_location_id: scrapLoc.id,
        destination_location_id: adjustment.location_id,
        quantity: absDiff,
        unit_cost: line.unit_cost,
        total_value: absDiff * line.unit_cost,
        date: now,
        user_id: req.user!.id,
        user_name: req.user!.name
      };
      db.stock_movements.push(movement);

      const balBefore = getLocationStock(line.product_id, adjustment.location_id);
      db.stock_ledger.push({
        id: `led-${Date.now()}-${idx}`,
        date: now,
        movement_id: moveId,
        reference: adjustment.reference,
        product_id: line.product_id,
        warehouse_id: adjustment.warehouse_id,
        location_id: adjustment.location_id,
        type: 'IN',
        quantity: absDiff,
        balance_before: balBefore,
        balance_after: balBefore + absDiff,
        unit_cost: line.unit_cost,
        notes: `Inventory Adjustment (Positive count gain): ${adjustment.reason}`,
        created_at: now
      });
    } else {
      // Negative Adjustment (Loss / Scrap): -OUT from location
      const movement: StockMovement = {
        id: moveId,
        reference_doc_type: 'ADJUSTMENT',
        reference_doc_id: adjustment.id,
        reference_doc_number: adjustment.reference,
        product_id: line.product_id,
        source_location_id: adjustment.location_id,
        destination_location_id: scrapLoc.id,
        quantity: absDiff,
        unit_cost: line.unit_cost,
        total_value: absDiff * line.unit_cost,
        date: now,
        user_id: req.user!.id,
        user_name: req.user!.name
      };
      db.stock_movements.push(movement);

      const balBefore = getLocationStock(line.product_id, adjustment.location_id);
      db.stock_ledger.push({
        id: `led-${Date.now()}-${idx}`,
        date: now,
        movement_id: moveId,
        reference: adjustment.reference,
        product_id: line.product_id,
        warehouse_id: adjustment.warehouse_id,
        location_id: adjustment.location_id,
        type: 'OUT',
        quantity: absDiff,
        balance_before: balBefore,
        balance_after: Math.max(0, balBefore - absDiff),
        unit_cost: line.unit_cost,
        notes: `Inventory Adjustment (Shrinkage / discrepancy): ${adjustment.reason}`,
        created_at: now
      });
    }
  });

  adjustment.status = 'DONE';
  adjustment.validated_at = now;
  adjustment.validated_by = req.user!.id;

  saveDB();
  logAudit(req.user!, 'VALIDATE_ADJUSTMENT', 'INVENTORY_ADJUSTMENT', adjustment.id, `Validated inventory adjustment ${adjustment.reference}`);

  res.json({ success: true, adjustment, message: 'Physical count verified. Discrepancies reconciled in stock ledger.' });
});

// =======================
// MOVE HISTORY (Stock Movements)
// =======================

router.get('/movements', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { product_id, doc_type } = req.query;

  let list = db.stock_movements.map(m => {
    const prod = db.products.find(p => p.id === m.product_id);
    const srcLoc = db.locations.find(l => l.id === m.source_location_id);
    const dstLoc = db.locations.find(l => l.id === m.destination_location_id);

    return {
      ...m,
      product_name: prod?.name || 'Unknown',
      product_sku: prod?.sku || 'Unknown',
      unit_of_measure: prod?.unit_of_measure || 'Units',
      source_location_name: srcLoc?.name || 'External / Supplier',
      destination_location_name: dstLoc?.name || 'External / Customer'
    };
  });

  if (product_id && typeof product_id === 'string' && product_id !== 'all') {
    list = list.filter(m => m.product_id === product_id);
  }

  if (doc_type && typeof doc_type === 'string' && doc_type !== 'all') {
    list = list.filter(m => m.reference_doc_type === doc_type);
  }

  res.json(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
});

export default router;
