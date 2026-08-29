import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  AlertTriangle,
  Boxes,
  Truck,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Product } from '../types';

export const LowStockView: React.FC = () => {
  const {
    products,
    suppliers,
    updateProduct,
    addPurchase,
    addAlert
  } = useInventory();

  const [activeReplenish, setActiveReplenish] = useState<Product | null>(null);
  const [replenishQty, setReplenishQty] = useState(25);
  const [reorderStatus, setReorderStatus] = useState<'Received' | 'Ordered'>('Received');

  const lowStockItems = products.filter((p) => p.stock <= p.minStockAlert);

  const handleReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReplenish) return;

    // Create a Purchase Order
    const supplier = suppliers.find((s) => s.id === activeReplenish.supplierId);
    const supplierName = supplier ? supplier.name : 'Apex Distribution Inc.';

    addPurchase({
      supplierId: activeReplenish.supplierId,
      supplierName,
      items: [
        {
          productId: activeReplenish.id,
          productName: activeReplenish.name,
          quantity: Number(replenishQty),
          cost: activeReplenish.cost,
        },
      ],
      total: activeReplenish.cost * Number(replenishQty),
      status: reorderStatus,
    });

    // If marked as 'Received', update product stock directly
    if (reorderStatus === 'Received') {
      updateProduct(activeReplenish.id, {
        stock: activeReplenish.stock + Number(replenishQty),
      });
      addAlert('system', 'Stock Replenished', `Received ${replenishQty} units of ${activeReplenish.name} directly into warehouse stock.`);
    }

    setActiveReplenish(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-base font-bold text-slate-800">Low Stock Control</h3>
        <span className="text-[10px] text-slate-400 block -mt-0.5">Real-time stock alerts and direct supplier procurement</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="mobile-page-header flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800">Active Stock Alarms</h4>
            <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-600 font-extrabold text-[10px]">
              {lowStockItems.length} Alarms Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3">
                <Boxes className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs">No low stock alarms active!</p>
                <span className="text-[10px] text-slate-400 block">All warehouse bins are within optimal tolerances</span>
              </div>
            ) : (
              lowStockItems.map((prod) => {
                const supplier = suppliers.find((s) => s.id === prod.supplierId);
                const isCritical = prod.stock <= 0;
                const isSeverelyLow = prod.stock > 0 && prod.stock <= 2;

                return (
                  <div key={prod.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-slate-800 truncate">{prod.name}</h5>
                        <p className="text-[10px] text-slate-400 font-semibold mb-1">SKU: {prod.sku}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            isCritical
                              ? 'bg-rose-100 text-rose-700 animate-pulse'
                              : isSeverelyLow
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {isCritical ? 'Critical Stockout' : isSeverelyLow ? 'Severe Depletion' : 'Shortage Warning'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold">
                            Supplier: {supplier ? supplier.name : 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Current Stock</span>
                        <span className="text-sm font-black text-rose-600">{prod.stock} <span className="text-[10px] text-slate-400 font-semibold">/ {prod.minStockAlert} alert</span></span>
                      </div>

                      <button
                        onClick={() => setActiveReplenish(prod)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 flex items-center space-x-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Procure</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Informative Side Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4 relative overflow-hidden self-start">
          <div className="space-y-1 z-10 relative">
            <h4 className="font-bold text-sm text-blue-400 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-blue-400" />
              Real-time Alert Logic
            </h4>
            <p className="text-xs text-slate-400">Our stock alarms match live product quantities against minimum threshold constants.</p>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800 z-10 relative text-xs">
            <div className="space-y-1">
              <span className="font-bold text-rose-400 uppercase tracking-wider text-[9px]">Critical Level (0 units)</span>
              <p className="text-slate-400 text-[11px]">Triggers full terminal purchase blockage. POS register disables sales item.</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[9px]">Depletion Level (1-2 units)</span>
              <p className="text-slate-400 text-[11px]">Triggers header notifications blinking alarms to cashier workspace.</p>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Replenish procure dialog */}
      {activeReplenish && (
        <div
          onClick={() => setActiveReplenish(null)}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Create Procurement Sourcing</h3>
              <button
                onClick={() => setActiveReplenish(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplenishSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Procurement Product</label>
                <p className="font-semibold text-slate-800">{activeReplenish.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">SKU: {activeReplenish.sku} | Unit Cost: ৳{Math.round(activeReplenish.cost)}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Procure Quantity (Units)</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Total Purchase Sourcing Cost</label>
                <p className="text-sm font-black text-slate-800">${(activeReplenish.cost * replenishQty).toFixed(2)}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Order Delivery Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReorderStatus('Received')}
                    className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                      reorderStatus === 'Received'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    Directly Received
                  </button>
                  <button
                    type="button"
                    onClick={() => setReorderStatus('Ordered')}
                    className={`p-2 rounded-lg border font-semibold text-center transition-all ${
                      reorderStatus === 'Ordered'
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    Pending Order
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReplenish(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-colors"
                >
                  Confirm Sourcing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
