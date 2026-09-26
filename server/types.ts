import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';
  active: boolean;
  avatar_url?: string;
  created_at: string;
  reset_otp?: string;
  reset_otp_expires_at?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  active: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  warehouse_id: string;
  name: string;
  code: string;
  type: 'internal' | 'supplier' | 'customer' | 'inventory_loss';
  active: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  parent_category_id: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  category_id: string;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  weight: number;
  reorder_level: number;
  reorder_quantity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ReorderRule {
  id: string;
  product_id: string;
  warehouse_id: string;
  min_quantity: number;
  max_quantity: number;
  reorder_quantity: number;
  active: boolean;
  auto_create_receipt?: boolean;
}

export interface ReceiptLine {
  id: string;
  product_id: string;
  demanded_qty: number;
  received_qty: number;
  unit_price: number;
}

export interface Receipt {
  id: string;
  reference: string;
  supplier_name: string;
  destination_warehouse_id: string;
  destination_location_id: string;
  status: 'DRAFT' | 'READY' | 'DONE' | 'CANCELLED';
  scheduled_date: string;
  notes: string;
  lines: ReceiptLine[];
  created_by: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
}

export interface DeliveryLine {
  id: string;
  product_id: string;
  demanded_qty: number;
  reserved_qty: number;
  delivered_qty: number;
  unit_price: number;
}

export interface DeliveryOrder {
  id: string;
  reference: string;
  customer_name: string;
  source_warehouse_id: string;
  source_location_id: string;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELLED';
  scheduled_date: string;
  notes: string;
  lines: DeliveryLine[];
  created_by: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
}

export interface TransferLine {
  id: string;
  product_id: string;
  demanded_qty: number;
  transferred_qty: number;
}

export interface InternalTransfer {
  id: string;
  reference: string;
  source_warehouse_id: string;
  source_location_id: string;
  destination_warehouse_id: string;
  destination_location_id: string;
  status: 'DRAFT' | 'READY' | 'DONE' | 'CANCELLED';
  scheduled_date: string;
  notes: string;
  lines: TransferLine[];
  created_by: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
}

export interface AdjustmentLine {
  id: string;
  product_id: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
  unit_cost: number;
}

export interface InventoryAdjustment {
  id: string;
  reference: string;
  warehouse_id: string;
  location_id: string;
  reason: 'Annual Physical Count' | 'Damaged Goods' | 'Theft/Loss' | 'Found Stock' | 'Routine Audit';
  status: 'DRAFT' | 'DONE' | 'CANCELLED';
  counted_date: string;
  notes: string;
  lines: AdjustmentLine[];
  created_by: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
}

export interface StockMovement {
  id: string;
  reference_doc_type: 'RECEIPT' | 'DELIVERY' | 'INTERNAL_TRANSFER' | 'ADJUSTMENT' | 'OPENING_STOCK';
  reference_doc_id: string;
  reference_doc_number: string;
  product_id: string;
  source_location_id: string;
  destination_location_id: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  date: string;
  user_id: string;
  user_name: string;
}

export interface StockLedgerEntry {
  id: string;
  date: string;
  movement_id: string;
  reference: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  balance_before: number;
  balance_after: number;
  unit_cost: number;
  notes: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
}

export interface DBData {
  users: User[];
  warehouses: Warehouse[];
  locations: Location[];
  categories: ProductCategory[];
  products: Product[];
  reorder_rules: ReorderRule[];
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  adjustments: InventoryAdjustment[];
  stock_movements: StockMovement[];
  stock_ledger: StockLedgerEntry[];
  audit_logs: AuditLog[];
}
