import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useInventory } from '../context/InventoryContext';
import { AppSelect } from '../components/AppSelect';
import { ArrowLeft, CheckSquare, Package, Plus, Minus } from 'lucide-react';

export const BulkStockManagementView: React.FC = () => {
  const { products, addStockAdjustment, setActiveView, currentUser } = useInventory();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [type, setType] = useState<'addition' | 'deduction'>('addition');
  const [reason, setReason] = useState<'Damage' | 'Theft' | 'Inventory Count' | 'Promotional Sample' | 'Other'>('Inventory Count');
  const [notes, setNotes] = useState('');

  const allSelected = products.length > 0 && products.every((product) => selectedIds.includes(product.id));

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
    setQuantities((current) => ({ ...current, [productId]: current[productId] || 1 }));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(products.map((product) => product.id));
    setQuantities((current) => Object.fromEntries(products.map((product) => [product.id, current[product.id] || 1])));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    if (currentUser?.role === 'Salesman') {
      await Swal.fire({
        icon: 'error',
        title: 'Permission Denied',
        text: 'Salesmen are not authorized to adjust stock.',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    const actionLabel = type === 'addition' ? 'increase' : 'decrease';
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Confirm stock update?',
      text: `You are about to ${actionLabel} stock for ${selectedIds.length} product${selectedIds.length === 1 ? '' : 's'}.`,
      showCancelButton: true,
      confirmButtonText: 'Confirm Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: type === 'addition' ? '#059669' : '#e11d48',
      cancelButtonColor: '#64748b',
    });

    if (!confirmation.isConfirmed) return;

    products.filter((product) => selectedIds.includes(product.id)).forEach((product) => {
      addStockAdjustment({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        type,
        quantity: Math.max(1, quantities[product.id] || 1),
        reason,
        notes,
        adjustedBy: currentUser?.username || 'administrator',
      });
    });

    setSelectedIds([]);
    setNotes('');
    await Swal.fire({
      icon: 'success',
      title: 'Stock Updated',
      text: `Stock was updated successfully for ${selectedIds.length} product${selectedIds.length === 1 ? '' : 's'}.`,
      confirmButtonColor: '#2563eb',
    });
  };

  const goBack = () => {
    window.history.pushState({}, '', '/manage-stock');
    setActiveView('manage-stock');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={goBack} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-blue-300 hover:text-blue-600" title="Back to Manage Stock">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Bulk Stock Management</h2>
            <p className="text-xs text-slate-500">Increase or decrease stock for multiple products and confirm all changes together.</p>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-700">{selectedIds.length} selected</span>
      </div>

      <form onSubmit={handleConfirm} className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button type="button" onClick={() => setType('addition')} className={`flex-1 rounded-lg px-2 py-2 font-bold ${type === 'addition' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'}`}><Plus className="mr-1 inline h-3.5 w-3.5" />Increase</button>
            <button type="button" onClick={() => setType('deduction')} className={`flex-1 rounded-lg px-2 py-2 font-bold ${type === 'deduction' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}><Minus className="mr-1 inline h-3.5 w-3.5" />Decrease</button>
          </div>
          <AppSelect value={reason} onChange={(e: any) => setReason(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 focus:border-blue-500 focus:outline-none">
            {type === 'addition' ? <><option value="Inventory Count">Inventory Count Correction</option><option value="Other">Other Receipt</option></> : <><option value="Damage">Damage / Spoilage</option><option value="Theft">Theft / Shrinkage</option><option value="Inventory Count">Inventory Count Correction</option><option value="Promotional Sample">Promotional Sample</option><option value="Other">Other Loss</option></>}
          </AppSelect>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 focus:border-blue-500 focus:outline-none" />
        </div>

        <div className="rounded-xl border border-blue-100 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">All Products</p>
            <button type="button" onClick={toggleAll} className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"><CheckSquare className="h-3.5 w-3.5" />{allSelected ? 'Clear All' : 'Select All'}</button>
          </div>
          <div className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
            {products.length > 0 ? products.map((product) => {
              const selected = selectedIds.includes(product.id);
              return (
                <div key={product.id} onClick={() => toggleProduct(product.id)} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${selected ? 'border-blue-200 bg-blue-50/60' : 'border-slate-100 bg-slate-50/40 hover:border-blue-200'}`}>
                  <input type="checkbox" checked={selected} onClick={(e) => e.stopPropagation()} onChange={() => toggleProduct(product.id)} className="h-4 w-4 accent-blue-600" aria-label={`Select ${product.name}`} />
                  {product.image ? <img src={product.image} alt="" className="h-9 w-9 rounded-md object-cover" /> : <Package className="h-5 w-5 text-slate-300" />}
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700">{product.name}</p><p className="text-[10px] text-slate-400">{product.sku} · Current stock: {product.stock}</p></div>
                  <input type="number" min="1" value={quantities[product.id] || 1} onClick={(e) => e.stopPropagation()} onChange={(e) => setQuantities((current) => ({ ...current, [product.id]: Math.max(1, Number(e.target.value)) }))} className="w-20 rounded-lg border border-slate-200 bg-white p-2 text-center text-xs font-bold text-slate-700 focus:border-blue-500 focus:outline-none" aria-label={`Quantity for ${product.name}`} />
                </div>
              );
            }) : <p className="p-6 text-center text-xs text-slate-400">No products available.</p>}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={selectedIds.length === 0} className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-300 ${type === 'addition' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-500 hover:bg-rose-600'}`}>
            Confirm and Update {selectedIds.length || ''} Products
          </button>
        </div>
      </form>
    </div>
  );
};
