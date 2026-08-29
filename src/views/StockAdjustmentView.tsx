import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { AppSelect } from '../components/AppSelect';
import {
  Sliders,
  Plus,
  Search,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { StockAdjustment } from '../types';

export const StockAdjustmentView: React.FC = () => {
  const {
    products,
    adjustments,
    addStockAdjustment,
    currentUser,
    setActiveView,
  } = useInventory();

  // New adjustment form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [type, setType] = useState<'addition' | 'deduction'>('addition');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<'Damage' | 'Theft' | 'Inventory Count' | 'Promotional Sample' | 'Other'>('Inventory Count');
  const [notes, setNotes] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'addition' | 'deduction'>('all');
  const [filterReason, setFilterReason] = useState('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    addStockAdjustment({
      productId: selectedProductId,
      productName: prod.name,
      sku: prod.sku,
      type,
      quantity,
      reason,
      notes,
      adjustedBy: currentUser?.username || 'administrator',
    });

    // Reset state
    setSelectedProductId('');
    setType('addition');
    setQuantity(1);
    setReason('Inventory Count');
    setNotes('');
    setShowAddForm(false);
  };

  // Filtered adjustments
  const filteredAdjustments = adjustments.filter((adj) => {
    const matchesSearch =
      adj.productName.toLowerCase().includes(search.toLowerCase()) ||
      adj.sku.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || adj.type === filterType;
    const matchesReason = filterReason === 'all' || adj.reason === filterReason;

    return matchesSearch && matchesType && matchesReason;
  });

  return (
    <div className="stock-adjustment-page space-y-6">
      {/* View Header */}
      <div className="mobile-page-header flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Stock Adjustment Ledger</h2>
          </div>
          <p className="mobile-page-description text-xs text-slate-500">
            Log and audit discrepancies, spoilage, shrinkage, and write-offs.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => setActiveView('manage-stock')}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center whitespace-nowrap"
          >
            <span>Manage Stock</span>
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15 flex items-center justify-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Adjustment</span>
          </button>
        </div>
      </div>

      {/* Manual Record Form (Toggleable) */}
      {showAddForm && (
        <div className="w-full bg-white border border-slate-100 rounded-2xl p-6 shadow-md animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Record Manual Stock Change</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Selection */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-600">Select Inventory Product</label>
                <AppSelect
                  value={selectedProductId}
                  required
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 cursor-pointer transition-all hover:border-slate-300"
                >
                  <option value="">-- Select Product by Name or SKU --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      <span className="flex min-w-0 items-center gap-2">
                        <img src={p.image} alt="" className="h-6 w-6 shrink-0 rounded-md object-cover bg-slate-100" />
                        <span className="truncate">{p.name} ({p.sku}) - Stock: {p.stock}</span>
                      </span>
                    </option>
                  ))}
                </AppSelect>
              </div>

              {/* Type selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Adjustment Action</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('addition');
                      setReason('Inventory Count');
                    }}
                    className={`flex-1 py-2 rounded-lg border font-bold text-center transition-all ${
                      type === 'addition'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    + Add Stock (Inbound)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('deduction');
                      setReason('Damage');
                    }}
                    className={`flex-1 py-2 rounded-lg border font-bold text-center transition-all ${
                      type === 'deduction'
                        ? 'bg-rose-50 border-rose-500 text-rose-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    - Deduct Stock (Outbound)
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Primary Reason</label>
                <AppSelect
                  value={reason}
                  onChange={(e: any) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                >
                  {type === 'addition' ? (
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

              {/* Operator */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Authorized Officer</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.username || 'administrator'}
                  className="w-full p-2.5 border border-slate-100 rounded-lg bg-slate-50 font-bold text-slate-500"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-600">Notes / Audit Comments</label>
                <textarea
                  placeholder="Provide supporting details like incident report, box number, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-500/10"
              >
                Register Stock Change
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ledger Filter and Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold text-slate-600">
          {/* Search SKU/Product */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <AppSelect
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Action Types</option>
              <option value="addition">+ Addition (Inbound)</option>
              <option value="deduction">- Deduction (Losses)</option>
            </AppSelect>
          </div>

          {/* Reason Filter */}
          <div>
            <AppSelect
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Reasons</option>
              <option value="Damage">Damage / Spoilage</option>
              <option value="Theft">Theft / Shrinkage</option>
              <option value="Inventory Count">Inventory Count</option>
              <option value="Promotional Sample">Promotional Sample</option>
              <option value="Other">Other</option>
            </AppSelect>
          </div>
        </div>
      </div>

      {/* History Ledger Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-700 text-xs flex items-center">
            <History className="w-4 h-4 mr-1.5 text-blue-500" />
            Stock Adjustments Log ({filteredAdjustments.length} records)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">SKU / Product</th>
                <th className="p-4 text-center">Change Qty</th>
                <th className="p-4 text-center">Reason</th>
                <th className="p-4">Authorized By</th>
                <th className="p-4">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAdjustments.length > 0 ? (
                filteredAdjustments.map((adj) => {
                  const isAdd = adj.type === 'addition';
                  const product = products.find((p) => p.id === adj.productId);
                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-slate-800">
                          {new Date(adj.date).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {new Date(adj.date).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={product?.image}
                            alt={adj.productName}
                            className="h-10 w-10 shrink-0 rounded-lg object-cover bg-slate-100 border border-slate-100"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-bold text-slate-800 truncate max-w-[180px]">{adj.productName}</p>
                            <span className="font-mono text-[9px] text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded border block w-max">
                              {adj.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`font-black text-sm px-2.5 py-1 rounded-xl flex items-center justify-center w-max mx-auto space-x-1 ${
                            isAdd
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-500 border border-rose-100'
                          }`}
                        >
                          {isAdd ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isAdd ? '+' : '-'}
                            {adj.quantity}
                          </span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          adj.reason === 'Damage' || adj.reason === 'Theft'
                            ? 'bg-rose-50 text-rose-500'
                            : adj.reason === 'Inventory Count'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {adj.reason}
                        </span>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-slate-700 flex items-center">
                          <User className="w-3 h-3 mr-1 text-slate-400" />
                          {adj.adjustedBy}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 italic max-w-xs truncate" title={adj.notes}>
                        {adj.notes || 'No comments provided'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    No manual adjustments recorded in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
