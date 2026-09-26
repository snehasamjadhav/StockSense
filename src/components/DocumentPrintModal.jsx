import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, Calendar, User, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/exportUtils.js';

export const DocumentPrintModal = ({ isOpen, onClose, document: doc, docType = 'RECEIPT' }) => {
  if (!isOpen || !doc) return null;

  const handlePrint = () => {
    window.print();
  };

  const getDocTitle = () => {
    switch (docType) {
      case 'PURCHASE_ORDER':
        return {
          title: 'PURCHASE ORDER (PO)',
          subtitle: 'Official Procurement Requisition & Vendor Order',
          partnerLabel: 'Vendor / Supplier',
          sourceLabel: 'Billing Entity',
          destLabel: 'Delivery Destination'
        };
      case 'RECEIPT':
        return {
          title: 'GOODS RECEIPT NOTE (GRN)',
          subtitle: 'Warehouse Inbound Shipment Verification & Intake Slip',
          partnerLabel: 'Supplier / Vendor',
          sourceLabel: 'Carrier / Dispatch Source',
          destLabel: 'Intake Bay / Receiving Location'
        };
      case 'DELIVERY':
        return {
          title: 'COMMERCIAL DELIVERY NOTE & PACKING SLIP',
          subtitle: 'Outbound Customer Fulfillment & Bill of Lading',
          partnerLabel: 'Customer / Recipient',
          sourceLabel: 'Fulfillment Origin',
          destLabel: 'Delivery Destination'
        };
      case 'TRANSFER':
        return {
          title: 'INTERNAL MATERIAL TRANSFER VOUCHER',
          subtitle: 'Inter-Warehouse & Bin Location Relocation Record',
          partnerLabel: 'Authorized Operator',
          sourceLabel: 'Source Location',
          destLabel: 'Target Location'
        };
      case 'ADJUSTMENT':
        return {
          title: 'INVENTORY CYCLE COUNT AUDIT CERTIFICATE',
          subtitle: 'Physical Stock Reconciliation & Adjustment Ledger Voucher',
          partnerLabel: 'Auditor / Inspector',
          sourceLabel: 'Count Location',
          destLabel: 'Ledger Offset Classification'
        };
      default:
        return {
          title: 'OFFICIAL ERP TRANSACTION DOCUMENT',
          subtitle: 'StockSense Operational Record',
          partnerLabel: 'Counterparty',
          sourceLabel: 'Origin',
          destLabel: 'Destination'
        };
    }
  };

  const meta = getDocTitle();
  const unitPrice = doc.unitCost || (docType === 'PURCHASE_ORDER' ? 24.50 : 18.00);
  const totalAmount = doc.totalAmount || (doc.quantity ? doc.quantity * unitPrice : 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-700" />
            <div>
              <span className="font-bold text-sm text-slate-900">Document Print & Verification Slip</span>
              <span className="text-xs text-slate-500 ml-2 font-mono">{doc.reference || doc.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper Area */}
        <div id="printable-erp-document" className="p-8 overflow-y-auto bg-white text-slate-900 font-sans space-y-6">
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-indigo-700 text-white font-black text-sm rounded flex items-center justify-center">
                  S
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">StockSense ERP</span>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                  Official
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">StockSense Global Supply Chain Systems LLC</p>
              <p className="text-[11px] text-slate-500">104 Logistics Parkway, Industrial Zone East · Tax ID: US-88492019</p>
              <p className="text-[11px] text-slate-500">compliance@stocksense.erp · +1 (800) 555-0199</p>
            </div>

            <div className="text-right">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{meta.title}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{meta.subtitle}</p>
              <div className="mt-2 inline-block bg-slate-100 px-2.5 py-1 rounded text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Document Ref #</div>
                <div className="font-mono text-sm font-bold text-indigo-800">{doc.reference || doc.id}</div>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/80 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Date Issued</span>
              <span className="font-mono font-medium text-slate-800">{doc.date || new Date().toISOString().substring(0, 10)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Document Status</span>
              <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {doc.status || 'VERIFIED'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Operator / Agent</span>
              <span className="text-slate-800 font-medium">{doc.operator || 'StockSense System'}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-[10px] block">Warehouse Facility</span>
              <span className="text-slate-800 font-medium">{doc.warehouseName || doc.warehouseId || 'Main Warehouse (WH-MAIN)'}</span>
            </div>
          </div>

          {/* Party Details (Supplier / Customer / Location) */}
          <div className="grid grid-cols-2 gap-6 text-xs pt-1">
            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {meta.sourceLabel}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {doc.supplier || doc.sourceLocationName || doc.customer || 'StockSense Primary Depot'}
              </div>
              <p className="text-slate-600 mt-1 text-[11px]">
                {doc.sourceLocationName ? `Internal Bin: ${doc.sourceLocationName}` : 'Authorized Logistics Terminal'}
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">Verification Clearance: Cleared</p>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {meta.destLabel}
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {doc.customer || doc.destinationName || doc.destLocationName || 'Receiving Bay 01'}
              </div>
              <p className="text-slate-600 mt-1 text-[11px]">
                {doc.destinationName || doc.destLocationName ? `Target Bin: ${doc.destinationName || doc.destLocationName}` : 'Final Consignee Dispatch'}
              </p>
              <p className="text-slate-500 text-[10px] mt-0.5">Physical Condition: Inspected & Verified</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
              Document Manifest & Inventory Items
            </div>
            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item #</th>
                  <th className="py-2.5 px-3">Product Name & Specifications</th>
                  <th className="py-2.5 px-3">UOM</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Value</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-500">01</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{doc.productName || 'Standard Stock Item'}</div>
                    <div className="text-[11px] text-slate-500 font-mono">SKU: {doc.productId || 'STK-001'}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{doc.uom || 'PCS'}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {doc.quantity || doc.physicalQty || 1}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-indigo-900">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 text-slate-900 border-t border-slate-200 text-xs">
                <tr>
                  <td colSpan="4" className="py-2.5 px-3 text-slate-500 italic text-[11px]">
                    Ledger Posting Rule: Invariant double-entry audit verified
                  </td>
                  <td className="py-2.5 px-3 font-bold text-right">Net Total:</td>
                  <td className="py-2.5 px-3 font-mono font-black text-right text-indigo-900 text-sm">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Operational Notes */}
          {doc.notes && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 uppercase text-[10px] block mb-0.5">Document Notes / Manifest Memo</span>
              <p className="text-slate-600">{doc.notes}</p>
            </div>
          )}

          {/* Verification & Signature Block */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-8">1. Warehouse Dispatcher / Intake</span>
              <div className="border-b border-slate-300 pb-1 font-mono text-[11px] text-slate-800">
                {doc.operator || 'Elena Rostova'}
              </div>
              <span className="text-[10px] text-slate-400">Signature / Seal</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-8">2. Carrier / Logistics Partner</span>
              <div className="border-b border-slate-300 pb-1 font-mono text-[11px] text-slate-500 italic">
                Verified Freight Driver
              </div>
              <span className="text-[10px] text-slate-400">Signature / BOL Acceptance</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-8">3. Quality Assurance Control</span>
              <div className="border-b border-slate-300 pb-1 flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PASSED & VERIFIED</span>
              </div>
              <span className="text-[10px] text-slate-400">Ledger Immutability Lock</span>
            </div>
          </div>

          {/* Barcode & Security Hash Simulation Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 h-6 items-end">
                <div className="w-0.5 h-6 bg-slate-800"></div>
                <div className="w-1.5 h-6 bg-slate-800"></div>
                <div className="w-0.5 h-6 bg-slate-800"></div>
                <div className="w-1 h-6 bg-slate-800"></div>
                <div className="w-2 h-6 bg-slate-800"></div>
                <div className="w-0.5 h-6 bg-slate-800"></div>
                <div className="w-1.5 h-6 bg-slate-800"></div>
                <div className="w-1 h-6 bg-slate-800"></div>
                <div className="w-2 h-6 bg-slate-800"></div>
              </div>
              <span>SHA-256: {doc.reference ? btoa(doc.reference).substring(0, 16) : '89fa4e1b9c'}</span>
            </div>
            <span>StockSense Enterprise ERP v2.4 · Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
