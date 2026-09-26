// Inventory Valuation Engine: Moving Average, FIFO, and LIFO
// Simulates accurate costing layers based on historical receipt records & current stock

export function calculateValuation(products, receipts, method = 'MOVING_AVG') {
  return products.map(prod => {
    const onHand = prod.stock || 0;
    const baseCost = prod.unitCost || 10.00;

    // Filter validated receipts for this product
    const prodReceipts = (receipts || [])
      .filter(r => r.productId === prod.id && r.status === 'DONE')
      .map(r => ({
        date: r.date,
        qty: Number(r.quantity) || 0,
        // Synthetic slight cost variations for realistic ERP inventory layers (+/- 8%)
        cost: r.unitCost || Number((baseCost * (0.94 + ((r.id.charCodeAt(r.id.length - 1) % 15) / 100))).toFixed(2))
      }));

    // If no past receipts, synthesize baseline procurement batch
    if (prodReceipts.length === 0) {
      prodReceipts.push(
        { date: '2026-08-01', qty: Math.max(onHand * 0.4, 20), cost: Number((baseCost * 0.95).toFixed(2)) },
        { date: '2026-09-10', qty: Math.max(onHand * 0.6, 30), cost: Number((baseCost * 1.03).toFixed(2)) }
      );
    }

    let unitValuation = baseCost;
    let totalValuation = 0;
    let layersUsed = [];

    if (method === 'MOVING_AVG') {
      // Weighted Moving Average = Sum(qty * cost) / Sum(qty)
      const totalCostSum = prodReceipts.reduce((acc, r) => acc + (r.qty * r.cost), 0);
      const totalQtySum = prodReceipts.reduce((acc, r) => acc + r.qty, 0);
      unitValuation = totalQtySum > 0 ? totalCostSum / totalQtySum : baseCost;
      totalValuation = onHand * unitValuation;
      layersUsed = [{
        label: `Weighted Avg (${prodReceipts.length} Batches)`,
        qty: onHand,
        rate: unitValuation
      }];
    } else if (method === 'FIFO') {
      // First In, First Out: Stock remaining comes from the most recent receipts
      let remainingToValue = onHand;
      const reversed = [...prodReceipts].reverse(); // latest first
      for (const batch of reversed) {
        if (remainingToValue <= 0) break;
        const taken = Math.min(remainingToValue, batch.qty);
        totalValuation += taken * batch.cost;
        layersUsed.push({
          label: `Batch ${batch.date}`,
          qty: taken,
          rate: batch.cost
        });
        remainingToValue -= taken;
      }
      if (remainingToValue > 0) {
        totalValuation += remainingToValue * baseCost;
        layersUsed.push({ label: 'Base Layer', qty: remainingToValue, rate: baseCost });
      }
      unitValuation = onHand > 0 ? totalValuation / onHand : baseCost;
    } else if (method === 'LIFO') {
      // Last In, First Out: Stock remaining assumed from earliest batches
      let remainingToValue = onHand;
      for (const batch of prodReceipts) {
        if (remainingToValue <= 0) break;
        const taken = Math.min(remainingToValue, batch.qty);
        totalValuation += taken * batch.cost;
        layersUsed.push({
          label: `Batch ${batch.date}`,
          qty: taken,
          rate: batch.cost
        });
        remainingToValue -= taken;
      }
      if (remainingToValue > 0) {
        totalValuation += remainingToValue * (baseCost * 0.92);
        layersUsed.push({ label: 'Historical Layer', qty: remainingToValue, rate: baseCost * 0.92 });
      }
      unitValuation = onHand > 0 ? totalValuation / onHand : baseCost;
    }

    return {
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      categoryName: prod.categoryName,
      uom: prod.uom,
      onHand,
      baseCatalogCost: baseCost,
      calculatedUnitCost: Number(unitValuation.toFixed(2)),
      totalAssetValue: Number(totalValuation.toFixed(2)),
      layersUsed,
      batchesCount: prodReceipts.length
    };
  });
}
