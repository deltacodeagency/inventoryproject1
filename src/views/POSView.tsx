import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AppSelect } from '../components/AppSelect';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Tags,
  CheckCircle,
  FileText,
  Printer,
  Sparkles,
  Percent,
  Calculator
} from 'lucide-react';
import { TakaIcon } from '../components/TakaIcon';
import { Product, Sale } from '../types';

export const displayCustomerName = (name?: string) => {
  if (!name || name.trim() === '' || name.trim().toLowerCase() === 'customer') {
    return 'Walk-in Customer';
  }
  return name.trim();
};

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartDiscount,
    setCartDiscount,
    cartTaxRate,
    checkoutCart,
    addAlert
  } = useInventory();

  // Search/Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Transaction fields
  const [customer, setCustomer] = useState('Walk-in Customer');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mobile'>('Cash');
  const [mobileOption, setMobileOption] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [invoiceReceipt, setInvoiceReceipt] = useState<Sale | null>(null);

  // Cart math
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartTotal = Math.max(0, Math.round((cartSubtotal - cartDiscount) * 100) / 100);

  // Filtered product catalog
  const catalogList = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' ? true : p.categoryId === selectedCat;
    return matchesSearch && matchesCat && p.status === 'active';
  });

  const handlePrintReceipt = (receipt: Sale) => {
    const formattedCustomer = displayCustomerName(receipt.customerName);
    const serialNo = receipt.receiptSerial || receipt.invoiceNo;
    const itemsHtml = receipt.items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 6px 0;">
          <strong style="font-size: 13px;">${item.productName}</strong><br/>
          <span style="font-size: 11px; color: #475569;">x${item.quantity} @ ৳${Math.round(item.price)}</span>
        </td>
        <td style="text-align: right; vertical-align: top; padding: 6px 0; font-weight: bold; font-size: 13px;">
          ৳${Math.round(item.price * item.quantity)}
        </td>
      </tr>
    `
      )
      .join('');

    const printableHTML = `
      <div style="font-family: 'Courier New', Courier, monospace, sans-serif; max-width: 320px; margin: 0 auto; color: #0f172a; font-size: 12px; line-height: 1.4; padding: 12px; background: #fff;">
        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="margin: 0 0 4px 0; font-size: 16px; font-weight: bold;">DREAMSPOS RETAIL LTD</h2>
          <div style="font-size: 11px; color: #475569;">Dhaka, Bangladesh | Hot Line: +880 1700-000000</div>
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; font-weight: bold; display: inline-block; margin: 6px 0; border-radius: 4px; font-size: 11px;">
            MONEY RECEIPT SERIAL NO: ${serialNo}
          </div>
          <div style="font-size: 11px; color: #475569;">Invoice Ref: ${receipt.invoiceNo}</div>
          <div style="font-size: 11px; color: #475569;">Date: ${new Date(receipt.date).toLocaleString()}</div>
          <div style="font-size: 11px; color: #0f172a; font-weight: bold; margin-top: 2px;">Customer: ${formattedCustomer}</div>
        </div>

        <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>

        <table style="width: 100%; border-collapse: collapse; margin: 8px 0;">
          <thead>
            <tr style="border-bottom: 1px solid #0f172a;">
              <th style="text-align: left; padding-bottom: 4px; font-size: 12px;">Item Description</th>
              <th style="text-align: right; padding-bottom: 4px; font-size: 12px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>

        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span>Subtotal:</span>
          <span style="font-weight: bold;">৳${Math.round(receipt.subtotal)}</span>
        </div>
        ${
          receipt.discount > 0
            ? `
        <div style="display: flex; justify-content: space-between; margin: 4px 0; color: #dc2626;">
          <span>Discount:</span>
          <span>-৳${Math.round(receipt.discount)}</span>
        </div>
        `
            : ''
        }
        <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 6px 0;">
          <span>GRAND TOTAL:</span>
          <span>৳${Math.round(receipt.total)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span>Payment Gateway:</span>
          <span style="font-weight: bold;">${receipt.paymentMethod}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span>Paid Amount:</span>
          <span>৳${Math.round(receipt.paidAmount)}</span>
        </div>

        <div style="border-bottom: 1px dashed #94a3b8; margin: 10px 0;"></div>
        <div style="margin-top: 16px; font-size: 10px; color: #64748b; text-align: center;">
          <p style="font-weight: bold; margin: 2px 0;">Thank you for your purchase!</p>
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
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const rawCustomer = customCustomerName.trim() || customer;
    const finalCustomer = displayCustomerName(rawCustomer);
    const finalMethod = paymentMethod === 'Cash' ? 'Cash' : mobileOption;

    const receipt = checkoutCart(
      finalCustomer,
      finalMethod,
      cartTotal
    );

    if (receipt) {
      setInvoiceReceipt(receipt);
      setShowPaymentModal(false);
      // Reset forms
      setCustomer('Walk-in Customer');
      setCustomCustomerName('');
      setPaymentMethod('Cash');
      setMobileOption('bKash');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-full h-auto lg:overflow-hidden text-xs text-slate-600 select-none pb-12 lg:pb-0 lg:min-h-0 flex-1">
      {/* RIGHT: Register pane / POS Cart (Cols: 5) - Order 1 on Mobile so Register Checkout is at Top */}
      <div className="order-1 lg:order-2 lg:col-span-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col lg:h-full h-auto min-h-[420px] lg:min-h-0 overflow-hidden relative">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-800">Register Checkout</h4>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer select */}
        <div className="p-3 border-b border-slate-100 shrink-0 bg-slate-50/20">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <AppSelect
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 bg-white cursor-pointer transition-all hover:border-slate-300"
            >
              <option value="Walk-in Customer">Walk-in Customer</option>
              <option value="New Customer">New Customer</option>
              <option value="Regular Customer">Regular Customer</option>
              <option value="VIP Customer">VIP Customer</option>
            </AppSelect>
          </div>
        </div>

        {/* Process Payment at the Top */}
        <div className="p-3 border-b border-slate-100 bg-blue-50/30 shrink-0 space-y-2">
          <div className="flex justify-between items-center text-slate-800">
            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center">
              Receipt Grand Total
            </span>
            <span className="font-black text-sm text-blue-600">৳{Math.round(cartTotal)}</span>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 disabled:shadow-none transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Process Payment (৳{Math.round(cartTotal)})</span>
          </button>
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="font-semibold">Register drawer is empty.</p>
              <span className="text-[10px] block">Click items on the left to purchase</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="min-w-0 flex-1 pr-3 flex items-center space-x-2.5">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h6 className="font-bold text-slate-800 truncate" title={item.product.name}>{item.product.name}</h6>
                    <span className="text-[10px] text-slate-400 font-bold block">৳{Math.round(item.product.price)} / unit</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-bold text-xs text-slate-800 min-w-[20px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-black text-slate-800 w-16 text-right">
                    ৳{Math.round(item.product.price * item.quantity)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount & Tax Footer */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2 shrink-0">
            <div className="flex items-center justify-between space-x-2">
              <span className="font-bold text-slate-500 text-[11px]">Cart Subtotal:</span>
              <span className="font-bold text-slate-800 text-[11px]">৳{Math.round(cartSubtotal)}</span>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <label className="font-bold text-slate-500 text-[11px] flex items-center space-x-1">
                <Percent className="w-3 h-3 text-slate-400" />
                <span>Custom Discount (৳):</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 px-2 py-1 border border-slate-200 rounded-md text-right font-bold text-xs bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* LEFT: Product catalog (Cols: 7) - Order 2 on Mobile */}
      <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col space-y-4 lg:h-full h-auto min-w-0 lg:min-h-0">
        {/* Search and Category quick filters */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800">Terminal Sourcing Menu</h4>
            <span className="text-[10px] text-slate-400 font-bold">Catalog Index: {catalogList.length} items</span>
          </div>

          <div className="flex gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan SKU barcode or type name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>
          </div>

          {/* Quick Category Badges */}
          <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all shrink-0 cursor-pointer ${
                selectedCat === 'all'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-all shrink-0 cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {catalogList.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="font-semibold">No catalog products match current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {catalogList.map((prod) => {
                const isOut = prod.stock <= 0;
                const isLow = prod.stock <= prod.minStockAlert;
                const cartItem = cart.find((item) => item.product.id === prod.id);
                const cartQuantity = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOut && addToCart(prod)}
                    className={`rounded-2xl p-3 text-left shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer ${
                      isOut
                        ? 'bg-white border border-slate-100 opacity-40 cursor-not-allowed border-dashed'
                        : cartQuantity > 0
                        ? 'bg-blue-50/50 border-2 border-blue-400'
                        : 'bg-white border border-slate-100 hover:border-blue-200'
                    }`}
                  >
                    {/* Cart quantity badge */}
                    {cartQuantity > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm z-10 flex items-center space-x-1">
                        <ShoppingCart className="w-2.5 h-2.5" />
                        <span>{cartQuantity} added</span>
                      </div>
                    )}

                    {/* Interactive Quantity Control overlay on top-right of card */}
                    {!isOut && cartQuantity > 0 ? (
                      <div
                        className="absolute top-2 right-2 flex items-center bg-white border border-blue-300 rounded-xl p-0.5 shadow-md z-20 space-x-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Reduce (-) Button */}
                        <button
                          type="button"
                          title="Reduce product quantity"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateCartQuantity(prod.id, cartQuantity - 1);
                          }}
                          className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer font-black active:scale-95 border border-rose-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-5 text-center font-black text-xs text-blue-700">
                          {cartQuantity}
                        </span>

                        {/* Add (+) Button */}
                        <button
                          type="button"
                          title="Add product quantity"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod);
                          }}
                          disabled={cartQuantity >= prod.stock}
                          className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors cursor-pointer font-black active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      !isOut && (
                        <div className="absolute right-2 top-2 w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )
                    )}

                    <div className="space-y-2 w-full">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-24 rounded-xl object-cover bg-slate-50 border border-slate-100"
                      />
                      <div className="space-y-0.5">
                        <span className="font-mono text-[9px] text-slate-400 font-bold block">{prod.sku}</span>
                        <h5 className="font-bold text-slate-800 line-clamp-2 min-h-[32px]">{prod.name}</h5>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between w-full">
                      <span className="font-black text-xs text-slate-800">৳{Math.round(prod.price)}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          isOut
                            ? 'bg-rose-50 text-rose-500'
                            : isLow
                            ? 'bg-amber-50 text-amber-500'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isOut ? 'Stockout' : `${prod.stock} left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Processing Gateway Modal overlay */}
      {showPaymentModal && (
        <div
          onClick={() => setShowPaymentModal(false)}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-40 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Process Register Payment</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
              <div className="space-y-1 text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Receipt Grand Total</span>
                <p className="text-xl font-black text-blue-600">৳{Math.round(cartTotal)}</p>
              </div>

              {/* Optional Customer Name Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder={`Default: ${customer}`}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Payment Gateway Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center space-x-1.5 ${
                      paymentMethod === 'Cash'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <TakaIcon className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Mobile')}
                    className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center space-x-1.5 ${
                      paymentMethod === 'Mobile'
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>Mobile Banking</span>
                  </button>
                </div>
              </div>

              {/* Cash notice without received input */}
              {paymentMethod === 'Cash' && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 space-y-1 text-center">
                  <p className="font-bold text-xs">Cash Payment Selected</p>
                  <p className="text-[11px] text-emerald-600">Collect ৳{Math.round(cartTotal)} cash from customer.</p>
                </div>
              )}

              {/* Mobile Options (bKash, Nagad, Rocket) */}
              {paymentMethod === 'Mobile' && (
                <div className="space-y-2 pt-1">
                  <label className="font-bold text-slate-500 block">Select Mobile Provider *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileOption('bKash')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        mobileOption === 'bKash'
                          ? 'bg-pink-50 border-[#e2136e] text-[#e2136e] shadow-sm font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="px-2 py-0.5 rounded bg-[#e2136e] text-white text-[10px] font-black tracking-wider">bKash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileOption('Nagad')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        mobileOption === 'Nagad'
                          ? 'bg-amber-50 border-[#f7921e] text-[#f7921e] shadow-sm font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="px-2 py-0.5 rounded bg-[#f7921e] text-white text-[10px] font-black tracking-wider">Nagad</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMobileOption('Rocket')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        mobileOption === 'Rocket'
                          ? 'bg-purple-50 border-[#8c3494] text-[#8c3494] shadow-sm font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="px-2 py-0.5 rounded bg-[#8c3494] text-white text-[10px] font-black tracking-wider">Rocket</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-colors cursor-pointer"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Completed Invoice modal overlay */}
      {invoiceReceipt && (
        <div
          onClick={() => setInvoiceReceipt(null)}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Sale Completed Successfully!</h3>
              <div className="inline-block bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-mono font-bold text-[11px] my-1 border border-slate-200">
                SERIAL: {invoiceReceipt.receiptSerial || invoiceReceipt.invoiceNo}
              </div>
              <p className="text-[10px] text-slate-400">Invoice Ref: {invoiceReceipt.invoiceNo}</p>
            </div>

            {/* Receipt layout */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-3 font-mono text-[10px] text-slate-500">
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-200 pb-2">
                <p className="font-bold text-slate-700">DREAMSPOS RETAIL LTD</p>
                <p>{new Date(invoiceReceipt.date).toLocaleString()}</p>
                <p className="font-bold text-slate-800 mt-1">Customer: {invoiceReceipt.customerName}</p>
              </div>

              {/* Items */}
              <div className="space-y-1 border-b border-dashed border-slate-200 pb-2">
                {invoiceReceipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-slate-600 font-semibold">
                    <span>{item.productName} (x{item.quantity})</span>
                    <span>৳{Math.round(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Financial calculations */}
              <div className="space-y-0.5 text-slate-500 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{Math.round(invoiceReceipt.subtotal)}</span>
                </div>
                {invoiceReceipt.discount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount:</span>
                    <span>-৳{Math.round(invoiceReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-bold border-t border-dashed border-slate-200 pt-1.5 mt-1">
                  <span>GRAND TOTAL:</span>
                  <span>৳{Math.round(invoiceReceipt.total)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-600">
                  <span>Payment ({invoiceReceipt.paymentMethod}):</span>
                  <span>৳{Math.round(invoiceReceipt.paidAmount)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handlePrintReceipt(invoiceReceipt)}
                className="flex-1 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print receipt</span>
              </button>
              <button
                onClick={() => setInvoiceReceipt(null)}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/10 text-center cursor-pointer"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
