import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DBData, User, Product, StockLedgerEntry, StockMovement, AuditLog } from './types.ts';
export type { User };

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'stocksense-db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function createPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
}

let inMemoryDB: DBData | null = null;

function generateSeedData(): DBData {
  const adminCred = createPassword('admin123');
  const managerCred = createPassword('manager123');
  const staffCred = createPassword('staff123');

  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Elena Rostova',
      email: 'admin@stocksense.erp',
      password_hash: adminCred.hash,
      salt: adminCred.salt,
      role: 'ADMIN',
      active: true,
      created_at: '2026-01-10T08:00:00.000Z'
    },
    {
      id: 'usr-mgr-1',
      name: 'Marcus Vance',
      email: 'manager@stocksense.erp',
      password_hash: managerCred.hash,
      salt: managerCred.salt,
      role: 'INVENTORY_MANAGER',
      active: true,
      created_at: '2026-01-12T09:30:00.000Z'
    },
    {
      id: 'usr-staff-1',
      name: 'Devon Reed',
      email: 'staff@stocksense.erp',
      password_hash: staffCred.hash,
      salt: staffCred.salt,
      role: 'WAREHOUSE_STAFF',
      active: true,
      created_at: '2026-01-15T11:00:00.000Z'
    }
  ];

  const warehouses = [
    {
      id: 'wh-main',
      name: 'Main Distribution Center',
      code: 'WH-MAIN',
      address: '100 Industrial Parkway, Chicago, IL 60601',
      active: true,
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'wh-prod',
      name: 'Production & Assembly Facility',
      code: 'WH-PROD',
      address: '45 Tech Boulevard, Detroit, MI 48201',
      active: true,
      created_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'wh-west',
      name: 'West Coast Logistics Hub',
      code: 'WH-WEST',
      address: '88 Harbor Way, Oakland, CA 94607',
      active: true,
      created_at: '2026-01-05T00:00:00.000Z'
    }
  ];

  const locations = [
    // Virtual Partner Locations
    { id: 'loc-partner-supp', warehouse_id: 'wh-main', name: 'Suppliers / Vendors', code: 'PARTNERS/VENDORS', type: 'supplier' as const, active: true },
    { id: 'loc-partner-cust', warehouse_id: 'wh-main', name: 'Customers / Ship-To', code: 'PARTNERS/CUSTOMERS', type: 'customer' as const, active: true },

    // WH-MAIN
    { id: 'loc-main-in', warehouse_id: 'wh-main', name: 'Dock 1 - Inbound Receiving', code: 'WH-MAIN/IN', type: 'internal' as const, active: true },
    { id: 'loc-main-rack-a', warehouse_id: 'wh-main', name: 'High-Bay Rack A (Fast Moving)', code: 'WH-MAIN/RACK-A', type: 'internal' as const, active: true },
    { id: 'loc-main-rack-b', warehouse_id: 'wh-main', name: 'High-Bay Rack B (Bulk Reserve)', code: 'WH-MAIN/RACK-B', type: 'internal' as const, active: true },
    { id: 'loc-main-out', warehouse_id: 'wh-main', name: 'Dock 4 - Outbound Dispatch', code: 'WH-MAIN/OUT', type: 'internal' as const, active: true },
    { id: 'loc-main-scrap', warehouse_id: 'wh-main', name: 'Quarantine & Inspection Scrap', code: 'WH-MAIN/SCRAP', type: 'inventory_loss' as const, active: true },

    // WH-PROD
    { id: 'loc-prod-in', warehouse_id: 'wh-prod', name: 'Material Influx Gate', code: 'WH-PROD/IN', type: 'internal' as const, active: true },
    { id: 'loc-prod-rack', warehouse_id: 'wh-prod', name: 'Assembly Line Feed Rack', code: 'WH-PROD/RACK', type: 'internal' as const, active: true },
    { id: 'loc-prod-out', warehouse_id: 'wh-prod', name: 'Finished Goods Bay', code: 'WH-PROD/OUT', type: 'internal' as const, active: true },

    // WH-WEST
    { id: 'loc-west-in', warehouse_id: 'wh-west', name: 'Pier Receiving Bay', code: 'WH-WEST/IN', type: 'internal' as const, active: true },
    { id: 'loc-west-rack', warehouse_id: 'wh-west', name: 'Tier 1 Shelving', code: 'WH-WEST/RACK-1', type: 'internal' as const, active: true }
  ];

  const categories = [
    { id: 'cat-raw', name: 'Raw Materials', code: 'RAW', description: 'Base metals, polymers, and raw input materials', parent_category_id: null, active: true },
    { id: 'cat-metals', name: 'Metals & Alloys', code: 'RAW-MTL', description: 'Aluminum, carbon steel, and copper billets', parent_category_id: 'cat-raw', active: true },
    { id: 'cat-polymers', name: 'Polymers & Resins', code: 'RAW-POLY', description: 'HDPE, Delrin, and thermo-molding resins', parent_category_id: 'cat-raw', active: true },
    { id: 'cat-elec', name: 'Electronics & Sensors', code: 'ELEC', description: 'Controllers, optical sensors, and power units', parent_category_id: null, active: true },
    { id: 'cat-finished', name: 'Finished Goods', code: 'FG', description: 'Assembled IoT hardware, enterprise systems', parent_category_id: null, active: true },
    { id: 'cat-furn', name: 'Industrial Ergonomics', code: 'FG-FURN', description: 'Cleanroom and ESD certified seating', parent_category_id: 'cat-finished', active: true }
  ];

  const products: Product[] = [
    {
      id: 'prod-1',
      name: 'High-Torque NEMA Stepper Motor',
      sku: 'MTR-STP-01',
      barcode: '793573100018',
      description: '2.8Nm biphasic industrial stepper motor with dual ball bearings',
      category_id: 'cat-elec',
      unit_of_measure: 'Units',
      cost_price: 24.50,
      selling_price: 49.90,
      weight: 1.15,
      reorder_level: 60,
      reorder_quantity: 120,
      active: true,
      created_at: '2026-01-15T10:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-2',
      name: 'Precision Optical LiDAR Sensor 20M',
      sku: 'SNS-OPT-04',
      barcode: '793573100025',
      description: 'Time-of-flight optical distance sensor with CAN-bus interface',
      category_id: 'cat-elec',
      unit_of_measure: 'Units',
      cost_price: 38.00,
      selling_price: 89.00,
      weight: 0.18,
      reorder_level: 40,
      reorder_quantity: 80,
      active: true,
      created_at: '2026-01-15T10:15:00.000Z',
      updated_at: '2026-01-15T10:15:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-3',
      name: 'Aerospace Grade 6061-T6 Aluminum Billet',
      sku: 'RAW-ALU-6061',
      barcode: '793573100032',
      description: 'Precision extruded cylindrical structural stock for CNC machining',
      category_id: 'cat-metals',
      unit_of_measure: 'Kg',
      cost_price: 4.80,
      selling_price: 9.60,
      weight: 1.00,
      reorder_level: 450,
      reorder_quantity: 800,
      active: true,
      created_at: '2026-01-16T11:00:00.000Z',
      updated_at: '2026-01-16T11:00:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-4',
      name: 'High-Density Polyethylene Pellet Grade A',
      sku: 'RAW-HDPE-01',
      barcode: '793573100049',
      description: 'Pure injection-molding thermoplastic pellets in 25kg standard packaging',
      category_id: 'cat-polymers',
      unit_of_measure: 'Kg',
      cost_price: 2.10,
      selling_price: 4.25,
      weight: 1.00,
      reorder_level: 500,
      reorder_quantity: 1200,
      active: true,
      created_at: '2026-01-16T11:30:00.000Z',
      updated_at: '2026-01-16T11:30:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-5',
      name: 'StockSense Edge Gateway Controller v2',
      sku: 'FG-EDGE-GW2',
      barcode: '793573100056',
      description: 'Quad-core DIN-rail mounted industrial telemetry controller with dual ethernet',
      category_id: 'cat-finished',
      unit_of_measure: 'Units',
      cost_price: 120.00,
      selling_price: 285.00,
      weight: 0.65,
      reorder_level: 25,
      reorder_quantity: 50,
      active: true,
      created_at: '2026-01-17T09:00:00.000Z',
      updated_at: '2026-01-17T09:00:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-6',
      name: 'Heavy-Duty 19-Inch 4U Server Chassis',
      sku: 'RAW-STL-CHS',
      barcode: '793573100063',
      description: 'Cold-rolled SGCC steel frame with vibration dampening cages',
      category_id: 'cat-metals',
      unit_of_measure: 'Units',
      cost_price: 45.00,
      selling_price: 95.00,
      weight: 8.40,
      reorder_level: 30,
      reorder_quantity: 60,
      active: true,
      created_at: '2026-01-17T09:30:00.000Z',
      updated_at: '2026-01-17T09:30:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-7',
      name: 'Industrial DIN 24V 10A Switched Power Supply',
      sku: 'PWR-24V-10A',
      barcode: '793573100070',
      description: '240W ultra-slim metal case power unit, 93% operational efficiency',
      category_id: 'cat-elec',
      unit_of_measure: 'Units',
      cost_price: 34.00,
      selling_price: 72.00,
      weight: 0.85,
      reorder_level: 35,
      reorder_quantity: 70,
      active: true,
      created_at: '2026-01-18T10:00:00.000Z',
      updated_at: '2026-01-18T10:00:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    },
    {
      id: 'prod-8',
      name: 'Cleanroom ESD Static-Dissipative Task Chair',
      sku: 'FG-CHR-ESD',
      barcode: '793573100087',
      description: 'Class 10 cleanroom conductive polyurethane seating with castors',
      category_id: 'cat-furn',
      unit_of_measure: 'Units',
      cost_price: 88.00,
      selling_price: 185.00,
      weight: 12.00,
      reorder_level: 15,
      reorder_quantity: 30,
      active: true,
      created_at: '2026-01-18T10:30:00.000Z',
      updated_at: '2026-01-18T10:30:00.000Z',
      created_by: 'usr-admin-1',
      updated_by: 'usr-admin-1'
    }
  ];

  const reorder_rules = [
    { id: 'rr-1', product_id: 'prod-1', warehouse_id: 'wh-main', min_quantity: 60, max_quantity: 200, reorder_quantity: 120, active: true, auto_create_receipt: true },
    { id: 'rr-2', product_id: 'prod-2', warehouse_id: 'wh-main', min_quantity: 40, max_quantity: 150, reorder_quantity: 80, active: true, auto_create_receipt: true },
    { id: 'rr-3', product_id: 'prod-3', warehouse_id: 'wh-main', min_quantity: 450, max_quantity: 1500, reorder_quantity: 800, active: true, auto_create_receipt: false },
    { id: 'rr-4', product_id: 'prod-4', warehouse_id: 'wh-main', min_quantity: 500, max_quantity: 2000, reorder_quantity: 1200, active: true, auto_create_receipt: true },
    { id: 'rr-5', product_id: 'prod-5', warehouse_id: 'wh-main', min_quantity: 25, max_quantity: 100, reorder_quantity: 50, active: true, auto_create_receipt: false },
    { id: 'rr-6', product_id: 'prod-6', warehouse_id: 'wh-prod', min_quantity: 30, max_quantity: 100, reorder_quantity: 60, active: true, auto_create_receipt: true },
    { id: 'rr-7', product_id: 'prod-7', warehouse_id: 'wh-prod', min_quantity: 35, max_quantity: 120, reorder_quantity: 70, active: true, auto_create_receipt: true }
  ];

  // Opening stock movements & initial ledger
  const initialMovements: StockMovement[] = [];
  const initialLedger: StockLedgerEntry[] = [];

  const openingStocks = [
    { prod: 'prod-1', loc: 'loc-main-rack-a', wh: 'wh-main', qty: 140, cost: 24.50 },
    { prod: 'prod-2', loc: 'loc-main-rack-a', wh: 'wh-main', qty: 35, cost: 38.00 }, // low stock
    { prod: 'prod-3', loc: 'loc-main-rack-b', wh: 'wh-main', qty: 1250, cost: 4.80 },
    { prod: 'prod-4', loc: 'loc-main-rack-b', wh: 'wh-main', qty: 1800, cost: 2.10 },
    { prod: 'prod-5', loc: 'loc-main-rack-a', wh: 'wh-main', qty: 58, cost: 120.00 },
    { prod: 'prod-6', loc: 'loc-prod-rack', wh: 'wh-prod', qty: 45, cost: 45.00 },
    { prod: 'prod-7', loc: 'loc-prod-rack', wh: 'wh-prod', qty: 80, cost: 34.00 },
    { prod: 'prod-8', loc: 'loc-main-rack-b', wh: 'wh-main', qty: 8, cost: 88.00 } // low stock
  ];

  openingStocks.forEach((item, idx) => {
    const moveId = `mov-open-${idx + 1}`;
    const ledgerId = `led-open-${idx + 1}`;
    const date = '2026-01-20T08:00:00.000Z';

    initialMovements.push({
      id: moveId,
      reference_doc_type: 'OPENING_STOCK',
      reference_doc_id: 'SYS-INIT',
      reference_doc_number: 'OPN-2026-0001',
      product_id: item.prod,
      source_location_id: 'loc-partner-supp',
      destination_location_id: item.loc,
      quantity: item.qty,
      unit_cost: item.cost,
      total_value: item.qty * item.cost,
      date,
      user_id: 'usr-admin-1',
      user_name: 'Elena Rostova'
    });

    initialLedger.push({
      id: ledgerId,
      date,
      movement_id: moveId,
      reference: 'OPN-2026-0001',
      product_id: item.prod,
      warehouse_id: item.wh,
      location_id: item.loc,
      type: 'IN',
      quantity: item.qty,
      balance_before: 0,
      balance_after: item.qty,
      unit_cost: item.cost,
      notes: 'Initial inventory audit balance initialization',
      created_at: date
    });
  });

  // Seed sample business documents
  const receipts = [
    {
      id: 'rec-1',
      reference: 'REC-2026-0001',
      supplier_name: 'Apex Precision Drives Corp',
      destination_warehouse_id: 'wh-main',
      destination_location_id: 'loc-main-in',
      status: 'DONE' as const,
      scheduled_date: '2026-02-01T10:00:00.000Z',
      notes: 'Standard replenishment batch under PO-8842',
      lines: [
        { id: 'line-rec-1', product_id: 'prod-1', demanded_qty: 60, received_qty: 60, unit_price: 24.50 },
        { id: 'line-rec-2', product_id: 'prod-7', demanded_qty: 25, received_qty: 25, unit_price: 34.00 }
      ],
      created_by: 'usr-mgr-1',
      created_at: '2026-01-28T14:00:00.000Z',
      validated_by: 'usr-mgr-1',
      validated_at: '2026-02-01T11:15:00.000Z'
    },
    {
      id: 'rec-2',
      reference: 'REC-2026-0002',
      supplier_name: 'Nordic Photonics Labs',
      destination_warehouse_id: 'wh-main',
      destination_location_id: 'loc-main-in',
      status: 'READY' as const,
      scheduled_date: '2026-09-28T09:00:00.000Z',
      notes: 'Critical restocking for Optical LiDAR Sensors (PO-9102)',
      lines: [
        { id: 'line-rec-3', product_id: 'prod-2', demanded_qty: 80, received_qty: 0, unit_price: 38.00 }
      ],
      created_by: 'usr-mgr-1',
      created_at: '2026-09-24T16:30:00.000Z'
    }
  ];

  // Add the validated receipt movements to ledger
  const recMove1: StockMovement = {
    id: 'mov-rec-1-1',
    reference_doc_type: 'RECEIPT',
    reference_doc_id: 'rec-1',
    reference_doc_number: 'REC-2026-0001',
    product_id: 'prod-1',
    source_location_id: 'loc-partner-supp',
    destination_location_id: 'loc-main-in',
    quantity: 60,
    unit_cost: 24.50,
    total_value: 1470.00,
    date: '2026-02-01T11:15:00.000Z',
    user_id: 'usr-mgr-1',
    user_name: 'Marcus Vance'
  };

  const recMove2: StockMovement = {
    id: 'mov-rec-1-2',
    reference_doc_type: 'RECEIPT',
    reference_doc_id: 'rec-1',
    reference_doc_number: 'REC-2026-0001',
    product_id: 'prod-7',
    source_location_id: 'loc-partner-supp',
    destination_location_id: 'loc-main-in',
    quantity: 25,
    unit_cost: 34.00,
    total_value: 850.00,
    date: '2026-02-01T11:15:00.000Z',
    user_id: 'usr-mgr-1',
    user_name: 'Marcus Vance'
  };

  initialMovements.push(recMove1, recMove2);

  initialLedger.push({
    id: 'led-rec-1-1',
    date: '2026-02-01T11:15:00.000Z',
    movement_id: recMove1.id,
    reference: 'REC-2026-0001',
    product_id: 'prod-1',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-in',
    type: 'IN',
    quantity: 60,
    balance_before: 0,
    balance_after: 60,
    unit_cost: 24.50,
    notes: 'Receipt from Apex Precision Drives Corp',
    created_at: '2026-02-01T11:15:00.000Z'
  });

  initialLedger.push({
    id: 'led-rec-1-2',
    date: '2026-02-01T11:15:00.000Z',
    movement_id: recMove2.id,
    reference: 'REC-2026-0001',
    product_id: 'prod-7',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-in',
    type: 'IN',
    quantity: 25,
    balance_before: 0,
    balance_after: 25,
    unit_cost: 34.00,
    notes: 'Receipt from Apex Precision Drives Corp',
    created_at: '2026-02-01T11:15:00.000Z'
  });

  const deliveries = [
    {
      id: 'del-1',
      reference: 'OUT-2026-0001',
      customer_name: 'Vanguard Industrial Automation Ltd',
      source_warehouse_id: 'wh-main',
      source_location_id: 'loc-main-rack-a',
      status: 'DONE' as const,
      scheduled_date: '2026-02-10T14:00:00.000Z',
      notes: 'Sales Order SO-10492 for automation integration client',
      lines: [
        { id: 'line-del-1', product_id: 'prod-5', demanded_qty: 12, reserved_qty: 12, delivered_qty: 12, unit_price: 285.00 },
        { id: 'line-del-2', product_id: 'prod-1', demanded_qty: 20, reserved_qty: 20, delivered_qty: 20, unit_price: 49.90 }
      ],
      created_by: 'usr-mgr-1',
      created_at: '2026-02-08T10:00:00.000Z',
      validated_by: 'usr-staff-1',
      validated_at: '2026-02-10T15:20:00.000Z'
    },
    {
      id: 'del-2',
      reference: 'OUT-2026-0002',
      customer_name: 'Pacific Robotics Assembly Co',
      source_warehouse_id: 'wh-main',
      source_location_id: 'loc-main-rack-a',
      status: 'READY' as const,
      scheduled_date: '2026-09-27T11:00:00.000Z',
      notes: 'High-priority delivery dispatch for urgent client order',
      lines: [
        { id: 'line-del-3', product_id: 'prod-5', demanded_qty: 10, reserved_qty: 10, delivered_qty: 0, unit_price: 285.00 }
      ],
      created_by: 'usr-mgr-1',
      created_at: '2026-09-24T14:00:00.000Z'
    }
  ];

  // Delivery movements and ledger
  const delMove1: StockMovement = {
    id: 'mov-del-1-1',
    reference_doc_type: 'DELIVERY',
    reference_doc_id: 'del-1',
    reference_doc_number: 'OUT-2026-0001',
    product_id: 'prod-5',
    source_location_id: 'loc-main-rack-a',
    destination_location_id: 'loc-partner-cust',
    quantity: 12,
    unit_cost: 120.00,
    total_value: 1440.00,
    date: '2026-02-10T15:20:00.000Z',
    user_id: 'usr-staff-1',
    user_name: 'Devon Reed'
  };

  const delMove2: StockMovement = {
    id: 'mov-del-1-2',
    reference_doc_type: 'DELIVERY',
    reference_doc_id: 'del-1',
    reference_doc_number: 'OUT-2026-0001',
    product_id: 'prod-1',
    source_location_id: 'loc-main-rack-a',
    destination_location_id: 'loc-partner-cust',
    quantity: 20,
    unit_cost: 24.50,
    total_value: 490.00,
    date: '2026-02-10T15:20:00.000Z',
    user_id: 'usr-staff-1',
    user_name: 'Devon Reed'
  };

  initialMovements.push(delMove1, delMove2);

  initialLedger.push({
    id: 'led-del-1-1',
    date: '2026-02-10T15:20:00.000Z',
    movement_id: delMove1.id,
    reference: 'OUT-2026-0001',
    product_id: 'prod-5',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-rack-a',
    type: 'OUT',
    quantity: 12,
    balance_before: 58,
    balance_after: 46,
    unit_cost: 120.00,
    notes: 'Dispatched to Vanguard Industrial Automation Ltd',
    created_at: '2026-02-10T15:20:00.000Z'
  });

  initialLedger.push({
    id: 'led-del-1-2',
    date: '2026-02-10T15:20:00.000Z',
    movement_id: delMove2.id,
    reference: 'OUT-2026-0001',
    product_id: 'prod-1',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-rack-a',
    type: 'OUT',
    quantity: 20,
    balance_before: 140,
    balance_after: 120,
    unit_cost: 24.50,
    notes: 'Dispatched to Vanguard Industrial Automation Ltd',
    created_at: '2026-02-10T15:20:00.000Z'
  });

  // Transfers
  const transfers = [
    {
      id: 'trn-1',
      reference: 'INT-2026-0001',
      source_warehouse_id: 'wh-main',
      source_location_id: 'loc-main-in',
      destination_warehouse_id: 'wh-main',
      destination_location_id: 'loc-main-rack-a',
      status: 'DONE' as const,
      scheduled_date: '2026-02-02T10:00:00.000Z',
      notes: 'Put-away from Inbound Dock to High-Bay Storage Rack A',
      lines: [
        { id: 'line-trn-1', product_id: 'prod-1', demanded_qty: 60, transferred_qty: 60 }
      ],
      created_by: 'usr-staff-1',
      created_at: '2026-02-02T09:00:00.000Z',
      validated_by: 'usr-staff-1',
      validated_at: '2026-02-02T10:30:00.000Z'
    },
    {
      id: 'trn-2',
      reference: 'INT-2026-0002',
      source_warehouse_id: 'wh-main',
      source_location_id: 'loc-main-rack-b',
      destination_warehouse_id: 'wh-prod',
      destination_location_id: 'loc-prod-rack',
      status: 'READY' as const,
      scheduled_date: '2026-09-26T14:00:00.000Z',
      notes: 'Inter-warehouse material staging for upcoming manufacturing run',
      lines: [
        { id: 'line-trn-2', product_id: 'prod-3', demanded_qty: 200, transferred_qty: 0 }
      ],
      created_by: 'usr-mgr-1',
      created_at: '2026-09-24T11:00:00.000Z'
    }
  ];

  // Transfer 1 movements: 1 OUT from source, 1 IN to dest. Total stock unchanged!
  const trnMoveOut: StockMovement = {
    id: 'mov-trn-1-out',
    reference_doc_type: 'INTERNAL_TRANSFER',
    reference_doc_id: 'trn-1',
    reference_doc_number: 'INT-2026-0001',
    product_id: 'prod-1',
    source_location_id: 'loc-main-in',
    destination_location_id: 'loc-main-rack-a',
    quantity: 60,
    unit_cost: 24.50,
    total_value: 1470.00,
    date: '2026-02-02T10:30:00.000Z',
    user_id: 'usr-staff-1',
    user_name: 'Devon Reed'
  };

  initialMovements.push(trnMoveOut);

  initialLedger.push({
    id: 'led-trn-1-out',
    date: '2026-02-02T10:30:00.000Z',
    movement_id: trnMoveOut.id,
    reference: 'INT-2026-0001',
    product_id: 'prod-1',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-in',
    type: 'OUT',
    quantity: 60,
    balance_before: 60,
    balance_after: 0,
    unit_cost: 24.50,
    notes: 'Transfer out to Rack A (Put-away)',
    created_at: '2026-02-02T10:30:00.000Z'
  });

  initialLedger.push({
    id: 'led-trn-1-in',
    date: '2026-02-02T10:30:00.000Z',
    movement_id: trnMoveOut.id,
    reference: 'INT-2026-0001',
    product_id: 'prod-1',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-rack-a',
    type: 'IN',
    quantity: 60,
    balance_before: 120, // had 140 before delivery, 120 after delivery; at this point in time it had 140
    balance_after: 200,
    unit_cost: 24.50,
    notes: 'Transfer in from Receiving Dock',
    created_at: '2026-02-02T10:30:00.000Z'
  });

  // Adjustments
  const adjustments = [
    {
      id: 'adj-1',
      reference: 'ADJ-2026-0001',
      warehouse_id: 'wh-main',
      location_id: 'loc-main-rack-a',
      reason: 'Routine Audit' as const,
      status: 'DONE' as const,
      counted_date: '2026-02-15T16:00:00.000Z',
      notes: 'Quarterly spot check on electronics bays',
      lines: [
        { id: 'line-adj-1', product_id: 'prod-2', system_qty: 37, counted_qty: 35, difference: -2, unit_cost: 38.00 }
      ],
      created_by: 'usr-admin-1',
      created_at: '2026-02-15T15:00:00.000Z',
      validated_by: 'usr-admin-1',
      validated_at: '2026-02-15T16:15:00.000Z'
    }
  ];

  const adjMove: StockMovement = {
    id: 'mov-adj-1',
    reference_doc_type: 'ADJUSTMENT',
    reference_doc_id: 'adj-1',
    reference_doc_number: 'ADJ-2026-0001',
    product_id: 'prod-2',
    source_location_id: 'loc-main-rack-a',
    destination_location_id: 'loc-main-scrap',
    quantity: 2,
    unit_cost: 38.00,
    total_value: 76.00,
    date: '2026-02-15T16:15:00.000Z',
    user_id: 'usr-admin-1',
    user_name: 'Elena Rostova'
  };

  initialMovements.push(adjMove);

  initialLedger.push({
    id: 'led-adj-1',
    date: '2026-02-15T16:15:00.000Z',
    movement_id: adjMove.id,
    reference: 'ADJ-2026-0001',
    product_id: 'prod-2',
    warehouse_id: 'wh-main',
    location_id: 'loc-main-rack-a',
    type: 'OUT',
    quantity: 2,
    balance_before: 37,
    balance_after: 35,
    unit_cost: 38.00,
    notes: 'Inventory Adjustment: Discrepancy detected during spot check',
    created_at: '2026-02-15T16:15:00.000Z'
  });

  const audit_logs: AuditLog[] = [
    {
      id: 'aud-1',
      timestamp: '2026-01-20T08:00:00.000Z',
      user_id: 'usr-admin-1',
      user_name: 'Elena Rostova',
      action: 'SYSTEM_INIT',
      entity_type: 'SYSTEM',
      entity_id: 'SYS-INIT',
      details: 'Initialized StockSense ERP database and core warehouse topology'
    },
    {
      id: 'aud-2',
      timestamp: '2026-02-01T11:15:00.000Z',
      user_id: 'usr-mgr-1',
      user_name: 'Marcus Vance',
      action: 'VALIDATE_RECEIPT',
      entity_type: 'RECEIPT',
      entity_id: 'rec-1',
      details: 'Validated Receipt REC-2026-0001 (60x MTR-STP-01, 25x PWR-24V-10A)'
    },
    {
      id: 'aud-3',
      timestamp: '2026-02-02T10:30:00.000Z',
      user_id: 'usr-staff-1',
      user_name: 'Devon Reed',
      action: 'VALIDATE_TRANSFER',
      entity_type: 'INTERNAL_TRANSFER',
      entity_id: 'trn-1',
      details: 'Validated Transfer INT-2026-0001 (60x MTR-STP-01 from Receiving to Rack A)'
    },
    {
      id: 'aud-4',
      timestamp: '2026-02-10T15:20:00.000Z',
      user_id: 'usr-staff-1',
      user_name: 'Devon Reed',
      action: 'VALIDATE_DELIVERY',
      entity_type: 'DELIVERY_ORDER',
      entity_id: 'del-1',
      details: 'Validated Delivery OUT-2026-0001 for Vanguard Industrial Automation Ltd'
    },
    {
      id: 'aud-5',
      timestamp: '2026-02-15T16:15:00.000Z',
      user_id: 'usr-admin-1',
      user_name: 'Elena Rostova',
      action: 'VALIDATE_ADJUSTMENT',
      entity_type: 'INVENTORY_ADJUSTMENT',
      entity_id: 'adj-1',
      details: 'Validated Adjustment ADJ-2026-0001 (-2 difference on SNS-OPT-04)'
    }
  ];

  return {
    users,
    warehouses,
    locations,
    categories,
    products,
    reorder_rules,
    receipts,
    deliveries,
    transfers,
    adjustments,
    stock_movements: initialMovements,
    stock_ledger: initialLedger,
    audit_logs
  };
}

export function getDB(): DBData {
  if (inMemoryDB) {
    return inMemoryDB;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDB = JSON.parse(raw);
      return inMemoryDB!;
    } catch (err) {
      console.error('Error reading DB_FILE, generating fresh seed data', err);
    }
  }

  inMemoryDB = generateSeedData();
  saveDB();
  return inMemoryDB;
}

export function saveDB(): void {
  if (!inMemoryDB) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(inMemoryDB, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

/**
 * Calculates current on-hand stock for a product at a specific location
 * Strictly follows the primary stock ledger logic:
 * sum of IN ledger entries minus sum of OUT ledger entries at that location.
 */
export function getLocationStock(productId: string, locationId: string): number {
  const db = getDB();
  let balance = 0;
  for (const entry of db.stock_ledger) {
    if (entry.product_id === productId && entry.location_id === locationId) {
      if (entry.type === 'IN') {
        balance += entry.quantity;
      } else if (entry.type === 'OUT') {
        balance -= entry.quantity;
      }
    }
  }
  return Math.max(0, balance);
}

/**
 * Calculates total company on-hand stock for a product across all internal locations.
 */
export function getCompanyStock(productId: string): number {
  const db = getDB();
  const internalLocationIds = new Set(
    db.locations.filter(l => l.type === 'internal').map(l => l.id)
  );

  let balance = 0;
  for (const entry of db.stock_ledger) {
    if (entry.product_id === productId && internalLocationIds.has(entry.location_id)) {
      if (entry.type === 'IN') {
        balance += entry.quantity;
      } else if (entry.type === 'OUT') {
        balance -= entry.quantity;
      }
    }
  }
  return Math.max(0, balance);
}

/**
 * Calculates incoming stock for a product from confirmed/ready receipts
 */
export function getIncomingStock(productId: string): number {
  const db = getDB();
  let incoming = 0;
  for (const rec of db.receipts) {
    if (rec.status === 'READY' || rec.status === 'DRAFT') {
      for (const line of rec.lines) {
        if (line.product_id === productId) {
          incoming += (line.demanded_qty - line.received_qty);
        }
      }
    }
  }
  return incoming;
}

/**
 * Calculates outgoing stock for a product from waiting/ready deliveries
 */
export function getOutgoingStock(productId: string): number {
  const db = getDB();
  let outgoing = 0;
  for (const del of db.deliveries) {
    if (del.status === 'READY' || del.status === 'WAITING' || del.status === 'DRAFT') {
      for (const line of del.lines) {
        if (line.product_id === productId) {
          outgoing += (line.demanded_qty - line.delivered_qty);
        }
      }
    }
  }
  return outgoing;
}

/**
 * Audit log helper
 */
export function logAudit(
  user: { id: string; name: string },
  action: string,
  entity_type: string,
  entity_id: string,
  details: string
): void {
  const db = getDB();
  const entry: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    user_id: user.id,
    user_name: user.name,
    action,
    entity_type,
    entity_id,
    details
  };
  db.audit_logs.unshift(entry);
  if (db.audit_logs.length > 500) {
    db.audit_logs = db.audit_logs.slice(0, 500);
  }
  saveDB();
}
