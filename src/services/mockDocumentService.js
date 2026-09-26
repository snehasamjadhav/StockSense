// StockSense ERP Document Workflow Engine
// Controls Receipts, Delivery Orders, Internal Transfers, and Inventory Adjustments
// Enforces that stock mutations ONLY occur via validated documents.

import { mockInventoryService } from './mockInventoryService.js';

class MockDocumentService {
  // --- Purchase Orders Workflow ---
  getPurchaseOrders(filters = {}) {
    let list = [...(mockInventoryService.state.purchaseOrders || [])];
    if (filters.status && filters.status !== 'all') {
      list = list.filter(po => po.status === filters.status);
    }
    if (filters.warehouseId && filters.warehouseId !== 'all') {
      list = list.filter(po => po.warehouseId === filters.warehouseId);
    }
    return list.map(po => {
      const prod = mockInventoryService.state.products.find(p => p.id === po.productId);
      const wh = mockInventoryService.state.warehouses.find(w => w.id === po.warehouseId);
      const loc = mockInventoryService.state.locations.find(l => l.id === po.destinationLocationId);
      return {
        ...po,
        productName: prod ? prod.name : 'Unknown Product',
        warehouseName: wh ? wh.name : 'Warehouse',
        destinationName: loc ? loc.name : 'Receiving'
      };
    });
  }

  createPurchaseOrder(data) {
    const ref = `PO/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === data.productId);
    const unitCost = Number(data.unitCost) || (prod ? prod.unitCost : 10);
    const qty = Number(data.quantity) || 1;

    const newPO = {
      id: `po-${Date.now()}`,
      reference: ref,
      supplier: data.supplier || 'Industrial Logistics Corp',
      warehouseId: data.warehouseId || 'wh-main',
      destinationLocationId: data.destinationLocationId || 'loc-rec',
      productId: data.productId,
      quantity: qty,
      uom: data.uom || (prod ? prod.uom : 'PCS'),
      unitCost: unitCost,
      totalAmount: unitCost * qty,
      status: data.status || 'CONFIRMED',
      date: new Date().toISOString().substring(0, 10),
      expectedDate: data.expectedDate || new Date(Date.now() + 4 * 86400000).toISOString().substring(0, 10),
      operator: user.name,
      notes: data.notes || 'Procurement replenishment requisition'
    };

    if (!mockInventoryService.state.purchaseOrders) {
      mockInventoryService.state.purchaseOrders = [];
    }
    mockInventoryService.state.purchaseOrders.unshift(newPO);
    mockInventoryService.addAuditLog('CREATE_PO', `PO: ${ref}`, `Created purchase order for ${newPO.quantity} ${newPO.uom} from ${newPO.supplier}`);
    mockInventoryService.save();
    return newPO;
  }

  updatePurchaseOrderStatus(id, newStatus) {
    const item = (mockInventoryService.state.purchaseOrders || []).find(p => p.id === id);
    if (!item) throw new Error('Purchase order not found');
    if (item.status === 'RECEIVED') throw new Error('Fulfilled purchase order cannot be modified');
    item.status = newStatus;
    mockInventoryService.save();
    return item;
  }

  receivePurchaseOrder(id) {
    const po = (mockInventoryService.state.purchaseOrders || []).find(p => p.id === id);
    if (!po) throw new Error('Purchase order not found');
    if (po.status === 'RECEIVED') throw new Error('PO has already been received');
    if (po.status === 'CANCELED') throw new Error('Cannot receive a canceled PO');

    // 1. Create Receipt linked to this PO
    const receipt = this.createReceipt({
      supplier: po.supplier,
      warehouseId: po.warehouseId,
      destinationLocationId: po.destinationLocationId,
      productId: po.productId,
      quantity: po.quantity,
      uom: po.uom,
      status: 'READY',
      notes: `Inbound receipt automatically generated from ${po.reference}`
    });

    // 2. Validate receipt so inventory is directly posted into ledger & receiving bay
    this.validateReceipt(receipt.id);

    // 3. Mark PO as RECEIVED
    po.status = 'RECEIVED';
    po.linkedReceiptRef = receipt.reference;
    mockInventoryService.addAuditLog('FULFILL_PO', `PO: ${po.reference}`, `Fulfilled PO via receipt ${receipt.reference}`);
    mockInventoryService.save();

    return { po, receipt };
  }

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
    if (filters.routeType && filters.routeType !== 'all') {
      list = list.filter(t => (t.routeType || 'DIRECT') === filters.routeType);
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
    const isMulti = data.routeType === 'MULTI_STEP';
    const ref = `${isMulti ? 'TRF' : 'INT'}/2026/${Math.floor(1000 + Math.random() * 9000)}`;
    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === data.productId);
    const srcWh = mockInventoryService.state.warehouses.find(w => w.id === data.sourceWarehouseId);
    const dstWh = mockInventoryService.state.warehouses.find(w => w.id === data.destWarehouseId);
    const srcLoc = mockInventoryService.state.locations.find(l => l.id === data.sourceLocationId);
    const dstLoc = mockInventoryService.state.locations.find(l => l.id === data.destLocationId);

    const newTransfer = {
      id: `int-${Date.now()}`,
      reference: ref,
      routeType: data.routeType || 'DIRECT',
      sourceWarehouseId: data.sourceWarehouseId || 'wh-main',
      sourceLocationId: data.sourceLocationId || 'loc-rec',
      destWarehouseId: data.destWarehouseId || 'wh-main',
      destLocationId: data.destLocationId || 'loc-rack-a',
      productId: data.productId,
      quantity: Number(data.quantity) || 1,
      uom: data.uom || (prod ? prod.uom : 'PCS'),
      status: 'READY',
      currentStep: 1,
      carrier: data.carrier || (isMulti ? 'Global Freight Express (Truck #GT-202)' : 'Internal Handling'),
      trackingNumber: data.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      steps: isMulti ? [
        { step: 1, name: 'Pick & Outbound Freight Dispatch', location: `${srcLoc?.name || 'Source'} -> In-Transit Fleet`, status: 'PENDING', timestamp: null, operator: null },
        { step: 2, name: 'Destination Arrival & Dock Staging', location: `In-Transit Fleet -> ${dstWh?.name || 'Dest'} Staging`, status: 'PENDING', timestamp: null, operator: null },
        { step: 3, name: 'Final Putaway to Bin Location', location: `${dstWh?.name || 'Dest'} Staging -> ${dstLoc?.name || 'Target Bin'}`, status: 'PENDING', timestamp: null, operator: null }
      ] : null,
      date: new Date().toISOString().substring(0, 10),
      operator: user.name,
      notes: data.notes || (isMulti ? 'Multi-step inter-facility transport route' : 'Internal material relocation')
    };

    mockInventoryService.state.transfers.unshift(newTransfer);
    mockInventoryService.addAuditLog('CREATE_TRANSFER', `TRANSFER: ${ref}`, `Initiated ${newTransfer.routeType} transfer for ${newTransfer.quantity} ${newTransfer.uom} of ${prod ? prod.name : ''}`);
    mockInventoryService.save();
    return newTransfer;
  }

  advanceMultiStepTransfer(id) {
    const item = mockInventoryService.state.transfers.find(t => t.id === id);
    if (!item) throw new Error('Transfer not found');
    if (item.status === 'DONE') throw new Error('Transfer is already fully completed');

    const user = mockInventoryService.getCurrentUser();
    const prod = mockInventoryService.state.products.find(p => p.id === item.productId);
    const srcLoc = mockInventoryService.state.locations.find(l => l.id === item.sourceLocationId);
    const dstLoc = mockInventoryService.state.locations.find(l => l.id === item.destLocationId);
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Step 1: Pick and dispatch to In-Transit
    if (item.currentStep === 1) {
      const available = mockInventoryService.getLocationStock(item.productId, item.sourceLocationId);
      if (available < item.quantity) {
        throw new Error(`Insufficient stock at ${srcLoc?.name || 'source'}. Required: ${item.quantity}, Available: ${available}`);
      }

      const totalBefore = mockInventoryService.getProductTotalStock(item.productId);
      mockInventoryService.mutateLocationStock(item.productId, item.sourceLocationId, -item.quantity);
      mockInventoryService.mutateLocationStock(item.productId, 'loc-transit', item.quantity);
      const totalAfter = mockInventoryService.getProductTotalStock(item.productId);

      item.steps[0].status = 'COMPLETED';
      item.steps[0].timestamp = nowTime;
      item.steps[0].operator = user.name;
      item.currentStep = 2;
      item.status = 'IN_TRANSIT';

      mockInventoryService.recordLedgerEntry({
        docRef: item.reference,
        docType: 'TRANSFER',
        productId: item.productId,
        sourceName: `${srcLoc?.name} (Outbound)`,
        destName: 'In-Transit Freight Corridor',
        qtyChangeFormatted: `-${item.quantity} ${item.uom} / +${item.quantity} ${item.uom}`,
        beforeQty: totalBefore,
        afterQty: totalAfter
      });

      mockInventoryService.addAuditLog('DISPATCH_TRANSIT', `TRANSFER: ${item.reference}`, `Step 1/3 Complete: Picked and dispatched ${item.quantity} ${item.uom} to freight carrier ${item.carrier}`);
      mockInventoryService.save();
      return item;
    }

    // Step 2: Intake from In-Transit into Staging Dock
    if (item.currentStep === 2) {
      const totalBefore = mockInventoryService.getProductTotalStock(item.productId);
      mockInventoryService.mutateLocationStock(item.productId, 'loc-transit', -item.quantity);
      mockInventoryService.mutateLocationStock(item.productId, 'loc-staging', item.quantity);
      const totalAfter = mockInventoryService.getProductTotalStock(item.productId);

      item.steps[1].status = 'COMPLETED';
      item.steps[1].timestamp = nowTime;
      item.steps[1].operator = user.name;
      item.currentStep = 3;
      item.status = 'STAGED';

      mockInventoryService.recordLedgerEntry({
        docRef: item.reference,
        docType: 'TRANSFER',
        productId: item.productId,
        sourceName: 'In-Transit Freight Corridor',
        destName: 'Destination Dock Staging Bay',
        qtyChangeFormatted: `${item.quantity} ${item.uom}`,
        beforeQty: totalBefore,
        afterQty: totalAfter
      });

      mockInventoryService.addAuditLog('RECEIVE_STAGING', `TRANSFER: ${item.reference}`, `Step 2/3 Complete: Received freight at destination dock staging bay`);
      mockInventoryService.save();
      return item;
    }

    // Step 3: Final Putaway to target Rack/Bin
    if (item.currentStep === 3) {
      const totalBefore = mockInventoryService.getProductTotalStock(item.productId);
      mockInventoryService.mutateLocationStock(item.productId, 'loc-staging', -item.quantity);
      mockInventoryService.mutateLocationStock(item.productId, item.destLocationId, item.quantity);
      const totalAfter = mockInventoryService.getProductTotalStock(item.productId);

      item.steps[2].status = 'COMPLETED';
      item.steps[2].timestamp = nowTime;
      item.steps[2].operator = user.name;
      item.status = 'DONE';

      mockInventoryService.recordLedgerEntry({
        docRef: item.reference,
        docType: 'TRANSFER',
        productId: item.productId,
        sourceName: 'Destination Dock Staging Bay',
        destName: `${dstLoc?.name} (Final Bin)`,
        qtyChangeFormatted: `${item.quantity} ${item.uom}`,
        beforeQty: totalBefore,
        afterQty: totalAfter
      });

      mockInventoryService.addAuditLog('PUTAWAY_COMPLETE', `TRANSFER: ${item.reference}`, `Step 3/3 Complete: Completed final putaway of ${item.quantity} ${item.uom} into ${dstLoc?.name}`);
      mockInventoryService.save();
      return item;
    }

    return item;
  }

  validateTransfer(id) {
    const item = mockInventoryService.state.transfers.find(t => t.id === id);
    if (!item) throw new Error('Transfer not found');
    if (item.status === 'DONE') throw new Error('Transfer has already been completed');

    if (item.routeType === 'MULTI_STEP') {
      return this.advanceMultiStepTransfer(id);
    }

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

  // --- Universal Barcode & QR Scanner Search Engine ---
  searchBarcode(rawCode) {
    if (!rawCode || !rawCode.trim()) return null;
    const q = rawCode.trim().toUpperCase();

    // 1. Check Products (by SKU, ID, or Name)
    const product = mockInventoryService.state.products.find(
      p => p.sku.toUpperCase() === q || p.id.toUpperCase() === q || p.name.toUpperCase().includes(q)
    );
    if (product) {
      const balances = mockInventoryService.getProductLocationBreakdown(product.id);
      const totalStock = mockInventoryService.getProductTotalStock(product.id);
      return {
        type: 'PRODUCT',
        title: product.name,
        subtitle: `SKU: ${product.sku} · Category: ${product.categoryName}`,
        reference: product.sku,
        data: {
          product,
          totalStock,
          balances
        }
      };
    }

    // 2. Check Purchase Orders
    const po = (mockInventoryService.state.purchaseOrders || []).find(
      p => p.reference.toUpperCase() === q || p.id.toUpperCase() === q
    );
    if (po) {
      const prod = mockInventoryService.state.products.find(p => p.id === po.productId);
      return {
        type: 'DOCUMENT',
        docType: 'PURCHASE_ORDER',
        title: `Purchase Order ${po.reference}`,
        subtitle: `Vendor: ${po.supplier} · Status: ${po.status}`,
        reference: po.reference,
        data: { ...po, productName: prod?.name }
      };
    }

    // 3. Check Receipts
    const receipt = mockInventoryService.state.receipts.find(
      r => r.reference.toUpperCase() === q || r.id.toUpperCase() === q
    );
    if (receipt) {
      const prod = mockInventoryService.state.products.find(p => p.id === receipt.productId);
      return {
        type: 'DOCUMENT',
        docType: 'RECEIPT',
        title: `Inbound Receipt ${receipt.reference}`,
        subtitle: `Supplier: ${receipt.supplier} · Status: ${receipt.status}`,
        reference: receipt.reference,
        data: { ...receipt, productName: prod?.name }
      };
    }

    // 4. Check Deliveries
    const del = mockInventoryService.state.deliveries.find(
      d => d.reference.toUpperCase() === q || d.id.toUpperCase() === q
    );
    if (del) {
      const prod = mockInventoryService.state.products.find(p => p.id === del.productId);
      return {
        type: 'DOCUMENT',
        docType: 'DELIVERY',
        title: `Delivery Order ${del.reference}`,
        subtitle: `Customer: ${del.customer} · Status: ${del.status}`,
        reference: del.reference,
        data: { ...del, productName: prod?.name }
      };
    }

    // 5. Check Transfers
    const trf = mockInventoryService.state.transfers.find(
      t => t.reference.toUpperCase() === q || t.id.toUpperCase() === q
    );
    if (trf) {
      const prod = mockInventoryService.state.products.find(p => p.id === trf.productId);
      return {
        type: 'DOCUMENT',
        docType: 'TRANSFER',
        title: `Internal Transfer ${trf.reference}`,
        subtitle: `Type: ${trf.routeType || 'DIRECT'} · Status: ${trf.status}`,
        reference: trf.reference,
        data: { ...trf, productName: prod?.name }
      };
    }

    // 6. Check Locations
    const loc = mockInventoryService.state.locations.find(
      l => l.code.toUpperCase() === q || l.id.toUpperCase() === q || l.name.toUpperCase().includes(q)
    );
    if (loc) {
      const wh = mockInventoryService.state.warehouses.find(w => w.id === loc.warehouseId);
      const itemsInLoc = mockInventoryService.state.products.map(p => {
        const qty = mockInventoryService.getLocationStock(p.id, loc.id);
        return { product: p, quantity: qty };
      }).filter(i => i.quantity > 0);

      return {
        type: 'LOCATION',
        title: `Location: ${loc.name} (${loc.code})`,
        subtitle: `Warehouse: ${wh?.name || 'Facility'} · Type: ${loc.type}`,
        reference: loc.code,
        data: { loc, warehouse: wh, items: itemsInLoc }
      };
    }

    return {
      type: 'NOT_FOUND',
      title: 'Barcode / Code Not Recognized',
      subtitle: `No matching product SKU, document reference, or location bin code found for "${rawCode}"`,
      reference: rawCode,
      data: null
    };
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
