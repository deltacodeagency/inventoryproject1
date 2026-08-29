import React from 'react';
import { useInventory } from '../context/InventoryContext';
import { ArrowLeft, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Building, Info, FileText, User, Calendar, Clock } from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const ProductDetailView: React.FC = () => {
  const {
    viewingProduct,
    setViewingProduct,
    setActiveView,
    categories,
    brands,
    suppliers
  } = useInventory();

  if (!viewingProduct) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-md mx-auto my-12 shadow-sm">
        <p className="text-sm font-semibold text-slate-500 mb-4">No product selected for details.</p>
        <button
          onClick={() => setActiveView('products')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Back to Product List
        </button>
      </div>
    );
  }

  // Find relationships
  const category = categories.find((c) => c.id === viewingProduct.categoryId);
  const brand = brands.find((b) => b.id === viewingProduct.brandId);
  const supplier = suppliers.find((s) => s.id === viewingProduct.supplierId);

  // Generate some realistic file info for the image
  const imageName = `${viewingProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'product'}.jpg`;
  // Semi-random deterministic file size based on name length
  const imageSize = `${((viewingProduct.name.length * 17) % 400) + 120}kb`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mobile-page-header flex items-center justify-between">
        <div>
          <h2 id="product-detail-title" className="text-xl font-bold text-slate-800 tracking-tight">Product Details</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Full details of a product</p>
        </div>
        
        <button
          onClick={() => {
            setViewingProduct(null);
            setActiveView('products');
          }}
          className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Product Specs Table (Takes 2 cols on large screen) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h3 className="font-bold text-slate-800 text-sm">Specification Sheet</h3>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
              viewingProduct.status === 'active' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-rose-50 text-rose-600 border border-rose-100'
            }`}>
              {viewingProduct.status}
            </span>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 w-1/3 bg-slate-50/30">Product</td>
                  <td className="p-4 font-semibold text-slate-800">{viewingProduct.name}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Category</td>
                  <td className="p-4 font-semibold text-slate-800">{category?.name || 'Unassigned'}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Brand</td>
                  <td className="p-4 font-semibold text-slate-800">{brand?.name || 'None'}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">SKU Code</td>
                  <td className="p-4 font-mono font-bold text-blue-600">{viewingProduct.sku}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Retail Price</td>
                  <td className="p-4 font-bold text-slate-800">৳{viewingProduct.price.toFixed(0)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Supplier Cost</td>
                  <td className="p-4 font-bold text-slate-400">৳{viewingProduct.cost.toFixed(0)}</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Stock Quantity</td>
                  <td className="p-4 font-black text-slate-800">
                    <span className={viewingProduct.stock <= viewingProduct.minStockAlert ? 'text-rose-600' : 'text-emerald-600'}>
                      {viewingProduct.stock} units
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Minimum Stock Alert Qty</td>
                  <td className="p-4 font-semibold text-slate-600">{viewingProduct.minStockAlert} units</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-500 bg-slate-50/30">Description</td>
                  <td className="p-4 text-slate-600 leading-relaxed">
                    <MarkdownRenderer content={viewingProduct.description} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Associated Supplier Card (Optional detail because it is useful) */}
          {supplier && (
            <div className="bg-blue-50/30 border border-blue-50/80 p-5 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs">
                <Building className="w-4 h-4" />
                <span>Supplier Contact Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{supplier.name} ({supplier.company})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
                {supplier.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product History & Audit Log */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-5 space-y-3.5 shadow-inner">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs border-b border-slate-200/50 pb-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Product History & Audit Log</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Created By */}
              <div className="flex items-start gap-2.5 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created By</span>
                  <span className="font-bold text-slate-700">{viewingProduct.createdBy || 'System Admin'}</span>
                </div>
              </div>

              {/* Created Date & Time */}
              <div className="flex items-start gap-2.5 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created At</span>
                  <span className="font-semibold text-slate-700">
                    {viewingProduct.createdAt 
                      ? new Date(viewingProduct.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Updated Date & Time */}
              <div className="flex items-start gap-2.5 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last Updated</span>
                  <span className="font-semibold text-slate-700">
                    {viewingProduct.updatedAt 
                      ? new Date(viewingProduct.updatedAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Image design / visual showcase */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-4">Product Showcase</h3>
            
            <div className="aspect-square w-full bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center p-6 shadow-inner relative group">
              <img
                src={viewingProduct.image}
                alt={viewingProduct.name}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-xl transition-all duration-300 group-hover:scale-105"
              />
            </div>
            
            <div className="text-center space-y-1 py-1">
              <p className="font-mono text-xs font-bold text-slate-700">{imageName}</p>
              <p className="font-mono text-[10px] text-slate-400 font-semibold">{imageSize}</p>
            </div>
          </div>

          {/* Pagination-style chevrons at bottom of card */}
          <div className="flex items-center justify-center space-x-4 border-t border-slate-50 pt-4">
            <button 
              disabled 
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed bg-slate-50/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showcase Navigation</span>
            <button 
              disabled 
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 cursor-not-allowed bg-slate-50/50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
