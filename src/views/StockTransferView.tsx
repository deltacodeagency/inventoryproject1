import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import Swal from 'sweetalert2';
import { AppSelect } from '../components/AppSelect';
import {
  ArrowLeftRight,
  Plus,
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Boxes,
  PlusCircle,
  Package
} from 'lucide-react';
import { StockTransfer } from '../types';

export const StockTransferView: React.FC = () => {
  const {
    products,
    transfers,
    addStockTransfer,
    updateStockTransferStatus,
  } = useInventory();

  // Transfer form toggle state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [sourceLocation, setSourceLocation] = useState<'Main Warehouse' | 'Downtown Store' | 'Uptown Store' | 'Westside Branch'>('Main Warehouse');
  const [destinationLocation, setDestinationLocation] = useState<'Main Warehouse' | 'Downtown Store' | 'Uptown Store' | 'Westside Branch'>('Downtown Store');
  const [status, setStatus] = useState<'Pending' | 'Completed' | 'Cancelled'>('Pending');

  // Search/Filters states
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;
    if (sourceLocation === destinationLocation) {
      Swal.fire({ icon: 'error', title: 'Invalid Location', text: 'Source and Destination locations must be different!', confirmButtonColor: '#2563eb' });
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if source is Downtown Store and they have enough stock to transfer out
    if (sourceLocation === 'Downtown Store' && prod.stock < quantity) {
      Swal.fire({ icon: 'error', title: 'Insufficient Stock', text: `Cannot transfer ${quantity} units. Only ${prod.stock} units are currently available in Downtown Store!`, confirmButtonColor: '#2563eb' });
      return;
    }

    addStockTransfer({
      productId: selectedProductId,
      productName: prod.name,
      sku: prod.sku,
      quantity,
      sourceLocation,
      destinationLocation,
      status,
    });

    // Reset state
    setSelectedProductId('');
    setQuantity(1);
    setSourceLocation('Main Warehouse');
    setDestinationLocation('Downtown Store');
    setStatus('Pending');
    setShowAddForm(false);
  };

  // Filter transfers
  const filteredTransfers = transfers.filter((trf) => {
    const matchesSearch =
      trf.productName.toLowerCase().includes(search.toLowerCase()) ||
      trf.sku.toLowerCase().includes(search.toLowerCase()) ||
      trf.transferNo.toLowerCase().includes(search.toLowerCase());

    const matchesSource = filterSource === 'all' || trf.sourceLocation === filterSource || trf.destinationLocation === filterSource;
    const matchesStatus = filterStatus === 'all' || trf.status === filterStatus;

    return matchesSearch && matchesSource && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mobile-page-header flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <ArrowLeftRight className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Stock Transfer Logistics</h2>
          </div>
          <p className="mobile-page-description text-xs text-slate-500">
            Dispatch, track, and receive stock transfers between central warehouses and multi-store branches.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15 flex items-center space-x-1.5 self-start"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Initiate New Transfer</span>
        </button>
      </div>

      {/* New Transfer Form */}
      {showAddForm && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-md max-w-xl animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>Initiate Stock Dispatch</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product selector */}
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-600">Product Item to Transfer</label>
                <AppSelect
                  value={selectedProductId}
                  required
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 cursor-pointer transition-all hover:border-slate-300"
                >
                  <option value="">-- Choose Product to Transfer --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Local Store Stock: {p.stock}
                    </option>
                  ))}
                </AppSelect>
              </div>

              {/* Source Location */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Source Location</label>
                <AppSelect
                  value={sourceLocation}
                  onChange={(e: any) => setSourceLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 cursor-pointer transition-all hover:border-slate-300"
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Downtown Store">Downtown Store (Active Local)</option>
                  <option value="Uptown Store">Uptown Store</option>
                  <option value="Westside Branch">Westside Branch</option>
                </AppSelect>
              </div>

              {/* Destination Location */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Destination Location</label>
                <AppSelect
                  value={destinationLocation}
                  onChange={(e: any) => setDestinationLocation(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 cursor-pointer transition-all hover:border-slate-300"
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Downtown Store">Downtown Store (Active Local)</option>
                  <option value="Uptown Store">Uptown Store</option>
                  <option value="Westside Branch">Westside Branch</option>
                </AppSelect>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                />
              </div>

              {/* Dispatch Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Initial Dispatch Status</label>
                <AppSelect
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-semibold text-slate-700 cursor-pointer transition-all hover:border-slate-300"
                >
                  <option value="Pending">Pending Dispatch (Awaiting Courier)</option>
                  <option value="Completed">Completed / Handed Over (Update Stock)</option>
                  <option value="Cancelled">Cancelled</option>
                </AppSelect>
              </div>
            </div>

            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-tight text-blue-700 font-medium">
                <strong>Inventory Impact:</strong> Completing transfers where <span className="underline">Downtown Store</span> is the destination immediately increases active local store stock levels. Setting Downtown Store as the source decreases our local stock.
              </p>
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md"
              >
                Register Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logistics Filter and Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-semibold text-slate-600">
          {/* Search SKU/Product */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transfer number, name, or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Location filter */}
          <div>
            <AppSelect
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Locations Combined</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Downtown Store">Downtown Store</option>
              <option value="Uptown Store">Uptown Store</option>
              <option value="Westside Branch">Westside Branch</option>
            </AppSelect>
          </div>

          {/* Status filter */}
          <div>
            <AppSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </AppSelect>
          </div>
        </div>
      </div>

      {/* Logistics History Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-700 text-xs flex items-center">
            <History className="w-4 h-4 mr-1.5 text-blue-500" />
            Cross-Location Transfer Ledger ({filteredTransfers.length} entries)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Transfer ID</th>
                <th className="p-4">Dispatch Timestamp</th>
                <th className="p-4">SKU / Item Description</th>
                <th className="p-4 text-center">Transfer Qty</th>
                <th className="p-4">Routing Path</th>
                <th className="p-4 text-center">Courier Status</th>
                <th className="p-4 text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((trf) => {
                  return (
                    <tr key={trf.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-black text-slate-800 block">
                          {trf.transferNo}
                        </span>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <span className="font-bold text-slate-800">
                          {new Date(trf.date).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {new Date(trf.date).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <p className="font-bold text-slate-800">{trf.productName}</p>
                        <span className="font-mono text-[9px] text-slate-400 uppercase bg-slate-50 px-1.5 py-0.5 rounded border block w-max">
                          {trf.sku}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-black text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100/50">
                          {trf.quantity} units
                        </span>
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center space-x-1 font-semibold text-slate-500">
                          <span className={trf.sourceLocation === 'Downtown Store' ? 'text-blue-600 font-bold underline' : 'text-slate-700'}>
                            {trf.sourceLocation}
                          </span>
                          <span>&rarr;</span>
                          <span className={trf.destinationLocation === 'Downtown Store' ? 'text-emerald-600 font-bold underline' : 'text-slate-700'}>
                            {trf.destinationLocation}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          {trf.status === 'Completed' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Completed</span>
                            </span>
                          ) : trf.status === 'Cancelled' ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold border border-rose-100 flex items-center space-x-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-500" />
                              <span>Cancelled</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-500 text-[10px] font-bold border border-amber-100 flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>In Transit</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {trf.status === 'Pending' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                // Check if source has enough stock for final delivery approval
                                const prod = products.find((p) => p.sku === trf.sku);
                                if (trf.sourceLocation === 'Downtown Store' && prod && prod.stock < trf.quantity) {
                                  Swal.fire({ icon: 'error', title: 'Insufficient Stock', text: `Local stock count is insufficient to fulfill this dispatch! (${prod.stock} units left, needs ${trf.quantity})`, confirmButtonColor: '#2563eb' });
                                  return;
                                }
                                updateStockTransferStatus(trf.id, 'Completed');
                              }}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors shadow-sm"
                            >
                              Deliver / Complete
                            </button>
                            <button
                              onClick={() => updateStockTransferStatus(trf.id, 'Cancelled')}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border rounded-lg font-bold text-[10px] transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold block text-right italic">
                            Archived Ledger
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                    No active stock dispatches registered.
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
