import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { confirmToast } from '../lib/confirmToast';
import { AppSelect } from '../components/AppSelect';
import {
  Tags,
  Plus,
  Trash2,
  Edit2,
  Truck,
  Sparkles,
  Layers,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';

const generateCategoryCode = (categoryName: string) => {
  const words = categoryName.trim().toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length > 1) return words.map((word) => word[0]).join('').slice(0, 3);
  return (words[0] ?? '').slice(0, 3);
};

// ==========================================
// 1. CATEGORY VIEW COMPONENT
// ==========================================
export const CategoryView: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, { name, description, code: code.toUpperCase() });
    } else {
      addCategory({ name, description, code: code.toUpperCase() });
    }
    setName('');
    setDescription('');
    setCode('');
    setIsCodeManuallyEdited(false);
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleBulkDelete = () => {
    const count = selectedCategoryIds.length;
    confirmToast(`Are you sure you want to delete ${count} selected ${count > 1 ? 'categories' : 'category'}?`, () => {
      selectedCategoryIds.forEach((id) => {
        const productCount = products.filter((p) => p.categoryId === id).length;
        if (productCount === 0) {
          deleteCategory(id);
        }
      });
      setSelectedCategoryIds([]);
    });
  };

  const allDeletableCategories = categories.filter((cat) => {
    const count = products.filter((p) => p.categoryId === cat.id).length;
    return count === 0;
  });

  return (
    <div className="space-y-6">
      <div className="mobile-page-header flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Category Catalog</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Organize store catalog items into index groups</span>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCategoryIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedCategoryIds.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingCategory(null);
              setName('');
              setDescription('');
              setCode('');
              setIsCodeManuallyEdited(false);
              setShowForm(true);
            }}
            className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15 flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={categories.length > 0 && selectedCategoryIds.length === categories.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIds(categories.map((c) => c.id));
                      } else {
                        setSelectedCategoryIds([]);
                      }
                    }}
                    className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category Name</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Linked Products</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <tr
                    key={cat.id}
                    className={`hover:bg-slate-50/30 transition-colors ${
                      isSelected ? 'bg-blue-50/10' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds((prev) => [...prev, cat.id]);
                          } else {
                            setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                          }
                        }}
                        className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-400 text-[10px]">{cat.code}</td>
                    <td className="p-4 font-bold text-slate-800">{cat.name}</td>
                    <td className="p-4 text-slate-500 max-w-sm truncate">{cat.description}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {count} items
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setName(cat.name);
                          setCode(cat.code);
                          setDescription(cat.description || '');
                          setIsCodeManuallyEdited(true);
                          setShowForm(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all flex items-center justify-center cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (count > 0) {
                            return;
                          }
                          confirmToast(`Are you sure you want to delete the category "${cat.name}"?`, () => deleteCategory(cat.id));
                        }}
                        disabled={count > 0}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-40 disabled:hover:bg-rose-50 disabled:hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                        title={count > 0 ? "Cannot delete category with active products" : "Delete category"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {showForm && (
        <div
          onClick={() => {
            setEditingCategory(null);
            setShowForm(false);
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowForm(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smartwatches"
                  value={name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setName(nextName);
                    if (!editingCategory && !isCodeManuallyEdited) {
                      setCode(generateCategoryCode(nextName));
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">SKU Code Prefix (2-3 chars) *</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  placeholder="e.g. SW"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setIsCodeManuallyEdited(true);
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-700 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Description</label>
                <textarea
                  placeholder="Write description notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-600"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setShowForm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-colors"
                >
                  {editingCategory ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. BRAND VIEW COMPONENT
// ==========================================
export const BrandView: React.FC = () => {
  const { brands, products, addBrand, updateBrand, deleteBrand } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState('⭐');
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      updateBrand(editingBrand.id, { name, description, logo });
    } else {
      addBrand({ name, description, logo });
    }
    setName('');
    setDescription('');
    setLogo('⭐');
    setEditingBrand(null);
    setShowForm(false);
  };

  const handleBulkDelete = () => {
    const count = selectedBrandIds.length;
    confirmToast(`Are you sure you want to delete ${count} selected ${count > 1 ? 'brands' : 'brand'}?`, () => {
      selectedBrandIds.forEach((id) => {
        const productCount = products.filter((p) => p.brandId === id).length;
        if (productCount === 0) {
          deleteBrand(id);
        }
      });
      setSelectedBrandIds([]);
    });
  };

  return (
    <div className="space-y-6">
      <div className="mobile-page-header flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Brand Management</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Control registered manufacturing brands and catalogs</span>
        </div>
        <div className="flex items-center space-x-2">
          {selectedBrandIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedBrandIds.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingBrand(null);
              setName('');
              setDescription('');
              setLogo('⭐');
              setShowForm(true);
            }}
            className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15 flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={brands.length > 0 && selectedBrandIds.length === brands.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBrandIds(brands.map((b) => b.id));
                      } else {
                        setSelectedBrandIds([]);
                      }
                    }}
                    className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="p-4">Logo</th>
                <th className="p-4">Brand Name</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-center">Linked Products</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {brands.map((br) => {
                const count = products.filter((p) => p.brandId === br.id).length;
                const isSelected = selectedBrandIds.includes(br.id);
                return (
                  <tr
                    key={br.id}
                    className={`hover:bg-slate-50/30 transition-colors ${
                      isSelected ? 'bg-blue-50/10' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBrandIds((prev) => [...prev, br.id]);
                          } else {
                            setSelectedBrandIds((prev) => prev.filter((id) => id !== br.id));
                          }
                        }}
                        className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 text-xl">{br.logo}</td>
                    <td className="p-4 font-bold text-slate-800">{br.name}</td>
                    <td className="p-4 text-slate-500 max-w-sm truncate">{br.description}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {count} items
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingBrand(br);
                          setName(br.name);
                          setLogo(br.logo);
                          setDescription(br.description || '');
                          setShowForm(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all flex items-center justify-center cursor-pointer"
                        title="Edit brand"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (count > 0) {
                            return;
                          }
                          confirmToast(`Are you sure you want to delete the brand "${br.name}"?`, () => deleteBrand(br.id));
                        }}
                        disabled={count > 0}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-40 disabled:hover:bg-rose-50 disabled:hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                        title={count > 0 ? "Cannot delete brand with active products" : "Delete brand"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Brand Modal */}
      {showForm && (
        <div
          onClick={() => {
            setEditingBrand(null);
            setShowForm(false);
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingBrand ? 'Edit Brand' : 'Create New Brand'}
              </h3>
              <button
                onClick={() => {
                  setEditingBrand(null);
                  setShowForm(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sony"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Brand Icon / Emoji Symbol *</label>
                <AppSelect
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 font-bold text-slate-700 bg-white cursor-pointer transition-all hover:border-slate-300"
                >
                  <option value="⭐">⭐ Star</option>
                  <option value="🍎">🍎 Apple Logo</option>
                  <option value="🪐">🪐 Saturn Circle</option>
                  <option value="💻">💻 Laptop Screen</option>
                  <option value="🎵">🎵 Headphone Music</option>
                  <option value="💾">💾 Disk Storage</option>
                  <option value="⚡">⚡ Flash Power</option>
                </AppSelect>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Description</label>
                <textarea
                  placeholder="Write description notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-600"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBrand(null);
                    setShowForm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-colors"
                >
                  {editingBrand ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. SUPPLIER VIEW COMPONENT
// ==========================================
export const SupplierView: React.FC = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  
  // Supplier Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, { name, email, phone, company, taxId, address });
    } else {
      addSupplier({ name, email, phone, company, taxId, address });
    }
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setTaxId('');
    setAddress('');
    setEditingSupplier(null);
    setShowForm(false);
  };

  const handleBulkDelete = () => {
    const count = selectedSupplierIds.length;
    confirmToast(`Are you sure you want to delete ${count} selected ${count > 1 ? 'suppliers' : 'supplier'}?`, () => {
      selectedSupplierIds.forEach((id) => {
        const productCount = products.filter((p) => p.supplierId === id).length;
        if (productCount === 0) {
          deleteSupplier(id);
        }
      });
      setSelectedSupplierIds([]);
    });
  };

  return (
    <div className="space-y-6">
      <div className="mobile-page-header flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Supplier Directory</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Manage live wholesale supply lines and logistics</span>
        </div>
        <div className="flex items-center space-x-2">
          {selectedSupplierIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedSupplierIds.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingSupplier(null);
              setName('');
              setEmail('');
              setPhone('');
              setCompany('');
              setTaxId('');
              setAddress('');
              setShowForm(true);
            }}
            className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15 flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={suppliers.length > 0 && selectedSupplierIds.length === suppliers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSupplierIds(suppliers.map((s) => s.id));
                      } else {
                        setSelectedSupplierIds([]);
                      }
                    }}
                    className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="p-4">Company & Agent</th>
                <th className="p-4">Contact Detail</th>
                <th className="p-4">Logistics Address</th>
                <th className="p-4 text-center">Linked Products</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {suppliers.map((sup) => {
                const count = products.filter((p) => p.supplierId === sup.id).length;
                const isSelected = selectedSupplierIds.includes(sup.id);
                return (
                  <tr
                    key={sup.id}
                    className={`hover:bg-slate-50/30 transition-colors ${
                      isSelected ? 'bg-blue-50/10' : ''
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSupplierIds((prev) => [...prev, sup.id]);
                          } else {
                            setSelectedSupplierIds((prev) => prev.filter((id) => id !== sup.id));
                          }
                        }}
                        className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    {/* Agent / Company */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{sup.company}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block flex items-center">
                          <Briefcase className="w-3 h-3 mr-1 shrink-0" />
                          {sup.name}
                        </span>
                      </div>
                    </td>

                    {/* Contact details */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="text-slate-600 font-medium flex items-center">
                          <Mail className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                          {sup.email}
                        </span>
                        <span className="text-slate-400 text-[10px] flex items-center">
                          <Phone className="w-3 h-3 mr-1.5 shrink-0 text-slate-400" />
                          {sup.phone}
                        </span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="p-4 max-w-xs truncate text-slate-500">
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300 shrink-0" />
                        <span className="truncate">{sup.address}</span>
                      </div>
                    </td>

                    {/* Products count */}
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {count} items
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingSupplier(sup);
                          setName(sup.name);
                          setEmail(sup.email);
                          setPhone(sup.phone);
                          setCompany(sup.company);
                          setTaxId(sup.taxId);
                          setAddress(sup.address);
                          setShowForm(true);
                        }}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all flex items-center justify-center cursor-pointer"
                        title="Edit supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (count > 0) {
                            return;
                          }
                          confirmToast(`Are you sure you want to delete the supplier "${sup.name}"?`, () => deleteSupplier(sup.id));
                        }}
                        disabled={count > 0}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-40 disabled:hover:bg-rose-50 disabled:hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                        title={count > 0 ? "Cannot delete supplier with active products" : "Delete supplier"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showForm && (
        <div
          onClick={() => {
            setEditingSupplier(null);
            setShowForm(false);
          }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in select-none p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h3>
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setShowForm(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Distribution Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Agent Representative *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="sales@apex.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 123-45"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Warehouse Address</label>
                <textarea
                  placeholder="Logistics location address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-600"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier(null);
                    setShowForm(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-colors"
                >
                  {editingSupplier ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
