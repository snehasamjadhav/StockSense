import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Scan,
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  Package,
  FileText,
  MapPin,
  ExternalLink,
  ArrowRight,
  Volume2,
  VolumeX,
  RefreshCw,
  Printer
} from 'lucide-react';
import { mockDocumentService } from '../services/mockDocumentService.js';
import { formatCurrency } from '../utils/exportUtils.js';

export const BarcodeScannerModal = ({ isOpen, onClose, onShowToast, onNavigateTo }) => {
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Optical scanner audio chirp feedback via Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch optical beep
      gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // AudioContext not available or blocked
    }
  };

  const handleScanCode = (code) => {
    if (!code || !code.trim()) return;
    playBeep();
    const result = mockDocumentService.searchBarcode(code.trim());
    setScanResult(result);
    setScanInput(code.trim());
    if (onShowToast) {
      if (result && result.type !== 'NOT_FOUND') {
        onShowToast(`Scanned: ${result.title}`, 'success');
      } else {
        onShowToast(`No matching item found for "${code}"`, 'error');
      }
    }
  };

  // Start / stop camera stream
  useEffect(() => {
    if (isOpen && useCamera) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable in current context', err);
          setUseCamera(false);
          if (onShowToast) onShowToast('Camera unavailable. Using optical barcode simulator.', 'info');
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, useCamera]);

  if (!isOpen) return null;

  const quickSamples = [
    { label: 'Steel Rod (SKU)', code: 'STEEL-001', type: 'Product' },
    { label: 'Aluminum (SKU)', code: 'AL-001', type: 'Product' },
    { label: 'Receipt GRN', code: 'REC/2026/0001', type: 'Document' },
    { label: 'Delivery Slip', code: 'DEL/2026/0001', type: 'Document' },
    { label: 'Multi-Step Transfer', code: 'TRF/2026/0105', type: 'Document' },
    { label: 'Purchase Order', code: 'PO/2026/0101', type: 'Document' },
    { label: 'Receiving Bay', code: 'REC-01', type: 'Location' },
    { label: 'Rack A Storage', code: 'RACK-A', type: 'Location' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Optical Barcode & QR Scanner</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-semibold">
                  LIVE RF SIMULATOR
                </span>
              </h2>
              <p className="text-xs text-slate-500">Scan product SKUs, document vouchers, or warehouse bin QR tags</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-md border transition-colors ${
                soundEnabled ? 'text-indigo-600 bg-indigo-50 border-indigo-200' : 'text-slate-400 border-slate-200 hover:bg-slate-100'
              }`}
              title={soundEnabled ? 'Scanner Beep Enabled' : 'Scanner Beep Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scanner Viewport / Camera View */}
        <div className="relative bg-slate-950 p-6 flex flex-col items-center justify-center text-center overflow-hidden min-h-[220px]">
          {useCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          ) : (
            /* Digital HUD / Scanner Grid Simulation */
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          )}

          {/* Optical Targeting Reticle */}
          <div className="relative z-10 w-64 h-36 border-2 border-indigo-400/80 rounded-lg flex flex-col items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)] bg-indigo-950/20 backdrop-blur-2xs">
            {/* Corner Brackets */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-indigo-300"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-indigo-300"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-indigo-300"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-indigo-300"></div>

            {/* Pulsing Laser Scan Bar */}
            <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-pulse"></div>

            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono text-indigo-200">
              <Scan className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span>ALIGN CODE IN RETICLE</span>
            </div>
          </div>

          {/* Camera toggle pill */}
          <div className="relative z-10 mt-4 flex items-center gap-2">
            <button
              onClick={() => setUseCamera(!useCamera)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full text-[11px] font-semibold transition-colors"
            >
              <Camera className="w-3 h-3 text-indigo-400" />
              <span>{useCamera ? 'Switch to Digital HUD' : 'Enable Device Camera'}</span>
            </button>
          </div>
        </div>

        {/* Input Bar & Preset Chips */}
        <div className="p-4 space-y-3 bg-white border-b border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScanCode(scanInput);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Type or paste SKU, document ref (e.g. STEEL-001 or REC/2026/0001)..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Scan
            </button>
          </form>

          {/* Quick Click-to-Scan Demo Chips */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              Instant Demonstration Barcodes (Click to simulate scan):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSamples.map((sample) => (
                <button
                  key={sample.code}
                  onClick={() => handleScanCode(sample.code)}
                  className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded text-[11px] font-mono text-slate-700 hover:text-indigo-700 transition-colors flex items-center gap-1"
                >
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-200 text-slate-600">
                    {sample.type}
                  </span>
                  <strong>{sample.code}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scan Result Detail Card */}
        <div className="p-4 overflow-y-auto max-h-[300px] bg-slate-50/50">
          {!scanResult ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              <Scan className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>Awaiting barcode scan. Click any preset above or enter a SKU.</span>
            </div>
          ) : scanResult.type === 'NOT_FOUND' ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-rose-900">{scanResult.title}</strong>
                <p className="mt-0.5 text-rose-700">{scanResult.subtitle}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3 text-xs">
              {/* Header Match */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg mt-0.5">
                    {scanResult.type === 'PRODUCT' ? <Package className="w-4 h-4" /> :
                     scanResult.type === 'DOCUMENT' ? <FileText className="w-4 h-4" /> :
                     <MapPin className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {scanResult.type}
                      </span>
                      <strong className="text-sm font-bold text-slate-900">{scanResult.title}</strong>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{scanResult.subtitle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">Scanned Code</span>
                  <span className="font-mono font-bold text-indigo-700 text-xs">{scanResult.reference}</span>
                </div>
              </div>

              {/* Product specific balances */}
              {scanResult.type === 'PRODUCT' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-medium text-slate-600">Total System On-Hand:</span>
                    <strong className="font-mono text-base font-bold text-indigo-900">
                      {scanResult.data.totalStock} {scanResult.data.product.uom}
                    </strong>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Location Allocations:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {scanResult.data.balances.map(b => (
                        <div key={b.locationId} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 truncate">{b.locationName}</span>
                          <strong className="font-mono text-slate-900">{b.quantity} {scanResult.data.product.uom}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Document specific details */}
              {scanResult.type === 'DOCUMENT' && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Counterparty</span>
                    <strong className="text-slate-900">{scanResult.data.supplier || scanResult.data.customer || 'Internal Transfer'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Status</span>
                    <strong className="text-indigo-700">{scanResult.data.status}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Item / Quantity</span>
                    <span className="font-mono text-slate-800">{scanResult.data.productName}: {scanResult.data.quantity} {scanResult.data.uom}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] font-semibold block">Issue Date</span>
                    <span className="font-mono text-slate-800">{scanResult.data.date}</span>
                  </div>
                </div>
              )}

              {/* Location specific details */}
              {scanResult.type === 'LOCATION' && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Inventory in this Bin:</div>
                  <div className="space-y-1">
                    {scanResult.data.items.length === 0 ? (
                      <div className="p-2 text-slate-400 italic">No products currently stored in this location.</div>
                    ) : (
                      scanResult.data.items.map(item => (
                        <div key={item.product.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-900">{item.product.name} ({item.product.sku})</span>
                          <strong className="font-mono text-indigo-900">{item.quantity} {item.product.uom}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            StockSense Handheld RF Engine v2.4
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-semibold transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
