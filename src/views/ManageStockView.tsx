import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Swal from 'sweetalert2';
import { AppSelect } from '../components/AppSelect';
import {
  Search,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Truck,
  Plus,
  Minus,
  History
} from 'lucide-react';
import { Product } from '../types';

export const ManageStockView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    suppliers,
    addStockAdjustment,
    setActiveView,
    currentUser,
  } = useInventory();

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, in_stock, low_stock, out_of_stock

  // Adjustment Modal/Panel states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'addition' | 'deduction'>('addition');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<'Damage' | 'Theft' | 'Inventory Count' | 'Promotional Sample' | 'Other'>('Inventory Count');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [showAdjustForm, setShowAdjustForm] = useState(false);

  // Bulk adjustment states
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkType, setBulkType] = useState<'addition' | 'deduction'>('addition');
  const [bulkQty, setBulkQty] = useState(1);
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({});
  const [bulkReason, setBulkReason] = useState<'Damage' | 'Theft' | 'Inventory Count' | 'Promotional Sample' | 'Other'>('Inventory Count');
  const [bulkNotes, setBulkNotes] = useState('');

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || p.brandId === selectedBrand;

    let matchesStatus = true;
    if (selectedStatus === 'in_stock') {
      matchesStatus = p.stock > p.minStockAlert;
    } else if (selectedStatus === 'low_stock') {
      matchesStatus = p.stock <= p.minStockAlert && p.stock > 0;
    } else if (selectedStatus === 'out_of_stock') {
      matchesStatus = p.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  const handleOpenAdjust = (product: Product, type: 'addition' | 'deduction') => {
    setSelectedProduct(product);
    setAdjustType(type);
    setAdjustQty(1);
    setAdjustReason('Inventory Count');
    setAdjustNotes('');
    setShowAdjustForm(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty <= 0) return;

    addStockAdjustment({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      type: adjustType,
      quantity: adjustQty,
      reason: adjustReason,
      notes: adjustNotes,
      adjustedBy: currentUser?.username || 'administrator',
    });

    // Reset and close
    setSelectedProduct(null);
    setShowAdjustForm(false);
  };

  const toggleBulkProduct = (productId: string) => {
    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        setBulkQuantities((quantities) => {
          const next = { ...quantities };
          delete next[productId];
          return next;
        });
        return current.filter((id) => id !== productId);
      }

      setBulkQuantities((quantities) => ({ ...quantities, [productId]: quantities[productId] || bulkQty }));
      return [...current, productId];
    });
  };

  const allFilteredProductsSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product.id));

  const toggleSelectAllFiltered = () => {
    setSelectedProductIds((current) => {
      if (allFilteredProductsSelected) {
        const visibleIds = new Set<string>(filteredProducts.map((product) => product.id));
        setBulkQuantities((quantities) => {
          const next = { ...quantities };
          visibleIds.forEach((id) => delete next[id]);
          return next;
        });
        return current.filter((id) => !visibleIds.has(id));
      }

      setBulkQuantities((quantities) => {
        const next = { ...quantities };
        filteredProducts.forEach((product) => {
          next[product.id] = next[product.id] || bulkQty;
        });
        return next;
      });
      return Array.from(new Set([...current, ...filteredProducts.map((product) => product.id)]));
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProducts = products.filter((product) => selectedProductIds.includes(product.id));

    if (selectedProducts.length === 0 || bulkQty <= 0) return;
    if (currentUser?.role === 'Salesman') {
      Swal.fire({ icon: 'error', title: 'Permission Denied', text: 'Salesmen are not authorized to adjust stock.', confirmButtonColor: '#2563eb' });
      return;
    }

    selectedProducts.forEach((product) => {
      addStockAdjustment({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type: bulkType,
        quantity: bulkQuantities[product.id] || bulkQty,
        reason: bulkReason,
        notes: bulkNotes,
        adjustedBy: currentUser?.username || 'administrator',
      });
    });

    setSelectedProductIds([]);
    setBulkQuantities({});
    setBulkMode(false);
    setBulkQty(1);
    setBulkNotes('');
  };

  return (
    <div className="manage-stock-page space-y-6">
      {/* Page Header */}
      <div className="mobile-page-header flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Manage Stock Level</h2>
          </div>
          <p className="mobile-page-description text-xs text-slate-500">
            Real-time control over physical warehouse stock quantities, alerts, and quick counts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/bulk-stock');
              setActiveView('bulk-stock');
              setBulkMode(false);
              setSelectedProductIds([]);
              setBulkQuantities({});
            }}
            className={`px-4 py-2.5 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm border ${bulkMode ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Stock Management</span>
          </button>
          <button
            onClick={() => setActiveView('stock-adjustment')}
            className="px-4 py-2.5 bg-[#1B283F] text-slate-200 hover:text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors flex items-center space-x-1.5 shadow-sm border border-slate-700/30"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Adjustment Logs</span>
          </button>
        </div>
      </div>

      {bulkMode && (
        <form onSubmit={handleBulkSubmit} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Bulk Stock Management</h3>
              <p className="text-[11px] text-slate-500">Select products below, then set a separate increase or decrease quantity for each item.</p>
            </div>
            <span className="text-xs font-bold text-blue-700">{selectedProductIds.length} selected</span>
          </div>

          <div className="rounded-xl border border-blue-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">All Products</p>
              <button type="button" onClick={toggleSelectAllFiltered} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
                {allFilteredProductsSelected ? 'Clear All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleBulkProduct(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') toggleBulkProduct(product.id);
                    }}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${isSelected ? 'border-blue-200 bg-blue-50/60' : 'border-slate-100 bg-slate-50/40 hover:border-blue-200 hover:bg-blue-50/30'}`}
                  >
                    <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onChange={() => toggleBulkProduct(product.id)} aria-label={`Select ${product.name}`} className="h-4 w-4 accent-blue-600" />
                    {product.image ? <img src={product.image} alt="" className="h-8 w-8 rounded-md object-cover" /> : <Package className="h-5 w-5 text-slate-300" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-700">{product.name}</p>
                      <p className="text-[10px] text-slate-400">{product.sku} · Current stock: {product.stock}</p>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={bulkQuantities[product.id] || bulkQty}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onChange={(e) => setBulkQuantities((quantities) => ({ ...quantities, [product.id]: Math.max(1, Number(e.target.value)) }))}
                      className="w-20 rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                      aria-label={`Quantity for ${product.name}`}
                    />
                  </div>
                );
              }) : <p className="p-4 text-center text-xs text-slate-400">No products match the current filters.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button type="button" onClick={() => setBulkType('addition')} className={`flex-1 rounded-lg px-2 py-2 font-bold ${bulkType === 'addition' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}>
                Increase Stock
              </button>
              <button type="button" onClick={() => setBulkType('deduction')} className={`flex-1 rounded-lg px-2 py-2 font-bold ${bulkType === 'deduction' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}>
                Decrease Stock
              </button>
            </div>
            <AppSelect value={bulkReason} onChange={(e: any) => setBulkReason(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 focus:border-blue-500 focus:outline-none">
              {bulkType === 'addition' ? (
                <><option value="Inventory Count">Inventory Count Correction</option><option value="Other">Other Receipt</option></>
              ) : (
                <><option value="Damage">Damage / Spoilage</option><option value="Theft">Theft / Shrinkage</option><option value="Inventory Count">Inventory Count Correction</option><option value="Promotional Sample">Promotional Sample</option><option value="Other">Other Loss</option></>
              )}
            </AppSelect>
            <input value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)} placeholder="Notes (optional)" className="rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 focus:border-blue-500 focus:outline-none" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => { setSelectedProductIds([]); setBulkQuantities({}); setBulkMode(false); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={selectedProductIds.length === 0} className={`rounded-xl px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${bulkType === 'addition' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}`}>
              Apply to {selectedProductIds.length || 'selected'} Products
            </button>
          </div>
        </form>
      )}

      {/* Stock Cards Info */}
      <div className="grid grid-cols-2 gap-4 max-[639px]:gap-2 lg:grid-cols-4">
        {/* Total SKUs */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-[639px]:rounded-xl max-[639px]:p-2.5">
          <div className="space-y-1 max-[639px]:space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 max-[639px]:text-[8px] max-[639px]:leading-3">Total Active SKUs</span>
            <p className="text-xl font-black text-slate-800 max-[639px]:text-base">{products.length}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 max-[639px]:h-7 max-[639px]:w-7 max-[639px]:rounded-lg">
            <Package className="h-5 w-5 max-[639px]:h-3.5 max-[639px]:w-3.5" />
          </div>
        </div>

        {/* Well Stocked */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-[639px]:rounded-xl max-[639px]:p-2.5">
          <div className="space-y-1 max-[639px]:space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 max-[639px]:text-[8px] max-[639px]:leading-3">Well Stocked Items</span>
            <p className="text-xl font-black text-emerald-600 max-[639px]:text-base">
              {products.filter((p) => p.stock > p.minStockAlert).length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 max-[639px]:h-7 max-[639px]:w-7 max-[639px]:rounded-lg">
            <CheckCircle2 className="h-5 w-5 max-[639px]:h-3.5 max-[639px]:w-3.5" />
          </div>
        </div>

        {/* Low Stock Warn */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-[639px]:rounded-xl max-[639px]:p-2.5">
          <div className="space-y-1 max-[639px]:space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 max-[639px]:text-[8px] max-[639px]:leading-3">Low Stock Warnings</span>
            <p className="text-xl font-black text-amber-500 max-[639px]:text-base">
              {products.filter((p) => p.stock <= p.minStockAlert && p.stock > 0).length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 max-[639px]:h-7 max-[639px]:w-7 max-[639px]:rounded-lg">
            <AlertTriangle className="h-5 w-5 max-[639px]:h-3.5 max-[639px]:w-3.5" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm max-[639px]:rounded-xl max-[639px]:p-2.5">
          <div className="space-y-1 max-[639px]:space-y-0.5">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 max-[639px]:text-[8px] max-[639px]:leading-3">Out of Stock</span>
            <p className="text-xl font-black text-rose-600 max-[639px]:text-base">
              {products.filter((p) => p.stock === 0).length}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500 max-[639px]:h-7 max-[639px]:w-7 max-[639px]:rounded-lg">
            <XCircle className="h-5 w-5 max-[639px]:h-3.5 max-[639px]:w-3.5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Search SKU or Name */}
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product SKU code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          {/* Category Filter */}
          <div>
            <AppSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </AppSelect>
          </div>

          {/* Status Filter */}
          <div>
            <AppSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-700 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="in_stock">Well Stocked</option>
              <option value="low_stock">Low Stock Alerts</option>
              <option value="out_of_stock">Out of Stock</option>
            </AppSelect>
          </div>
        </div>
      </div>

      {/* Products Stock Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                {bulkMode && (
                  <th className="p-4 text-center">
                    <input type="checkbox" checked={allFilteredProductsSelected} onChange={toggleSelectAllFiltered} aria-label="Select all visible products" className="h-4 w-4 accent-blue-600" />
                  </th>
                )}
                <th className="p-4">SKU / Item Details</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Safety Alert Threshold</th>
                <th className="p-4 text-center">Stock Level</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Quick Stock Mod</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isOut = p.stock === 0;
                  const isLow = p.stock <= p.minStockAlert && p.stock > 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {bulkMode && (
                        <td className="p-4 text-center">
                          <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => toggleBulkProduct(p.id)} aria-label={`Select ${p.name}`} className="h-4 w-4 accent-blue-600" />
                        </td>
                      )}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center space-x-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-lg object-cover border border-slate-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 block w-max">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-50/70 text-blue-600 font-bold px-2 py-0.5 rounded-lg border border-blue-100/40">
                          {cat ? cat.name : 'General'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-mono text-slate-500 font-bold">{p.minStockAlert} units</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-black text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-500' : 'text-slate-800'}`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                              <span>Out of Stock</span>
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 text-[10px] font-bold border border-amber-100 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              <span>Well Stocked</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenAdjust(p, 'addition')}
                            title="Add / Inbound Stock"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors border border-emerald-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjust(p, 'deduction')}
                            title="Deduct / Outbound Stock"
                            className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors border border-rose-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={bulkMode ? 7 : 6} className="p-8 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Level Dialog */}
      {showAdjustForm && selectedProduct && (
        <div
          onClick={() => setShowAdjustForm(false)}
          className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                {adjustType === 'addition' ? (
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <MinusCircle className="w-4 h-4 text-rose-500" />
                )}
                <span>
                  {adjustType === 'addition' ? 'Add / Inbound' : 'Remove / Outbound'} Stock Quantity
                </span>
              </h3>
              <button
                onClick={() => setShowAdjustForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4 text-xs">
              {/* Product Info Summary */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} referrerPolicy="no-referrer" className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300">
                    <Package className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Product To Adjust</span>
                  <p className="truncate font-bold text-slate-800 text-sm">{selectedProduct.name}</p>
                  <div className="flex justify-between items-center pt-1 font-semibold text-[10px] text-slate-500">
                    <span>SKU: {selectedProduct.sku}</span>
                    <span>Current Stock: <strong className="text-slate-700">{selectedProduct.stock}</strong></span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Quantity to {adjustType === 'addition' ? 'Add' : 'Deduct'}</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdjustQty(Math.max(1, adjustQty - 1))}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                    className="flex-1 text-center font-bold text-slate-800 border p-2 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustQty(adjustQty + 1)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Adjustment Reason</label>
                <AppSelect
                  value={adjustReason}
                  onChange={(e: any) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 cursor-pointer transition-all hover:border-slate-300"
                >
                  {adjustType === 'addition' ? (
                    <>
                      <option value="Inventory Count">Inventory Count Correction</option>
                      <option value="Other">Other Receipt</option>
                    </>
                  ) : (
                    <>
                      <option value="Damage">Damage / Spoilage</option>
                      <option value="Theft">Theft / Shrinkage</option>
                      <option value="Inventory Count">Inventory Count Correction</option>
                      <option value="Promotional Sample">Promotional Sample</option>
                      <option value="Other">Other Loss</option>
                    </>
                  )}
                </AppSelect>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Notes / Observations</label>
                <textarea
                  placeholder="e.g. Discovered water damage on outer shell..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustForm(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors font-bold text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white rounded-xl shadow-lg transition-colors font-bold text-center ${
                    adjustType === 'addition'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/15'
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/15'
                  }`}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
