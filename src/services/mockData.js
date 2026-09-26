// StockSense ERP Mock Data Layer

export const INITIAL_PERSONAS = [
  {
    id: 'user-admin',
    name: 'Elena Rostova',
    role: 'ADMIN',
    email: 'elena.rostova@stocksense.erp',
    avatar: 'ER',
    department: 'Supply Chain Operations',
    lastLogin: '2026-09-26 08:30 AM'
  },
  {
    id: 'user-manager',
    name: 'Marcus Vance',
    role: 'INVENTORY MANAGER',
    email: 'marcus.vance@stocksense.erp',
    avatar: 'MV',
    department: 'Inventory Control',
    lastLogin: '2026-09-26 09:12 AM'
  },
  {
    id: 'user-staff',
    name: 'Devon Reed',
    role: 'WAREHOUSE STAFF',
    email: 'devon.reed@stocksense.erp',
    avatar: 'DR',
    department: 'Warehouse Logistics',
    lastLogin: '2026-09-26 07:45 AM'
  }
];

export const INITIAL_WAREHOUSES = [
  {
    id: 'wh-main',
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    address: '104 Logistics Parkway, Industrial Zone East',
    locations: ['loc-rec', 'loc-rack-a', 'loc-rack-b', 'loc-disp', 'loc-dmg']
  },
  {
    id: 'wh-prod',
    name: 'Production Warehouse',
    code: 'WH-PROD',
    address: '42 Assembly Blvd, Sector 7',
    locations: ['loc-prod-rack', 'loc-fg']
  }
];

export const INITIAL_LOCATIONS = [
  { id: 'loc-rec', warehouseId: 'wh-main', name: 'Receiving', code: 'REC-01', type: 'receiving', description: 'Inbound shipment intake bay' },
  { id: 'loc-rack-a', warehouseId: 'wh-main', name: 'Rack A', code: 'RACK-A', type: 'internal', description: 'Heavy materials raw storage' },
  { id: 'loc-rack-b', warehouseId: 'wh-main', name: 'Rack B', code: 'RACK-B', type: 'internal', description: 'Components & assemblies' },
  { id: 'loc-disp', warehouseId: 'wh-main', name: 'Dispatch', code: 'DISP-01', type: 'dispatch', description: 'Outbound customer staging' },
  { id: 'loc-dmg', warehouseId: 'wh-main', name: 'Damaged Goods', code: 'DMG-01', type: 'damaged', description: 'Scrap & discrepancy quarantine' },
  { id: 'loc-prod-rack', warehouseId: 'wh-prod', name: 'Production Rack', code: 'PRD-RACK', type: 'internal', description: 'Work-in-progress floor stock' },
  { id: 'loc-fg', warehouseId: 'wh-prod', name: 'Finished Goods', code: 'FG-01', type: 'internal', description: 'Packaged stock ready for fulfillment' },
  // Virtual external partners
  { id: 'loc-transit', warehouseId: 'virtual', name: 'In-Transit Fleet / Virtual Corridor', code: 'TR-TRANSIT', type: 'transit', description: 'Materials in logistics transit between facilities' },
  { id: 'loc-staging', warehouseId: 'wh-main', name: 'Dock Staging Bay', code: 'STG-01', type: 'internal', description: 'Outbound/Inbound staging dock' },
  { id: 'loc-supplier', warehouseId: 'virtual', name: 'Supplier Partner', code: 'SUPPLIER', type: 'supplier', description: 'External vendor source' },
  { id: 'loc-customer', warehouseId: 'virtual', name: 'Customer Outbound', code: 'CUSTOMER', type: 'customer', description: 'Client dispatch destination' },
  { id: 'loc-loss', warehouseId: 'virtual', name: 'Inventory Adjustment Loss', code: 'LOSS-ADJ', type: 'inventory_loss', description: 'Inventory cycle count offset' }
];

export const INITIAL_CATEGORIES = [
  { id: 'cat-raw', name: 'Raw Materials', code: 'RAW', count: 3, description: 'Base metals, plastics, and lumber' },
  { id: 'cat-fg', name: 'Finished Goods', code: 'FG', count: 3, description: 'Completed commercial products ready for sale' },
  { id: 'cat-pack', name: 'Packaging', code: 'PACK', count: 1, description: 'Boxes, foam, wrap, and pallets' },
  { id: 'cat-cons', name: 'Consumables', code: 'CONS', count: 1, description: 'Shop supplies, fasteners, and grease' }
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-steel',
    name: 'Steel Rod',
    sku: 'STEEL-001',
    categoryId: 'cat-raw',
    categoryName: 'Raw Materials',
    uom: 'KG',
    unitCost: 12.50,
    minStock: 20,
    maxStock: 200,
    reorderQty: 100,
    description: 'High tensile structural grade 1018 steel rod (20mm dia)'
  },
  {
    id: 'prod-al',
    name: 'Aluminum Sheet',
    sku: 'AL-001',
    categoryId: 'cat-raw',
    categoryName: 'Raw Materials',
    uom: 'KG',
    unitCost: 24.00,
    minStock: 15,
    maxStock: 80,
    reorderQty: 40,
    description: 'Aircraft grade 6061-T6 aluminum sheet 2mm thickness'
  },
  {
    id: 'prod-wood',
    name: 'Wood Panel',
    sku: 'WOOD-001',
    categoryId: 'cat-raw',
    categoryName: 'Raw Materials',
    uom: 'PCS',
    unitCost: 35.00,
    minStock: 20,
    maxStock: 120,
    reorderQty: 50,
    description: 'Birch ply premium core 4x8ft 18mm'
  },
  {
    id: 'prod-frame',
    name: 'Steel Frame',
    sku: 'FRM-001',
    categoryId: 'cat-fg',
    categoryName: 'Finished Goods',
    uom: 'PCS',
    unitCost: 120.00,
    minStock: 10,
    maxStock: 60,
    reorderQty: 25,
    description: 'Powder-coated ergonomic desk underframe chassis'
  },
  {
    id: 'prod-chair',
    name: 'Office Chair',
    sku: 'CHR-001',
    categoryId: 'cat-fg',
    categoryName: 'Finished Goods',
    uom: 'PCS',
    unitCost: 85.00,
    minStock: 15,
    maxStock: 80,
    reorderQty: 30,
    description: 'High-back mesh ergonomic lumbar executive chair'
  },
  {
    id: 'prod-table',
    name: 'Work Table',
    sku: 'TBL-001',
    categoryId: 'cat-fg',
    categoryName: 'Finished Goods',
    uom: 'PCS',
    unitCost: 210.00,
    minStock: 10,
    maxStock: 40,
    reorderQty: 15,
    description: 'Heavy duty modular workstation with motorized height adjust'
  },
  {
    id: 'prod-box',
    name: 'Packaging Box',
    sku: 'BOX-001',
    categoryId: 'cat-pack',
    categoryName: 'Packaging',
    uom: 'PCS',
    unitCost: 1.20,
    minStock: 100,
    maxStock: 1200,
    reorderQty: 500,
    description: 'Double-walled heavy corrugated shipping carton (24x18x18)'
  }
];

// Location stocks: maps { [productId]: { [locationId]: quantity } }
export const INITIAL_STOCK_BALANCES = {
  'prod-steel': {
    'loc-rec': 0,
    'loc-rack-a': 0,
    'loc-rack-b': 0,
    'loc-disp': 0,
    'loc-dmg': 0
  },
  'prod-al': {
    'loc-rec': 0,
    'loc-rack-a': 8,
    'loc-rack-b': 0,
    'loc-disp': 0,
    'loc-dmg': 0
  },
  'prod-wood': {
    'loc-rec': 0,
    'loc-rack-a': 45,
    'loc-rack-b': 0,
    'loc-disp': 0,
    'loc-dmg': 0
  },
  'prod-frame': {
    'loc-rec': 0,
    'loc-rack-a': 0,
    'loc-rack-b': 12,
    'loc-fg': 18
  },
  'prod-chair': {
    'loc-rec': 0,
    'loc-fg': 25
  },
  'prod-table': {
    'loc-rec': 0,
    'loc-fg': 14
  },
  'prod-box': {
    'loc-rec': 0,
    'loc-rack-b': 420
  }
};

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'po-001',
    reference: 'PO/2026/0101',
    supplier: 'Global Metallics Ltd',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: 'prod-steel',
    quantity: 150,
    uom: 'KG',
    unitCost: 12.50,
    totalAmount: 1875.00,
    status: 'CONFIRMED',
    date: '2026-09-24',
    expectedDate: '2026-09-28',
    operator: 'Elena Rostova',
    notes: 'Bulk raw steel replenishment requisition'
  },
  {
    id: 'po-002',
    reference: 'PO/2026/0102',
    supplier: 'Apex Alloys Corp',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: 'prod-al',
    quantity: 60,
    uom: 'KG',
    unitCost: 24.00,
    totalAmount: 1440.00,
    status: 'DRAFT',
    date: '2026-09-25',
    expectedDate: '2026-09-30',
    operator: 'Marcus Vance',
    notes: 'Low stock safety reorder batch'
  },
  {
    id: 'po-003',
    reference: 'PO/2026/0099',
    supplier: 'EcoPack Industrial',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: 'prod-box',
    quantity: 500,
    uom: 'PCS',
    unitCost: 1.20,
    totalAmount: 600.00,
    status: 'RECEIVED',
    date: '2026-09-20',
    expectedDate: '2026-09-23',
    operator: 'Elena Rostova',
    notes: 'Quarterly packaging restock fulfilled'
  }
];

export const INITIAL_RECEIPTS = [
  {
    id: 'rec-001',
    reference: 'REC/2026/0001',
    supplier: 'Global Metallics Ltd',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: 'prod-steel',
    quantity: 100,
    uom: 'KG',
    status: 'DONE',
    date: '2026-09-24',
    operator: 'Marcus Vance',
    notes: 'Inbound PO-4481 inspection verified'
  },
  {
    id: 'rec-002',
    reference: 'REC/2026/0002',
    supplier: 'Apex Alloys Corp',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: 'prod-al',
    quantity: 50,
    uom: 'KG',
    status: 'READY',
    date: '2026-09-25',
    operator: 'Devon Reed',
    notes: 'Awaiting unloading ramp assignment'
  },
  {
    id: 'rec-003',
    reference: 'REC/2026/0003',
    supplier: 'EcoPack Industrial',
    warehouseId: 'wh-main',
    destinationLocationId: 'loc-rec',
    productId: 'prod-box',
    quantity: 500,
    uom: 'PCS',
    status: 'DRAFT',
    date: '2026-09-26',
    operator: 'Elena Rostova',
    notes: 'Scheduled replenishment batch'
  }
];

export const INITIAL_DELIVERIES = [
  {
    id: 'del-001',
    reference: 'DEL/2026/0001',
    customer: 'Apex Manufacturing',
    warehouseId: 'wh-main',
    sourceLocationId: 'loc-rack-a',
    productId: 'prod-wood',
    quantity: 10,
    uom: 'PCS',
    status: 'DONE',
    date: '2026-09-24',
    operator: 'Marcus Vance',
    notes: 'Priority contract batch release'
  },
  {
    id: 'del-002',
    reference: 'DEL/2026/0002',
    customer: 'Metro Works Ltd',
    warehouseId: 'wh-prod',
    sourceLocationId: 'loc-fg',
    productId: 'prod-chair',
    quantity: 5,
    uom: 'PCS',
    status: 'READY',
    date: '2026-09-25',
    operator: 'Devon Reed',
    notes: 'Ready for carrier dispatch'
  }
];

export const INITIAL_TRANSFERS = [
  {
    id: 'int-001',
    reference: 'INT/2026/0001',
    routeType: 'DIRECT',
    sourceWarehouseId: 'wh-main',
    sourceLocationId: 'loc-rec',
    destWarehouseId: 'wh-main',
    destLocationId: 'loc-rack-a',
    productId: 'prod-wood',
    quantity: 45,
    uom: 'PCS',
    status: 'DONE',
    date: '2026-09-23',
    operator: 'Devon Reed',
    notes: 'Staged receiving to primary heavy rack'
  },
  {
    id: 'int-002',
    reference: 'INT/2026/0002',
    routeType: 'DIRECT',
    sourceWarehouseId: 'wh-prod',
    sourceLocationId: 'loc-prod-rack',
    destWarehouseId: 'wh-prod',
    destLocationId: 'loc-fg',
    productId: 'prod-frame',
    quantity: 18,
    uom: 'PCS',
    status: 'DONE',
    date: '2026-09-24',
    operator: 'Marcus Vance',
    notes: 'Assembly line completion to finished inventory'
  },
  {
    id: 'int-003',
    reference: 'TRF/2026/0105',
    routeType: 'MULTI_STEP',
    sourceWarehouseId: 'wh-main',
    sourceLocationId: 'loc-rack-a',
    destWarehouseId: 'wh-prod',
    destLocationId: 'loc-fg',
    productId: 'prod-steel',
    quantity: 25,
    uom: 'KG',
    status: 'IN_TRANSIT',
    currentStep: 2,
    carrier: 'Apex Logistics Freight Line (Truck #FL-108)',
    trackingNumber: 'TRK-994821',
    steps: [
      { step: 1, name: 'Pick & Outbound Freight Dispatch', location: 'Rack A -> In-Transit Fleet', status: 'COMPLETED', timestamp: '2026-09-25 09:30', operator: 'Devon Reed' },
      { step: 2, name: 'Destination Arrival & Dock Staging', location: 'In-Transit Fleet -> Production Staging', status: 'PENDING', timestamp: null, operator: null },
      { step: 3, name: 'Final Putaway to Finished Goods Bin', location: 'Production Staging -> Finished Goods', status: 'PENDING', timestamp: null, operator: null }
    ],
    date: '2026-09-25',
    operator: 'Devon Reed',
    notes: 'Priority multi-warehouse raw material replenishment'
  }
];

export const INITIAL_ADJUSTMENTS = [
  {
    id: 'adj-001',
    reference: 'ADJ/2026/0001',
    warehouseId: 'wh-main',
    locationId: 'loc-rack-a',
    productId: 'prod-al',
    systemQty: 10,
    physicalQty: 8,
    difference: -2,
    uom: 'KG',
    reason: 'Corner shear trimming waste discrepancy',
    status: 'DONE',
    date: '2026-09-24',
    operator: 'Marcus Vance'
  }
];

export const INITIAL_LEDGER = [
  {
    id: 'led-1',
    date: '2026-09-23 09:15',
    documentRef: 'REC/2026/0000',
    docType: 'RECEIPT',
    productId: 'prod-wood',
    productName: 'Wood Panel',
    source: 'Supplier (TimberCore)',
    destination: 'Receiving',
    quantityChange: '+55 PCS',
    beforeQty: 0,
    afterQty: 55,
    operator: 'Marcus Vance'
  },
  {
    id: 'led-2',
    date: '2026-09-23 11:30',
    documentRef: 'INT/2026/0001',
    docType: 'TRANSFER',
    productId: 'prod-wood',
    productName: 'Wood Panel',
    source: 'Receiving',
    destination: 'Rack A',
    quantityChange: '45 PCS',
    beforeQty: 55,
    afterQty: 55,
    operator: 'Devon Reed'
  },
  {
    id: 'led-3',
    date: '2026-09-24 14:10',
    documentRef: 'DEL/2026/0001',
    docType: 'DELIVERY',
    productId: 'prod-wood',
    productName: 'Wood Panel',
    source: 'Rack A',
    destination: 'Customer (Apex Mfg)',
    quantityChange: '-10 PCS',
    beforeQty: 55,
    afterQty: 45,
    operator: 'Marcus Vance'
  },
  {
    id: 'led-4',
    date: '2026-09-24 16:45',
    documentRef: 'ADJ/2026/0001',
    docType: 'ADJUSTMENT',
    productId: 'prod-al',
    productName: 'Aluminum Sheet',
    source: 'Rack A',
    destination: 'Damaged Goods / Scrap',
    quantityChange: '-2 KG',
    beforeQty: 10,
    afterQty: 8,
    operator: 'Marcus Vance'
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud-1',
    timestamp: '2026-09-26 09:12:44',
    user: 'Marcus Vance',
    action: 'SESSION_START',
    entity: 'AUTH',
    details: 'User authenticated with role INVENTORY_MANAGER'
  },
  {
    id: 'aud-2',
    timestamp: '2026-09-25 15:40:12',
    user: 'Devon Reed',
    action: 'VALIDATE_TRANSFER',
    entity: 'TRANSFER: INT/2026/0002',
    details: 'Moved 18 PCS Steel Frame from Production Rack to Finished Goods'
  },
  {
    id: 'aud-3',
    timestamp: '2026-09-24 16:45:00',
    user: 'Marcus Vance',
    action: 'POST_ADJUSTMENT',
    entity: 'ADJUSTMENT: ADJ/2026/0001',
    details: 'Cycle count discrepancy on Aluminum Sheet (-2 KG)'
  },
  {
    id: 'aud-4',
    timestamp: '2026-09-24 14:10:22',
    user: 'Marcus Vance',
    action: 'VALIDATE_DELIVERY',
    entity: 'DELIVERY: DEL/2026/0001',
    details: 'Dispatched 10 PCS Wood Panel to customer Apex Manufacturing'
  }
];
