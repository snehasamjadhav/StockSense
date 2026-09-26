import { Router, Response } from 'express';
import { getDB, saveDB, logAudit, getLocationStock } from '../db.ts';
import { requireAuth, requireRole, AuthRequest } from '../auth.ts';
import { Warehouse, Location } from '../types.ts';

const router = Router();

// =======================
// WAREHOUSES
// =======================

router.get('/warehouses', requireAuth, (_req, res: Response) => {
  const db = getDB();
  const list = db.warehouses.map(w => {
    const locations = db.locations.filter(l => l.warehouse_id === w.id);
    return {
      ...w,
      location_count: locations.length,
      locations
    };
  });
  res.json(list);
});

router.post('/warehouses', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { name, code, address } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: 'Warehouse name and unique code are required' });
    return;
  }

  const db = getDB();
  const existingCode = db.warehouses.find(w => w.code.toLowerCase() === code.toLowerCase().trim());
  if (existingCode) {
    res.status(400).json({ error: `Warehouse code '${code}' is already taken` });
    return;
  }

  const warehouse: Warehouse = {
    id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    code: code.trim().toUpperCase(),
    address: address?.trim() || '',
    active: true,
    created_at: new Date().toISOString()
  };

  db.warehouses.push(warehouse);

  // Automatically create standard default locations for the new warehouse
  const defaultLocations: Location[] = [
    {
      id: `loc-${warehouse.id}-in`,
      warehouse_id: warehouse.id,
      name: `${warehouse.code} Receiving Area`,
      code: `${warehouse.code}/IN`,
      type: 'internal',
      active: true
    },
    {
      id: `loc-${warehouse.id}-rack-a`,
      warehouse_id: warehouse.id,
      name: `${warehouse.code} Storage Rack A`,
      code: `${warehouse.code}/RACK-A`,
      type: 'internal',
      active: true
    },
    {
      id: `loc-${warehouse.id}-out`,
      warehouse_id: warehouse.id,
      name: `${warehouse.code} Dispatch Area`,
      code: `${warehouse.code}/OUT`,
      type: 'internal',
      active: true
    }
  ];

  db.locations.push(...defaultLocations);
  saveDB();

  logAudit(req.user!, 'CREATE_WAREHOUSE', 'WAREHOUSE', warehouse.id, `Created warehouse ${warehouse.name} (${warehouse.code}) with default locations`);
  res.status(201).json(warehouse);
});

router.put('/warehouses/:id', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const wh = db.warehouses.find(w => w.id === req.params.id);
  if (!wh) {
    res.status(404).json({ error: 'Warehouse not found' });
    return;
  }

  const { name, code, address, active } = req.body;
  if (code && code.toLowerCase().trim() !== wh.code.toLowerCase()) {
    const conflict = db.warehouses.find(w => w.id !== wh.id && w.code.toLowerCase() === code.toLowerCase().trim());
    if (conflict) {
      res.status(400).json({ error: `Warehouse code '${code}' already in use` });
      return;
    }
    wh.code = code.trim().toUpperCase();
  }

  if (name) wh.name = name.trim();
  if (address !== undefined) wh.address = address.trim();
  if (active !== undefined) wh.active = Boolean(active);

  saveDB();
  logAudit(req.user!, 'UPDATE_WAREHOUSE', 'WAREHOUSE', wh.id, `Updated warehouse ${wh.code}`);
  res.json(wh);
});

router.delete('/warehouses/:id', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const whId = req.params.id;

  // Check if warehouse has active inventory movements
  const locations = db.locations.filter(l => l.warehouse_id === whId);
  const locIds = new Set(locations.map(l => l.id));

  const hasLedger = db.stock_ledger.some(l => locIds.has(l.location_id));
  if (hasLedger) {
    res.status(400).json({ error: 'Cannot delete warehouse with existing inventory ledger history. Deactivate it instead.' });
    return;
  }

  const idx = db.warehouses.findIndex(w => w.id === whId);
  if (idx === -1) {
    res.status(404).json({ error: 'Warehouse not found' });
    return;
  }

  db.warehouses.splice(idx, 1);
  db.locations = db.locations.filter(l => l.warehouse_id !== whId);
  saveDB();

  logAudit(req.user!, 'DELETE_WAREHOUSE', 'WAREHOUSE', whId, `Deleted warehouse ${whId}`);
  res.json({ message: 'Warehouse removed successfully' });
});

// =======================
// LOCATIONS
// =======================

router.get('/locations', requireAuth, (req, res: Response) => {
  const db = getDB();
  const { warehouse_id, type } = req.query;

  let list = db.locations.map(l => {
    const wh = db.warehouses.find(w => w.id === l.warehouse_id);
    return {
      ...l,
      warehouse_name: wh?.name || 'Partner / Virtual',
      warehouse_code: wh?.code || 'PARTNER'
    };
  });

  if (warehouse_id && typeof warehouse_id === 'string' && warehouse_id !== 'all') {
    list = list.filter(l => l.warehouse_id === warehouse_id);
  }

  if (type && typeof type === 'string') {
    list = list.filter(l => l.type === type);
  }

  res.json(list);
});

router.post('/locations', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const { warehouse_id, name, code, type } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: 'Location name and code are required' });
    return;
  }

  const db = getDB();
  const existing = db.locations.find(l => l.code.toLowerCase() === code.toLowerCase().trim());
  if (existing) {
    res.status(400).json({ error: `Location code '${code}' already exists` });
    return;
  }

  const location: Location = {
    id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    warehouse_id: warehouse_id || db.warehouses[0]?.id || 'wh-main',
    name: name.trim(),
    code: code.trim().toUpperCase(),
    type: type || 'internal',
    active: true
  };

  db.locations.push(location);
  saveDB();

  logAudit(req.user!, 'CREATE_LOCATION', 'LOCATION', location.id, `Created location ${location.code}`);
  res.status(201).json(location);
});

router.put('/locations/:id', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const loc = db.locations.find(l => l.id === req.params.id);
  if (!loc) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }

  const { name, code, type, active, warehouse_id } = req.body;
  if (code && code.toLowerCase().trim() !== loc.code.toLowerCase()) {
    const conflict = db.locations.find(l => l.id !== loc.id && l.code.toLowerCase() === code.toLowerCase().trim());
    if (conflict) {
      res.status(400).json({ error: `Location code '${code}' already exists` });
      return;
    }
    loc.code = code.trim().toUpperCase();
  }

  if (name) loc.name = name.trim();
  if (type) loc.type = type;
  if (warehouse_id) loc.warehouse_id = warehouse_id;
  if (active !== undefined) loc.active = Boolean(active);

  saveDB();
  logAudit(req.user!, 'UPDATE_LOCATION', 'LOCATION', loc.id, `Updated location ${loc.code}`);
  res.json(loc);
});

router.delete('/locations/:id', requireAuth, requireRole(['ADMIN']), (req: AuthRequest, res: Response) => {
  const db = getDB();
  const locId = req.params.id;

  const hasLedger = db.stock_ledger.some(l => l.location_id === locId);
  if (hasLedger) {
    res.status(400).json({ error: 'Cannot delete location with recorded stock movements. Deactivate it instead.' });
    return;
  }

  const idx = db.locations.findIndex(l => l.id === locId);
  if (idx === -1) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }

  db.locations.splice(idx, 1);
  saveDB();

  logAudit(req.user!, 'DELETE_LOCATION', 'LOCATION', locId, `Deleted location ${locId}`);
  res.json({ message: 'Location deleted successfully' });
});

export default router;
