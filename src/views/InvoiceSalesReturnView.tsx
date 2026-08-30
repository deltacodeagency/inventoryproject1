import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AppSelect } from '../components/AppSelect';
import {
  WifiOff,
  RefreshCw,
  CheckCircle,
  FileText,
  Printer,
  Search,
  Undo2,
  Calendar,
  AlertCircle,
  TrendingDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { Sale, Product } from '../types';
import { displayCustomerName } from './POSView';

// ==========================================
// 1. OFFLINE SALES COMPONENT
// ==========================================
export const OfflineSalesView: React.FC = () => {
  const { sales, isOffline, setIsOffline, addAlert } = useInventory();
  const [syncing, setSyncing] = useState(false);

  const offlineSales = sales.filter((s) => s.isOffline);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setIsOffline(false);
      addAlert('system', 'Sales Queue Synced', `${offlineSales.length} offline receipts have been synced successfully with central DB.`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Offline Sales Register</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Transactions cached locally during register blackouts</span>
        </div>

        {offlineSales.length > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:bg-slate-200 transition-colors shadow-lg shadow-blue-500/15 flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Force Sync Cache'}</span>
          </button>
        )}
      </div>

      {/* Info Warning */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3 text-xs text-amber-700">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Register Cache Policy</p>
          <p className="text-amber-600">While offline, sales are cached in local browser storage. Stock totals are deducted instantly from local lists. When server access restores, click sync to push sales back to master servers.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Queue ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Count</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offlineSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 space-y-2">
                    <CheckCircle className="w-8 h-8 text-slate-200 mx-auto" />
                    <p className="font-semibold text-slate-500">Offline queue is currently empty.</p>
                    <span className="text-[10px] text-slate-400">All registered cashier sales are synchronized</span>
                  </td>
                </tr>
              ) : (
                offlineSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">{sale.invoiceNo}</td>
                    <td className="p-4 font-semibold text-slate-800">{sale.customerName}</td>
                    <td className="p-4 font-medium text-slate-500">
                      {sale.items.reduce((sum, i) => sum + i.quantity, 0)} units
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">${sale.total.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-bold animate-pulse">
                        Pending Sync
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. INVOICE VIEW COMPONENT
// ==========================================
export const InvoiceView: React.FC = () => {
  const { sales } = useInventory();
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);

  return (
    <div className="space-y-6 text-xs text-slate-600 select-none">
      <div className="mobile-page-header">
        <h3 className="text-base font-bold text-slate-800">Sales & Invoices</h3>
        <span className="text-[10px] text-slate-400 block -mt-0.5">Review sales history and manage printable retail invoices</span>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Invoice No</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Salesperson</th>
                <th className="p-4">Date / Time</th>
                <th className="p-4 text-right">Discount</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-800">{sale.invoiceNo}</td>
                  <td className="p-4 font-semibold text-slate-800">{sale.customerName}</td>
                  <td className="p-4 font-semibold text-slate-600">{sale.salesperson || '—'}</td>
                  <td className="p-4 text-slate-400">{new Date(sale.date).toLocaleString()}</td>
                  <td className="p-4 text-right font-medium text-rose-500">{sale.discount > 0 ? `-$${sale.discount.toFixed(2)}` : '—'}</td>
                  <td className="p-4 text-right font-black text-slate-800">${sale.total.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setActiveInvoice(sale)}
                      className="px-2.5 py-1 rounded-lg border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold text-[10px] flex items-center space-x-1 mx-auto transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Sheet Modal */}
      {activeInvoice && (
        <div
          onClick={() => setActiveInvoice(null)}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Invoice Receipt Sheet</h3>
              <button
                type="button"
                onClick={() => setActiveInvoice(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Receipt layout */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-3 font-mono text-[10px] text-slate-500">
              <div className="text-center border-b border-dashed border-slate-200 pb-2">
                <p className="font-bold text-slate-700">DREAMSPOS RETAIL LTD</p>
                <p>{new Date(activeInvoice.date).toLocaleString()}</p>
                <div className="inline-block bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800 text-[10px] my-1 border border-slate-200">
                  MONEY RECEIPT SERIAL: {activeInvoice.receiptSerial || activeInvoice.invoiceNo}
                </div>
                <p className="text-blue-600 font-bold">Invoice Ref: {activeInvoice.invoiceNo}</p>
                <p className="text-slate-700 font-semibold mt-1">Customer: {displayCustomerName(activeInvoice.customerName)}</p>
                <p className="text-slate-600 font-semibold">Salesperson: {activeInvoice.salesperson || '—'}</p>
              </div>

              {/* Items */}
              <div className="space-y-1 border-b border-dashed border-slate-200 pb-2">
                {activeInvoice.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-slate-600 font-semibold">
                    <span>{item.productName} (x{item.quantity})</span>
                    <span>৳{Math.round(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-0.5 text-slate-500 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{Math.round(activeInvoice.subtotal)}</span>
                </div>
                {activeInvoice.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <span>-৳{Math.round(activeInvoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-bold border-t border-dashed border-slate-200 pt-1.5 mt-1">
                  <span>GRAND TOTAL:</span>
                  <span>৳{Math.round(activeInvoice.total)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600">
                  <span>Payment ({activeInvoice.paymentMethod}):</span>
                  <span>৳{Math.round(activeInvoice.paidAmount)}</span>
                </div>
              </div>
            </div>

            {/* Print action */}
            <button
              onClick={() => {
                const formattedCustomer = displayCustomerName(activeInvoice.customerName);
                const serialNo = activeInvoice.receiptSerial || activeInvoice.invoiceNo;
                const itemsHtml = activeInvoice.items.map((item) => `
                  <tr style="border-bottom: 1px solid #cbd5e1;">
                    <td style="padding: 6px 0;">
                      <strong style="font-size: 13px;">${item.productName}</strong><br/>
                      <span style="font-size: 11px; color: #475569;">x${item.quantity} @ ৳${Math.round(item.price)}</span>
                    </td>
                    <td style="text-align: right; vertical-align: top; padding: 6px 0; font-weight: bold; font-size: 13px;">
                      ৳${Math.round(item.price * item.quantity)}
                    </td>
                  </tr>
                `).join('');

                const printableHTML = `
                  <div style="font-family: 'Courier New', Courier, monospace, sans-serif; max-width: 320px; margin: 0 auto; color: #0f172a; font-size: 12px; line-height: 1.4; padding: 12px; background: #fff;">
                    <div style="text-align: center; margin-bottom: 12px;">
                      <h2 style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold;">DREAMSPOS RETAIL LTD</h2>
                      <div style="font-size: 11px; color: #475569;">Dhaka, Bangladesh | Hot Line: +880 1700-000000</div>
                      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: bold; display: inline-block; margin: 6px 0; border-radius: 4px; font-size: 11px;">
                        MONEY RECEIPT SERIAL NO: ${serialNo}
                      </div>
                      <div style="font-size: 11px; color: #475569;">Invoice Ref: ${activeInvoice.invoiceNo}</div>
                      <div style="font-size: 11px; color: #475569;">Date: ${new Date(activeInvoice.date).toLocaleString()}</div>
                      <div style="font-size: 11px; color: #0f172a; font-weight: bold; margin-top: 2px;">Customer: ${formattedCustomer}</div>
                      <div style="font-size: 11px; color: #0f172a; font-weight: bold; margin-top: 2px;">Salesperson: ${activeInvoice.salesperson || '—'}</div>
                    </div>

                    <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>

                    <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
                      <thead>
                        <tr style="border-bottom: 1px solid #0f172a;">
                          <th style="text-align: left; padding-bottom: 4px; font-size: 12px;">Item Description</th>
                          <th style="text-align: right; padding-bottom: 4px; font-size: 12px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>${itemsHtml}</tbody>
                    </table>

                    <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>

                    <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                      <span>Subtotal:</span>
                      <span style="font-weight: bold;">৳${Math.round(activeInvoice.subtotal)}</span>
                    </div>
                    ${activeInvoice.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin: 4px 0; color: #dc2626;"><span>Discount:</span><span>-৳${Math.round(activeInvoice.discount)}</span></div>` : ''}
                    <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>
                    <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 6px 0;">
                      <span>GRAND TOTAL:</span>
                      <span>৳${Math.round(activeInvoice.total)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                      <span>Payment Method:</span>
                      <span style="font-weight: bold;">${activeInvoice.paymentMethod}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 4px 0;">
                      <span>Paid Amount:</span>
                      <span>৳${Math.round(activeInvoice.paidAmount)}</span>
                    </div>

                    <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>
                    <div style="margin-top: 16px; font-size: 10px; color: #64748b; text-align: center;">
                      <p style="font-weight: bold; margin: 2px 0;">Thank you for shopping with us!</p>
                      <p style="margin: 2px 0;">Please keep this money receipt for warranty and returns.</p>
                    </div>
                  </div>
                `;

                let printArea = document.getElementById('printable-receipt-section');
                if (!printArea) {
                  printArea = document.createElement('div');
                  printArea.id = 'printable-receipt-section';
                  document.body.appendChild(printArea);
                }
                printArea.innerHTML = printableHTML;

                try {
                  const printWin = window.open('', '_blank', 'width=450,height=680');
                  if (printWin) {
                    printWin.document.open();
                    printWin.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title></title>
                          <style>
                            @page {
                              size: auto;
                              margin: 0mm;
                            }
                            @media print {
                              .no-print { display: none !important; }
                              body { padding: 12px !important; margin: 0 !important; background: #fff !important; }
                            }
                          </style>
                        </head>
                        <body style="margin: 0; padding: 12px; background: #fff;">
                          <div class="no-print" style="text-align: center; margin-bottom: 16px;">
                            <button onclick="window.print()" style="padding: 10px 22px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; font-family: sans-serif;">🖨️ Click to Print Receipt</button>
                          </div>
                          ${printableHTML}
                          <script>
                            window.onload = function() {
                              setTimeout(function() { window.print(); }, 250);
                            };
                          </script>
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                    return;
                  }
                } catch (e) {
                  console.log('Window print fallback', e);
                }

                window.print();
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. SALES HISTORY COMPONENT
// ==========================================
export const SalesView: React.FC = () => {
  const { sales } = useInventory();
  const [search, setSearch] = useState('');

  const filteredSales = sales.filter((s) => {
    return (
      s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Sales Transactions Ledger</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Audit log of all processed checkouts</span>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment Option</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-700">{sale.invoiceNo}</td>
                  <td className="p-4 text-slate-400">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="p-4 font-semibold text-slate-800">{sale.customerName}</td>
                  <td className="p-4 font-bold text-slate-500">{sale.paymentMethod}</td>
                  <td className="p-4 text-right font-black text-slate-800">৳{Math.round(sale.total)}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        sale.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : sale.status === 'Partial'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. RETURN TERMINAL COMPONENT
// ==========================================
export const ReturnView: React.FC = () => {
  const { sales, addReturn, addAlert } = useInventory();
  
  // Selected Invoice
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  const activeSale = sales.find((s) => s.id === selectedInvoiceId);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSale) return;

    // Build the items to return
    const itemsToReturn = activeSale.items
      .filter((item) => returnItems[item.productId] > 0)
      .map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: Number(returnItems[item.productId]),
        refundAmount: item.price * Number(returnItems[item.productId]),
      }));

    if (itemsToReturn.length === 0) {
      addAlert('system', 'Return Failed', 'Please specify a valid return quantity for at least one item.');
      return;
    }

    const refundTotal = itemsToReturn.reduce((sum, item) => sum + item.refundAmount, 0);

    // Call inventory return mutator
    addReturn({
      saleId: activeSale.id,
      invoiceNo: activeSale.invoiceNo,
      items: itemsToReturn,
      refundTotal,
      reason: reason || 'Product dissatisfaction',
    });

    // Reset Form
    setSelectedInvoiceId('');
    setReturnItems({});
    setReason('');
  };

  const handleQtyChange = (productId: string, maxQty: number, val: number) => {
    const qty = Math.max(0, Math.min(maxQty, val));
    setReturnItems((prev) => ({
      ...prev,
      [productId]: qty,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-800">Sales Return Terminal</h3>
        <span className="text-[10px] text-slate-400 block -mt-0.5">Process customer refunds and log items back into inventory</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-slate-600 select-none">
        {/* Return Forms layout */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <Undo2 className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-800">Return Processor</h4>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-4">
            {/* Invoice Select */}
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Select Past Invoice Receipt</label>
              <AppSelect
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setReturnItems({});
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 bg-white cursor-pointer transition-all hover:border-slate-300"
              >
                <option value="">-- Choose Invoice to Return --</option>
                {sales
                  .filter((s) => s.status !== 'Returned')
                  .map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.invoiceNo} - {sale.customerName} (৳{Math.round(sale.total)})
                    </option>
                  ))}
              </AppSelect>
            </div>

            {/* If invoice selected, show item list */}
            {activeSale && (
              <div className="space-y-4 p-4 border border-slate-100 bg-slate-50/40 rounded-2xl animate-fade-in">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px] block">Receipt Items</span>
                <div className="divide-y divide-slate-100">
                  {activeSale.items.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                        <span className="text-[10px] text-slate-400">Purchased Qty: {item.quantity} units</span>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold">Qty to Return:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          placeholder="0"
                          value={returnItems[item.productId] || ''}
                          onChange={(e) => handleQtyChange(item.productId, item.quantity, Number(e.target.value))}
                          className="w-16 p-1 border border-slate-200 rounded-lg text-center font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reason */}
                <div className="space-y-1 pt-2">
                  <label className="font-bold text-slate-400">Refund / Return Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Broken packaging, customer change of mind..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center space-x-1"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Execute Refund return</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Side guidelines */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-inner space-y-4 self-start">
          <div className="space-y-1.5">
            <h5 className="font-bold text-slate-800 flex items-center">
              <Undo2 className="w-4 h-4 mr-1.5 text-blue-600" />
              Sourcing Returns Policy
            </h5>
            <p className="text-slate-500 text-[11px]">Returns log inventory elements back into stock coordinates. Real-time lists and low stock warnings update dynamically.</p>
          </div>
          <div className="space-y-2 text-[11px] text-slate-400 font-medium">
            <p>1. Ensure physical items are reviewed for quality before processing refunds.</p>
            <p>2. Refund amounts are computed strictly on selling prices registered in original invoice.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
