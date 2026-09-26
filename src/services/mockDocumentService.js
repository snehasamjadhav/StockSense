// StockSense ERP Document Workflow Engine
// Controls Receipts, Delivery Orders, Internal Transfers, and Inventory Adjustments
// Enforces that stock mutations ONLY occur via validated documents.

import { mockInventoryService } from './mockInventoryService.js';

class MockDocumentService {
  // --- Receipts Workflow ---
  getReceipts(filters = {}) {
    let list = [...mockInventoryService.state.receipts];
    if (filters.status && filters.status !== 'all') {
      list = list.filter(r => r.status === filters.status);
    }
    if (filters.warehouseId && filters.warehouseId !== 'all') {
      list = list.filter(r => r.warehouseId === filters.warehouseId);
    }
    return list.map(r => {
      const prod = mockInventoryService.state.products.find(p => p.id === r.productId);
      const wh = mockInventoryService.state.warehouses.find(w => w.id === r.warehouseId);
      const loc = mockInventoryService.state.locations.find(l => l.id === r.destinationLocationId);
      return {
        ...r,
        productName: prod ? prod.name : 'Unknown Product',
        warehouseName: wh ? wh.name : 'Warehouse',
        destinationName: loc ? loc.name : 'Destination'
      };
    });
  }

  createReceipt(data) {
    const ref = `REC/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === data.productId);

    const newReceipt = {
      id: `rec-${Date.now()}`,
      reference: ref,
      supplier: data.supplier || 'Industrial Logistics Corp',
      warehouseId: data.warehouseId || 'wh-main',
      destinationLocationId: data.destinationLocationId || 'loc-rec',
      productId: data.productId,
      quantity: Number(data.quantity) || 1,
      uom: data.uom || (prod ? prod.uom : 'PCS'),
      status: data.status || 'DRAFT',
      date: new Date().toISOString().substring(0, 10),
      operator: user.name,
      notes: data.notes || 'Inbound supplier delivery order'
    };

    mockInventoryService.state.receipts.unshift(newReceipt);
    mockInventoryService.addAuditLog('CREATE_RECEIPT', `RECEIPT: ${ref}`, `Created receipt order for ${newReceipt.quantity} ${newReceipt.uom} of ${prod ? prod.name : ''}`);
    mockInventoryService.save();
    return newReceipt;
  }

  updateReceiptStatus(id, newStatus) {
    const item = mockInventoryService.state.receipts.find(r => r.id === id);
    if (!item) throw new Error('Receipt not found');
    if (item.status === 'DONE') throw new Error('Validated receipt cannot be modified');
    item.status = newStatus;
    mockInventoryService.save();
    return item;
  }

  validateReceipt(id) {
    const item = mockInventoryService.state.receipts.find(r => r.id === id);
    if (!item) throw new Error('Receipt not found');
    if (item.status === 'DONE') throw new Error('Receipt has already been validated and posted');

    const prod = mockInventoryService.state.products.find(p => p.id === item.productId);
    const destLoc = mockInventoryService.state.locations.find(l => l.id === item.destinationLocationId);
    const destName = destLoc ? destLoc.name : 'Receiving';

    const beforeTotal = mockInventoryService.getProductTotalStock(item.productId);
    mockInventoryService.mutateLocationStock(item.productId, item.destinationLocationId, item.quantity);
    const afterTotal = mockInventoryService.getProductTotalStock(item.productId);

    item.status = 'DONE';

    mockInventoryService.recordLedgerEntry({
      docRef: item.reference,
      docType: 'RECEIPT',
      productId: item.productId,
      sourceName: `Supplier (${item.supplier})`,
      destName: destName,
      qtyChangeFormatted: `+${item.quantity} ${item.uom}`,
      beforeQty: beforeTotal,
      afterQty: afterTotal
    });

    mockInventoryService.addAuditLog('VALIDATE_RECEIPT', `RECEIPT: ${item.reference}`, `Posted intake of +${item.quantity} ${item.uom} of ${prod ? prod.name : 'item'} to ${destName}`);
    mockInventoryService.save();
    return item;
  }

  // --- Delivery Orders Workflow ---
  getDeliveries(filters = {}) {
    let list = [...mockInventoryService.state.deliveries];
    if (filters.status && filters.status !== 'all') {
      list = list.filter(d => d.status === filters.status);
    }
    if (filters.warehouseId && filters.warehouseId !== 'all') {
      list = list.filter(d => d.warehouseId === filters.warehouseId);
    }
    return list.map(d => {
      const prod = mockInventoryService.state.products.find(p => p.id === d.productId);
      const wh = mockInventoryService.state.warehouses.find(w => w.id === d.warehouseId);
      const loc = mockInventoryService.state.locations.find(l => l.id === d.sourceLocationId);
      return {
        ...d,
        productName: prod ? prod.name : 'Unknown Product',
        warehouseName: wh ? wh.name : 'Warehouse',
        sourceLocationName: loc ? loc.name : 'Source Location'
      };
    });
  }

  createDelivery(data) {
    const ref = `DEL/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === data.productId);

    const newDelivery = {
      id: `del-${Date.now()}`,
      reference: ref,
      customer: data.customer || 'Commercial Client',
      warehouseId: data.warehouseId || 'wh-main',
      sourceLocationId: data.sourceLocationId || 'loc-rack-a',
      productId: data.productId,
      quantity: Number(data.quantity) || 1,
      uom: data.uom || (prod ? prod.uom : 'PCS'),
      status: data.status || 'DRAFT',
      date: new Date().toISOString().substring(0, 10),
      operator: user.name,
      notes: data.notes || 'Outbound customer delivery order'
    };

    mockInventoryService.state.deliveries.unshift(newDelivery);
    mockInventoryService.addAuditLog('CREATE_DELIVERY', `DELIVERY: ${ref}`, `Created delivery order for ${newDelivery.quantity} ${newDelivery.uom} of ${prod ? prod.name : ''}`);
    mockInventoryService.save();
    return newDelivery;
  }

  updateDeliveryStatus(id, newStatus) {
    const item = mockInventoryService.state.deliveries.find(d => d.id === id);
    if (!item) throw new Error('Delivery not found');
    if (item.status === 'DONE') throw new Error('Validated delivery order cannot be modified');
    item.status = newStatus;
    mockInventoryService.save();
    return item;
  }

  validateDelivery(id) {
    const item = mockInventoryService.state.deliveries.find(d => d.id === id);
    if (!item) throw new Error('Delivery not found');
    if (item.status === 'DONE') throw new Error('Delivery order has already been validated');

    const availableAtSource = mockInventoryService.getLocationStock(item.productId, item.sourceLocationId);
    if (availableAtSource < item.quantity) {
      throw new Error(`Insufficient stock available. Required: ${item.quantity} ${item.uom}, Available at source: ${availableAtSource} ${item.uom}`);
    }

    const prod = mockInventoryService.state.products.find(p => p.id === item.productId);
    const srcLoc = mockInventoryService.state.locations.find(l => l.id === item.sourceLocationId);
    const srcName = srcLoc ? srcLoc.name : 'Warehouse Storage';

    const beforeTotal = mockInventoryService.getProductTotalStock(item.productId);
    mockInventoryService.mutateLocationStock(item.productId, item.sourceLocationId, -item.quantity);
    const afterTotal = mockInventoryService.getProductTotalStock(item.productId);

    item.status = 'DONE';

    mockInventoryService.recordLedgerEntry({
      docRef: item.reference,
      docType: 'DELIVERY',
      productId: item.productId,
      sourceName: srcName,
      destName: `Customer (${item.customer})`,
      qtyChangeFormatted: `-${item.quantity} ${item.uom}`,
      beforeQty: beforeTotal,
      afterQty: afterTotal
    });

    mockInventoryService.addAuditLog('VALIDATE_DELIVERY', `DELIVERY: ${item.reference}`, `Dispatched ${item.quantity} ${item.uom} to ${item.customer} from ${srcName}`);
    mockInventoryService.save();
    return item;
  }

  // --- Internal Transfers Workflow ---
  getTransfers(filters = {}) {
    let list = [...mockInventoryService.state.transfers];
    if (filters.status && filters.status !== 'all') {
      list = list.filter(t => t.status === filters.status);
    }
    return list.map(t => {
      const prod = mockInventoryService.state.products.find(p => p.id === t.productId);
      const srcWh = mockInventoryService.state.warehouses.find(w => w.id === t.sourceWarehouseId);
      const dstWh = mockInventoryService.state.warehouses.find(w => w.id === t.destWarehouseId);
      const srcLoc = mockInventoryService.state.locations.find(l => l.id === t.sourceLocationId);
      const dstLoc = mockInventoryService.state.locations.find(l => l.id === t.destLocationId);

      return {
        ...t,
        productName: prod ? prod.name : 'Unknown Product',
        sourceWarehouseName: srcWh ? srcWh.name : 'Source WH',
        destWarehouseName: dstWh ? dstWh.name : 'Dest WH',
        sourceLocationName: srcLoc ? srcLoc.name : 'Source Loc',
        destLocationName: dstLoc ? dstLoc.name : 'Dest Loc'
      };
    });
  }

  createTransfer(data) {
    const ref = `INT/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === data.productId);

    const newTransfer = {
      id: `int-${Date.now()}`,
      reference: ref,
      sourceWarehouseId: data.sourceWarehouseId || 'wh-main',
      sourceLocationId: data.sourceLocationId || 'loc-rec',
      destWarehouseId: data.destWarehouseId || 'wh-main',
      destLocationId: data.destLocationId || 'loc-rack-a',
      productId: data.productId,
      quantity: Number(data.quantity) || 1,
      uom: data.uom || (prod ? prod.uom : 'PCS'),
      status: data.status || 'READY',
      date: new Date().toISOString().substring(0, 10),
      operator: user.name,
      notes: data.notes || 'Internal material relocation'
    };

    mockInventoryService.state.transfers.unshift(newTransfer);
    mockInventoryService.addAuditLog('CREATE_TRANSFER', `TRANSFER: ${ref}`, `Staged transfer for ${newTransfer.quantity} ${newTransfer.uom} of ${prod ? prod.name : ''}`);
    mockInventoryService.save();
    return newTransfer;
  }

  validateTransfer(id) {
    const item = mockInventoryService.state.transfers.find(t => t.id === id);
    if (!item) throw new Error('Transfer not found');
    if (item.status === 'DONE') throw new Error('Transfer has already been completed');

    const availableAtSource = mockInventoryService.getLocationStock(item.productId, item.sourceLocationId);
    if (availableAtSource < item.quantity) {
      throw new Error(`Insufficient stock at source location. Required: ${item.quantity} ${item.uom}, Available: ${availableAtSource} ${item.uom}`);
    }

    const prod = mockInventoryService.state.products.find(p => p.id === item.productId);
    const srcLoc = mockInventoryService.state.locations.find(l => l.id === item.sourceLocationId);
    const dstLoc = mockInventoryService.state.locations.find(l => l.id === item.destLocationId);

    const totalBefore = mockInventoryService.getProductTotalStock(item.productId);

    // Dual entry mutation: Company invariant remains 0 net delta
    mockInventoryService.mutateLocationStock(item.productId, item.sourceLocationId, -item.quantity);
    mockInventoryService.mutateLocationStock(item.productId, item.destLocationId, item.quantity);

    const totalAfter = mockInventoryService.getProductTotalStock(item.productId);

    item.status = 'DONE';

    mockInventoryService.recordLedgerEntry({
      docRef: item.reference,
      docType: 'TRANSFER',
      productId: item.productId,
      sourceName: srcLoc ? srcLoc.name : 'Source Loc',
      destName: dstLoc ? dstLoc.name : 'Dest Loc',
      qtyChangeFormatted: `${item.quantity} ${item.uom}`,
      beforeQty: totalBefore,
      afterQty: totalAfter
    });

    mockInventoryService.addAuditLog('VALIDATE_TRANSFER', `TRANSFER: ${item.reference}`, `Relocated ${item.quantity} ${item.uom} of ${prod ? prod.name : ''} from ${srcLoc?.name} to ${dstLoc?.name}`);
    mockInventoryService.save();
    return item;
  }

  // --- Inventory Adjustments Workflow ---
  getAdjustments() {
    return mockInventoryService.state.adjustments.map(a => {
      const prod = mockInventoryService.state.products.find(p => p.id === a.productId);
      const wh = mockInventoryService.state.warehouses.find(w => w.id === a.warehouseId);
      const loc = mockInventoryService.state.locations.find(l => l.id === a.locationId);
      return {
        ...a,
        productName: prod ? prod.name : 'Unknown Product',
        warehouseName: wh ? wh.name : 'Warehouse',
        locationName: loc ? loc.name : 'Location'
      };
    });
  }

  createAdjustment(data) {
    const ref = `ADJ/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === data.productId);

    const systemQty = mockInventoryService.getLocationStock(data.productId, data.locationId);
    const physicalQty = Number(data.physicalQty);
    const difference = physicalQty - systemQty;

    const newAdj = {
      id: `adj-${Date.now()}`,
      reference: ref,
      warehouseId: data.warehouseId || 'wh-main',
      locationId: data.locationId || 'loc-rack-a',
      productId: data.productId,
      systemQty,
      physicalQty,
      difference,
      uom: data.uom || (prod ? prod.uom : 'PCS'),
      reason: data.reason || 'Physical cycle count discrepancy audit',
      status: 'DONE', // Adjustments validate immediately upon execution
      date: new Date().toISOString().substring(0, 10),
      operator: user.name
    };

    // Update location stock directly to physical count
    const totalBefore = mockInventoryService.getProductTotalStock(data.productId);
    if (!mockInventoryService.state.balances[data.productId]) {
      mockInventoryService.state.balances[data.productId] = {};
    }
    mockInventoryService.state.balances[data.productId][data.locationId] = physicalQty;
    const totalAfter = mockInventoryService.getProductTotalStock(data.productId);

    const loc = mockInventoryService.state.locations.find(l => l.id === data.locationId);

    mockInventoryService.state.adjustments.unshift(newAdj);

    mockInventoryService.recordLedgerEntry({
      docRef: ref,
      docType: 'ADJUSTMENT',
      productId: data.productId,
      sourceName: loc ? loc.name : 'Location',
      destName: difference < 0 ? 'Damaged Goods / Offset' : 'Inventory Found',
      qtyChangeFormatted: `${difference > 0 ? '+' : ''}${difference} ${newAdj.uom}`,
      beforeQty: totalBefore,
      afterQty: totalAfter
    });

    mockInventoryService.addAuditLog('POST_ADJUSTMENT', `ADJUSTMENT: ${ref}`, `Adjusted ${loc?.name} stock for ${prod?.name}: System=${systemQty}, Physical=${physicalQty} (Diff=${difference})`);
    mockInventoryService.save();
    return newAdj;
  }
}

export const mockDocumentService = new MockDocumentService();
