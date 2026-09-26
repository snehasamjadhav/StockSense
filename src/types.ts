export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';
  active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description: string;
  category_id: string;
  category_name?: string;
  unit_of_measure: string;
  cost_price: number;
  selling_price: number;
  weight: number;
  reorder_level: number;
  reorder_quantity: number;
  active: boolean;
  on_hand?: number;
  incoming?: number;
  outgoing?: number;
  forecast?: number;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
  total_valuation?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  parent_category_id: string | null;
  parent_name?: string | null;
  product_count?: number;
  active: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  active: boolean;
  location_count?: number;
  locations?: Location[];
}

export interface Location {
  id: string;
  warehouse_id: string;
  warehouse_name?: string;
  warehouse_code?: string;
  name: string;
  code: string;
  type: 'internal' | 'supplier' | 'customer' | 'inventory_loss';
  active: boolean;
}

export interface ReorderRule {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  warehouse_id: string;
  warehouse_name?: string;
  min_quantity: number;
  max_quantity: number;
  reorder_quantity: number;
  active: boolean;
  auto_create_receipt?: boolean;
  current_on_hand?: number;
  is_triggered?: boolean;
}

export interface ReceiptLine {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  unit_of_measure?: string;
  demanded_qty: number;
  received_qty: number;
  unit_price: number;
}

export interface Receipt {
  id: string;
  reference: string;
  supplier_name: string;
  destination_warehouse_id: string;
  destination_warehouse_name?: string;
  destination_location_id: string;
  destination_location_name?: string;
  status: 'DRAFT' | 'READY' | 'DONE' | 'CANCELLED';
  scheduled_date: string;
  notes: string;
  lines: ReceiptLine[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
  total_items?: number;
  total_value?: number;
}

export interface DeliveryLine {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  unit_of_measure?: string;
  demanded_qty: number;
  reserved_qty: number;
  delivered_qty: number;
  unit_price: number;
  available_stock_at_location?: number;
}

export interface DeliveryOrder {
  id: string;
  reference: string;
  customer_name: string;
  source_warehouse_id: string;
  source_warehouse_name?: string;
  source_location_id: string;
  source_location_name?: string;
  status: 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELLED';
  scheduled_date: string;
  notes: string;
  lines: DeliveryLine[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
  total_items?: number;
  total_value?: number;
}

export interface TransferLine {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  unit_of_measure?: string;
  demanded_qty: number;
  transferred_qty: number;
  available_at_source?: number;
}

export interface InternalTransfer {
  id: string;
  reference: string;
  source_warehouse_id: string;
  source_warehouse_name?: string;
  source_location_id: string;
  source_location_name?: string;
  destination_warehouse_id: string;
  destination_warehouse_name?: string;
  destination_location_id: string;
  destination_location_name?: string;
  status: 'DRAFT' | 'READY' | 'DONE' | 'CANCELLED';
  scheduled_date: string;
  notes: string;
  lines: TransferLine[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
  total_items?: number;
}

export interface AdjustmentLine {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
  unit_cost: number;
  value_difference?: number;
}

export interface InventoryAdjustment {
  id: string;
  reference: string;
  warehouse_id: string;
  warehouse_name?: string;
  location_id: string;
  location_name?: string;
  reason: 'Annual Physical Count' | 'Damaged Goods' | 'Theft/Loss' | 'Found Stock' | 'Routine Audit';
  status: 'DRAFT' | 'DONE' | 'CANCELLED';
  counted_date: string;
  notes: string;
  lines: AdjustmentLine[];
  created_by: string;
  created_by_name?: string;
  created_at: string;
  validated_by?: string;
  validated_at?: string;
  total_difference_qty?: number;
}

export interface StockMovement {
  id: string;
  reference_doc_type: 'RECEIPT' | 'DELIVERY' | 'INTERNAL_TRANSFER' | 'ADJUSTMENT' | 'OPENING_STOCK';
  reference_doc_id: string;
  reference_doc_number: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  unit_of_measure?: string;
  source_location_id: string;
  source_location_name?: string;
  destination_location_id: string;
  destination_location_name?: string;
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
  product_name?: string;
  product_sku?: string;
  unit_of_measure?: string;
  warehouse_id: string;
  warehouse_name?: string;
  location_id: string;
  location_name?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  balance_before: number;
  balance_after: number;
  unit_cost: number;
  total_value?: number;
  notes: string;
  user_name?: string;
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

export interface DashboardStats {
  kpis: {
    total_products_in_stock: number;
    low_stock_items: number;
    out_of_stock_items: number;
    pending_receipts: number;
    pending_deliveries: number;
    scheduled_transfers: number;
    total_inventory_valuation: number;
    incoming_units_total: number;
    outgoing_units_total: number;
  };
  low_stock_list: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    on_hand: number;
    reorder_level: number;
    reorder_quantity: number;
    cost_price: number;
    shortage: number;
  }>;
  stock_by_category: Array<{
    category_id: string;
    category_name: string;
    product_count: number;
    total_units: number;
    total_valuation: number;
  }>;
  warehouse_utilization: Array<{
    warehouse_id: string;
    warehouse_name: string;
    warehouse_code: string;
    location_count: number;
    total_units: number;
    total_valuation: number;
  }>;
  recent_operations: Array<{
    id: string;
    doc_type: string;
    reference: string;
    partner: string;
    status: string;
    date: string;
    total_items: number;
  }>;
}
