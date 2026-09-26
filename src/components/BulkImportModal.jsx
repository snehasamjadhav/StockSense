import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { mockInventoryService } from '../services/mockInventoryService.js';

export const BulkImportModal = ({ isOpen, onClose, onShowToast, onImportSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const categories = mockInventoryService.getCategories();

  const sampleCSV = `name,sku,categoryName,uom,unitCost,minStock,maxStock,reorderQty,initialStock,description
Titanium Rod,TI-001,Raw Materials,KG,45.00,10,100,30,50,High grade aerospace titanium round bar
Copper Wire Spool,CU-001,Raw Materials,KG,18.50,20,150,50,80,Heavy gauge industrial copper winding spool
Industrial Motor 1HP,MTR-001,Finished Goods,PCS,185.00,5,30,10,12,Single phase high torque industrial motor
Heavy Duty Caster,CST-001,Finished Goods,PCS,14.20,25,200,60,110,Polyurethane swivel lock warehouse caster
Cardboard Dividers,DIV-001,Packaging,PCS,0.85,50,500,200,350,Corrugated slotted interior partition boxes`;

  const handleLoadSample = () => {
    setCsvText(sampleCSV);
    parseCSV(sampleCSV);
  };

  const parseCSV = (content) => {
    const lines = content.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setParsedRows([]);
      setValidationErrors(['CSV must contain a header row and at least one item data row']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'sku'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      setValidationErrors([`Missing mandatory column header(s): ${missingHeaders.join(', ')}`]);
      setParsedRows([]);
      return;
    }

    const rows = [];
    const errors = [];
    const existingProducts = mockInventoryService.getProducts();
    const existingSkus = new Set(existingProducts.map(p => p.sku.toUpperCase()));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV column split (accounting for potential simple quoted strings)
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      // Validation
      const rowNum = i + 1;
      if (!row.name) {
        errors.push(`Row ${rowNum}: Product Name is empty`);
      }
      if (!row.sku) {
        errors.push(`Row ${rowNum}: SKU is empty`);
      } else if (existingSkus.has(row.sku.toUpperCase())) {
        errors.push(`Row ${rowNum}: SKU "${row.sku}" already exists in product catalog`);
      }

      row.unitCost = parseFloat(row.unitcost || row.unit_cost) || 10.00;
      row.minStock = parseInt(row.minstock || row.min_stock, 10) || 10;
      row.maxStock = parseInt(row.maxstock || row.max_stock, 10) || 100;
      row.reorderQty = parseInt(row.reorderqty || row.reorder_qty, 10) || 50;
      row.initialStock = parseInt(row.initialstock || row.initial_stock, 10) || 0;
      row.uom = (row.uom || 'PCS').toUpperCase();
      row.categoryName = row.categoryname || row.category || 'Raw Materials';

      rows.push(row);
    }

    setParsedRows(rows);
    setValidationErrors(errors);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return;
    setIsProcessing(true);

    try {
      let createdCount = 0;
      for (const row of parsedRows) {
        // Resolve or create category
        let cat = categories.find(c => c.name.toLowerCase() === row.categoryName.toLowerCase()) || categories[0];

        const newProd = mockInventoryService.addProduct({
          name: row.name,
          sku: row.sku,
          categoryId: cat ? cat.id : 'cat-raw',
          uom: row.uom,
          unitCost: row.unitCost,
          minStock: row.minStock,
          maxStock: row.maxStock,
          reorderQty: row.reorderQty,
          description: row.description || 'Imported via Bulk CSV Engine'
        });

        // If initial stock specified, credit to rack A with a validated genesis receipt
        if (row.initialStock > 0) {
          mockInventoryService.mutateLocationStock(newProd.id, 'loc-rack-a', row.initialStock);
          mockInventoryService.recordLedgerEntry({
            docRef: `IMP/2026/${Math.floor(1000 + Math.random() * 9000)}`,
            docType: 'RECEIPT',
            productId: newProd.id,
            sourceName: 'Bulk CSV Intake Manifest',
            destName: 'Rack A Storage (WH-MAIN)',
            qtyChangeFormatted: `+${row.initialStock} ${newProd.uom}`,
            beforeQty: 0,
            afterQty: row.initialStock
          });
        }
        createdCount++;
      }

      onShowToast(`Successfully imported ${createdCount} products into the ERP catalog!`, 'success');
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      onShowToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Batch Catalog & Stock Import</h2>
              <p className="text-xs text-slate-500">Bulk upload multiple products, safety thresholds, and initial balances via CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* File Picker & Sample Loader */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 shadow-xs">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Choose CSV File</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleLoadSample}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-dashed text-left"
            >
              Load Sample 5-Item CSV Template
            </button>
          </div>

          {/* CSV Textarea Editor */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              CSV Data (Header + Comma-Separated Values)
            </label>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCSV(e.target.value);
              }}
              placeholder="name,sku,categoryName,uom,unitCost,minStock,maxStock,reorderQty,initialStock,description..."
              className="w-full font-mono text-[11px] p-2.5 border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Found {validationErrors.length} validation issue(s):</span>
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {validationErrors.slice(0, 4).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {validationErrors.length > 4 && <li>...and {validationErrors.length - 4} more</li>}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && validationErrors.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid CSV Manifest ({parsedRows.length} items ready to ingest)</span>
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px] border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-3">Product Name</th>
                      <th className="py-1.5 px-3">SKU</th>
                      <th className="py-1.5 px-3">Category</th>
                      <th className="py-1.5 px-3">UOM</th>
                      <th className="py-1.5 px-3 text-right">Cost</th>
                      <th className="py-1.5 px-3 text-right">Min Stock</th>
                      <th className="py-1.5 px-3 text-right">Initial Intake</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-indigo-700">{r.sku}</td>
                        <td className="py-1.5 px-3 text-slate-600">{r.categoryName}</td>
                        <td className="py-1.5 px-3 font-mono">{r.uom}</td>
                        <td className="py-1.5 px-3 text-right font-mono">${r.unitCost.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right font-mono">{r.minStock}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-700">+{r.initialStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">CSV Column Support: name, sku, uom, unitCost, minStock, maxStock, reorderQty, initialStock</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              disabled={parsedRows.length === 0 || validationErrors.length > 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-semibold transition-colors"
            >
              {isProcessing ? 'Ingesting Catalog...' : `Ingest ${parsedRows.length} Products`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
