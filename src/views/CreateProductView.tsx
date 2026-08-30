import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useInventory } from '../context/InventoryContext';
import { uploadImageToImgBB } from '../lib/image-upload';
import Swal from 'sweetalert2';
import { AppSelect } from '../components/AppSelect';
import {
  RotateCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  X,
  Info,
  Coins,
  Image as ImageIcon,
  Plus,
  PlusCircle,
  ListOrdered,
  List,
  Bold,
  Italic,
  Underline,
  User,
  Calendar,
  Clock,
  Boxes,
  Layers
} from 'lucide-react';

const generateCategoryCode = (categoryName: string) => {
  const words = categoryName.trim().toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length > 1) return words.map((word) => word[0]).join('').slice(0, 3);
  return (words[0] ?? '').slice(0, 3);
};

export const CreateProductView: React.FC = () => {
  const {
    categories,
    brands,
    suppliers,
    addProduct,
    updateProduct,
    products,
    setActiveView,
    addCategory,
    addBrand,
    addSupplier,
    editingProduct,
    setEditingProduct,
    addStockAdjustment,
    currentUser,
  } = useInventory();

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantityAlert, setQuantityAlert] = useState('5');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Quick Stock Adjustment State
  const [quickAdjustType, setQuickAdjustType] = useState<'addition' | 'deduction'>('addition');
  const [quickAdjustQty, setQuickAdjustQty] = useState<number>(1);
  const [quickAdjustReason, setQuickAdjustReason] = useState<'Inventory Count' | 'Damage' | 'Theft' | 'Promotional Sample' | 'Other'>('Inventory Count');
  const [quickAdjustNotes, setQuickAdjustNotes] = useState('');

  // Images State (Empty by default per user request)
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Collapsible accordion panels states
  const [productInfoOpen, setProductInfoOpen] = useState(true);
  const [pricingStockOpen, setPricingStockOpen] = useState(true);
  const [imagesOpen, setImagesOpen] = useState(true);
  const [quickAdjustOpen, setQuickAdjustOpen] = useState(true);
  const [auditLogOpen, setAuditLogOpen] = useState(true);

  // WYSIWYG style states for interactive formatting toggle
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);

  // Add Category Modal State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [isNewCatCodeManuallyEdited, setIsNewCatCodeManuallyEdited] = useState(false);

  // Add Brand Modal State
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');

  // Add Supplier Modal State
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCompany, setNewSupplierCompany] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  // Pending auto-selections
  const [pendingCategoryName, setPendingCategoryName] = useState<string | null>(null);
  const [pendingBrandName, setPendingBrandName] = useState<string | null>(null);
  const [pendingSupplierName, setPendingSupplierName] = useState<string | null>(null);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync auto-selections on updates
  useEffect(() => {
    if (pendingCategoryName) {
      const found = categories.find((c) => c.name.toLowerCase() === pendingCategoryName.toLowerCase());
      if (found) {
        setCategoryId(found.id);
        setPendingCategoryName(null);
      }
    }
  }, [categories, pendingCategoryName]);

  useEffect(() => {
    if (pendingBrandName) {
      const found = brands.find((b) => b.name.toLowerCase() === pendingBrandName.toLowerCase());
      if (found) {
        setBrandId(found.id);
        setPendingBrandName(null);
      }
    }
  }, [brands, pendingBrandName]);

  useEffect(() => {
    if (pendingSupplierName) {
      const found = suppliers.find((s) => s.name.toLowerCase() === pendingSupplierName.toLowerCase());
      if (found) {
        setSupplierId(found.id);
        setPendingSupplierName(null);
      }
    }
  }, [suppliers, pendingSupplierName]);

  // Disable background body scroll when any modal is active
  useEffect(() => {
    const isAnyModalOpen = showAddCatModal || showAddBrandModal || showAddSupplierModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddCatModal, showAddBrandModal, showAddSupplierModal]);

  // Convert Markdown descriptions to HTML format for WYSIWYG
  const markdownToHtml = (md: string): string => {
    if (!md) return '';
    const hasHtml = /<[a-z][\s\S]*>/i.test(md);
    if (hasHtml) return md;

    let html = md;
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/<u>([^<]+)<\/u>/gi, '<u>$1</u>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    const lines = html.split('\n');
    const resultLines: string[] = [];
    let inUl = false;
    let inOl = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('# ')) {
        if (inUl) { resultLines.push('</ul>'); inUl = false; }
        if (inOl) { resultLines.push('</ol>'); inOl = false; }
        resultLines.push(`<h1>${trimmed.substring(2)}</h1>`);
        continue;
      }
      if (trimmed.startsWith('## ')) {
        if (inUl) { resultLines.push('</ul>'); inUl = false; }
        if (inOl) { resultLines.push('</ol>'); inOl = false; }
        resultLines.push(`<h2>${trimmed.substring(3)}</h2>`);
        continue;
      }
      if (trimmed.startsWith('- ')) {
        if (inOl) { resultLines.push('</ol>'); inOl = false; }
        if (!inUl) { resultLines.push('<ul>'); inUl = true; }
        resultLines.push(`<li>${trimmed.substring(2)}</li>`);
        continue;
      }
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (inUl) { resultLines.push('</ul>'); inUl = false; }
        if (!inOl) { resultLines.push('<ol>'); inOl = true; }
        resultLines.push(`<li>${olMatch[2]}</li>`);
        continue;
      }
      if (trimmed === '') {
        if (inUl) { resultLines.push('</ul>'); inUl = false; }
        if (inOl) { resultLines.push('</ol>'); inOl = false; }
        resultLines.push('<br>');
        continue;
      }
      if (inUl) { resultLines.push('</ul>'); inUl = false; }
      if (inOl) { resultLines.push('</ol>'); inOl = false; }
      resultLines.push(`<p>${line}</p>`);
    }

    if (inUl) resultLines.push('</ul>');
    if (inOl) resultLines.push('</ol>');

    return resultLines.join('');
  };

  const updateToolbarStates = () => {
    setBoldActive(document.queryCommandState('bold'));
    setItalicActive(document.queryCommandState('italic'));
    setUnderlineActive(document.queryCommandState('underline'));
  };

  const execEditorCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
    }
    updateToolbarStates();
  };

  const saveSelection = (): Range | null => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range: Range | null) => {
    if (range) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const insertLink = () => {
    const savedRange = saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : '';

    const url = prompt('Enter the link URL:', 'https://');
    if (url === null) return; // User cancelled

    restoreSelection(savedRange);

    if (!selectedText) {
      const linkText = prompt('Enter the link text:', 'Link');
      if (!linkText) return;
      const linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      execEditorCommand('insertHTML', linkHtml);
    } else {
      execEditorCommand('createLink', url);
    }
  };

  const applyHeading = (tag: string) => {
    execEditorCommand('formatBlock', tag);
  };

  // Set default category, brand, and supplier if available
  useEffect(() => {
    if (editingProduct) return; // Skip default state if editing
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
    if (brands.length > 0 && !brandId) {
      setBrandId(brands[0].id);
    }
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [categories, brands, suppliers, editingProduct]);

  // Pre-fill form state when editingProduct is selected
  useEffect(() => {
    let targetDescription = '';
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategoryId(editingProduct.categoryId);
      setBrandId(editingProduct.brandId);
      setSupplierId(editingProduct.supplierId || '');
      targetDescription = editingProduct.description || '';
      setDescription(targetDescription);
      setQuantity(String(editingProduct.stock));
      setSellPrice(String(Math.round(editingProduct.price)));
      setBuyPrice(String(Math.round(editingProduct.cost)));
      setQuantityAlert(String(editingProduct.minStockAlert));
      setImages(editingProduct.image ? [editingProduct.image] : []);
      setStatus(editingProduct.status || 'active');
    } else {
      setName('');
      setSku('');
      setCategoryId(categories[0]?.id || '');
      setBrandId(brands[0]?.id || '');
      setSupplierId(suppliers[0]?.id || '');
      targetDescription = '';
      setDescription('');
      setQuantity('');
      setSellPrice('');
      setBuyPrice('');
      setQuantityAlert('5');
      setImages([]);
      setStatus('active');
    }

    // Sync contentEditable HTML representation of description
    if (editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(targetDescription);
    }
  }, [editingProduct, categories, brands, suppliers]);

  // Dynamic SKU preview and automatic generation
  useEffect(() => {
    if (editingProduct) return; // Do not auto-generate SKU if we are editing an existing product
    
    const category = categories.find((c) => c.id === categoryId);
    const brand = brands.find((b) => b.id === brandId);
    
    const catCode = category ? category.code : 'GEN';
    const brandCode = brand ? brand.name.substring(0, 3).toUpperCase() : 'GEN';
    const count = products.filter((pr) => pr.categoryId === categoryId).length + 1;
    const autoSku = `${catCode}-${brandCode}-${String(count).padStart(3, '0')}`;
    setSku(autoSku);
  }, [categoryId, brandId, categories, brands, products, editingProduct]);

  // Generates a random SKU when the orange "Generate" button is clicked
  const handleGenerateSku = () => {
    const category = categories.find((c) => c.id === categoryId);
    const catCode = category ? category.code : 'PROD';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setSku(`${catCode}-${randomNum}`);
  };

  // Handles adding a category inline
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatCode) return;

    addCategory({
      name: newCatName.trim(),
      code: newCatCode.trim().toUpperCase(),
      description: `Custom category: ${newCatName.trim()}`
    });

    setPendingCategoryName(newCatName.trim());
    setNewCatName('');
    setNewCatCode('');
    setIsNewCatCodeManuallyEdited(false);
    setShowAddCatModal(false);
  };

  // Handles adding a brand inline
  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;

    addBrand({
      name: newBrandName.trim(),
      description: newBrandDescription.trim() || `Custom brand: ${newBrandName.trim()}`,
      logo: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=100&auto=format&fit=crop&q=80'
    });

    setPendingBrandName(newBrandName.trim());
    setNewBrandName('');
    setNewBrandDescription('');
    setShowAddBrandModal(false);
  };

  // Handles adding a supplier inline
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName) return;

    addSupplier({
      name: newSupplierName.trim(),
      email: newSupplierEmail.trim() || 'supplier@example.com',
      phone: newSupplierPhone.trim() || '01700000000',
      company: newSupplierCompany.trim() || newSupplierName.trim(),
      taxId: '',
      address: 'Custom Supplier Address'
    });

    setPendingSupplierName(newSupplierName.trim());
    setNewSupplierName('');
    setNewSupplierCompany('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setShowAddSupplierModal(false);
  };

  // Triggers hidden file selector
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      // Allow selecting the same file again after replacing or deleting it.
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Upload selected product images to ImgBB before storing their URLs in Neon.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // This form supports one product photo. Keep the input ready for the
    // next selection even when the same file is chosen again.
    e.target.value = '';

    const oversizedFile = Array.from(files as FileList).find((f: File) => f.size > 8 * 1024 * 1024);
    if (oversizedFile) {
      Swal.fire({ icon: 'error', title: 'File Too Large', text: `Image "${oversizedFile.name}" is too large. Please select images under 8MB.`, confirmButtonColor: '#2563eb' });
      return;
    }

    setIsUploadingImages(true);
    try {
      const imageUrl = await uploadImageToImgBB(files[0]);
      setImages([imageUrl]);
    } catch (uploadError) {
      console.error('Image upload failed:', uploadError);
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: uploadError instanceof Error ? uploadError.message : 'Unable to upload product image.', confirmButtonColor: '#2563eb' });
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Remove specific image
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Resets the entire form
  const handleResetForm = () => {
    setName('');
    setDescription('');
    setQuantity('');
    setSellPrice('');
    setBuyPrice('');
    setQuantityAlert('5');
    setBoldActive(false);
    setItalicActive(false);
    setUnderlineActive(false);
    if (categories.length > 0) setCategoryId(categories[0].id);
    if (brands.length > 0) setBrandId(brands[0].id);
  };

  // Toggles all accordion sections simultaneously
  const toggleAllAccordions = () => {
    const allOpen = productInfoOpen && pricingStockOpen && imagesOpen;
    setProductInfoOpen(!allOpen);
    setPricingStockOpen(!allOpen);
    setImagesOpen(!allOpen);
  };

  // Quick Stock Adjustment submit logic
  const handleQuickAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (quickAdjustQty <= 0) {
      Swal.fire({ icon: 'error', title: 'Invalid Quantity', text: 'Adjustment quantity must be greater than 0.', confirmButtonColor: '#2563eb' });
      return;
    }

    const qtyDiff = quickAdjustType === 'addition' ? quickAdjustQty : -quickAdjustQty;
    const currentQtyNum = Number(quantity) || 0;
    const newQty = Math.max(0, currentQtyNum + qtyDiff);

    // Call context to write log and update global products list
    addStockAdjustment({
      productId: editingProduct.id,
      productName: name || editingProduct.name,
      sku: sku || editingProduct.sku,
      type: quickAdjustType,
      quantity: quickAdjustQty,
      reason: quickAdjustReason,
      notes: quickAdjustNotes.trim() || 'Quick stock adjustment from edit product view.',
      adjustedBy: currentUser?.username || 'administrator',
    });

    // Update local state so it displays in-sync instantly
    setQuantity(String(newQty));
    
    // Reset adjustment quantity & notes
    setQuickAdjustQty(1);
    setQuickAdjustNotes('');
  };

  // Main Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Field', text: 'Product Name is required.', confirmButtonColor: '#2563eb' });
      return;
    }
    if (!categoryId) {
      Swal.fire({ icon: 'error', title: 'Missing Field', text: 'Category is required.', confirmButtonColor: '#2563eb' });
      return;
    }
    if (!brandId) {
      Swal.fire({ icon: 'error', title: 'Missing Field', text: 'Brand is required.', confirmButtonColor: '#2563eb' });
      return;
    }
    if (!supplierId) {
      Swal.fire({ icon: 'error', title: 'Missing Field', text: 'Supplier is required.', confirmButtonColor: '#2563eb' });
      return;
    }

    // Set a fallback supplier ID so the database record is fully consistent
    const fallbackSupplierId = suppliers[0]?.id || 'sup-1';
    const finalSupplierId = supplierId || fallbackSupplierId;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        sku,
        description: description || 'Standard retail product item.',
        categoryId,
        brandId,
        supplierId: finalSupplierId,
        price: Math.round(Number(sellPrice)) || 0,
        cost: Math.round(Number(buyPrice)) || 0,
        stock: Number(quantity) || 0,
        minStockAlert: Number(quantityAlert) || 5,
        image: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
        status,
      });
      setEditingProduct(null);
    } else {
      // Call inventory manager
      addProduct({
        name,
        description: description || 'Standard retail product item.',
        categoryId,
        brandId,
        supplierId: finalSupplierId,
        price: Math.round(Number(sellPrice)) || 0,
        cost: Math.round(Number(buyPrice)) || 0,
        stock: Number(quantity) || 0,
        minStockAlert: Number(quantityAlert) || 5,
        image: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
        status,
      });
    }

    // Go back to the products listing
    setActiveView('products');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-slate-800">
      
      {/* 1st Photo: Page Header & Title Controls */}
      <div className="mobile-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 id="create-product-title" className="text-xl font-bold text-slate-800 tracking-tight">
            {editingProduct ? 'Edit Product' : 'Create Product'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {editingProduct ? 'Modify existing product details' : 'Create new product'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh/Reset form */}
          <button
            type="button"
            onClick={handleResetForm}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm cursor-pointer animate-pulse-subtle"
            title="Reset Form"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          {/* Toggle all accordions */}
          <button
            type="button"
            onClick={toggleAllAccordions}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm cursor-pointer"
            title="Collapse/Expand All"
          >
            {productInfoOpen && pricingStockOpen && imagesOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Manage Stock View navigation shortcut */}
          {editingProduct && (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setActiveView('manage-stock');
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Go to Stock Management"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Manage Stock</span>
            </button>
          )}
          
          {/* Back to product list */}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setActiveView('products');
            }}
            className="px-4 py-2 bg-[#0f172a] text-white hover:bg-slate-800 font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Product</span>
          </button>
        </div>
      </div>

      {/* Quick Stock Adjustment Interactive Panel */}
      {editingProduct && (
        <div className="quick-adjust-panel bg-white border border-slate-200 rounded-2xl shadow-sm overflow-visible">
          {/* Header toggler */}
          <div
            onClick={() => setQuickAdjustOpen(!quickAdjustOpen)}
            className="flex items-center justify-between p-4 bg-[#f8fafc] border-b border-slate-100 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-800">Quick Stock Adjustment Option</h3>
                <p className="text-[10px] text-slate-400">Instantly modify physical quantities with real-time audit logs</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Stock:</span>
                <span className={`px-2.5 py-1 rounded-full font-black text-xs ${Number(quantity) <= Number(quantityAlert) ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {quantity || 0} units
                </span>
              </div>
              {quickAdjustOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {quickAdjustOpen && (
            <div className="p-4 sm:p-5 space-y-4 bg-white">
              {/* Responsive fallback for mobile where the header stock display is hidden */}
              <div className="flex sm:hidden items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Stock:</span>
                <span className={`px-2.5 py-1 rounded-full font-black text-xs ${Number(quantity) <= Number(quantityAlert) ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                  {quantity || 0} units
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                {/* Adjustment Type Selector */}
                <div className="lg:col-span-3 space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">Adjustment Type</label>
                  <AppSelect
                    value={quickAdjustType}
                    onChange={(e) => setQuickAdjustType(e.target.value as 'addition' | 'deduction')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer shadow-sm transition-all hover:border-slate-300"
                  >
                    <option value="addition">➕ Add Stock (Addition)</option>
                    <option value="deduction">➖ Deduct Stock (Deduction)</option>
                  </AppSelect>
                </div>

                {/* Qty Input */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quickAdjustQty}
                    onChange={(e) => setQuickAdjustQty(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                  />
                </div>

                {/* Reason selector */}
                <div className="lg:col-span-3 space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">Reason</label>
                  <AppSelect
                    value={quickAdjustReason}
                    onChange={(e) => setQuickAdjustReason(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 bg-white cursor-pointer shadow-sm transition-all hover:border-slate-300"
                  >
                    <option value="Inventory Count">Inventory Count</option>
                    <option value="Damage">Damage</option>
                    <option value="Theft">Theft</option>
                    <option value="Promotional Sample">Promotional Sample</option>
                    <option value="Other">Other</option>
                  </AppSelect>
                </div>

                {/* Notes Input and Submit Action */}
                <div className="lg:col-span-4 space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">Reference Notes (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Stock count verification"
                      value={quickAdjustNotes}
                      onChange={(e) => setQuickAdjustNotes(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAdjustSubmit}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer uppercase tracking-wider whitespace-nowrap"
                    >
                      Adjust
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Forms Layout with Accordions */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Accordion 1: Product Information Section (2nd Photo) */}
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div
            onClick={() => setProductInfoOpen(!productInfoOpen)}
            className="flex items-center justify-between p-4 bg-[#f8fafc] border-b border-slate-100 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full text-blue-500">
                <Info className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">Product Information</span>
            </div>
            {productInfoOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {productInfoOpen && (
            <div className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name * */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    Product Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter product name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white"
                  />
                </div>

                {/* SKU * with Generate Button */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    SKU <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="SKU code"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Category * with Inline Add link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold text-xs">
                      Category <span className="text-red-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCatName('');
                        setNewCatCode('');
                        setIsNewCatCodeManuallyEdited(false);
                        setShowAddCatModal(true);
                      }}
                      className="text-[#f97316] hover:text-[#ea580c] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      + Add New
                    </button>
                  </div>
                  <AppSelect
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>

                {/* Brand * with Inline Add link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold text-xs">
                      Brand <span className="text-red-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(true)}
                      className="text-[#f97316] hover:text-[#ea580c] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      + Add New
                    </button>
                  </div>
                  <AppSelect
                    required
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white cursor-pointer"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </AppSelect>
                </div>

                {/* Supplier * with Inline Add link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold text-xs">
                      Supplier <span className="text-red-500 font-bold">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddSupplierModal(true)}
                      className="text-[#f97316] hover:text-[#ea580c] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      + Add New
                    </button>
                  </div>
                  <AppSelect
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white cursor-pointer"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.company ? `(${s.company})` : ''}
                      </option>
                    ))}
                  </AppSelect>
                </div>

              </div>

              {/* Description field with WYSIWYG Editor Mock */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold text-xs">Description</label>
                
                {/* Editor Container */}
                <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden focus-within:border-blue-500 transition-all">
                  {/* Mock toolbar */}
                  <div className="bg-[#f8fafc] border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-2.5">
                    {/* Size Selector */}
                    <div className="relative inline-block text-left">
                      <AppSelect
                        onChange={(e) => {
                          if (e.target.value === 'Heading 1') {
                            applyHeading('<h1>');
                          } else if (e.target.value === 'Heading 2') {
                            applyHeading('<h2>');
                          } else {
                            applyHeading('<p>');
                          }
                          e.target.value = 'Normal'; // reset selection to visual baseline
                        }}
                        className="bg-white border border-slate-200 text-slate-600 rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none hover:bg-slate-50"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Heading 1">Heading 1</option>
                        <option value="Heading 2">Heading 2</option>
                      </AppSelect>
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    {/* Interactive format toggles */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execEditorCommand('bold');
                      }}
                      className={`p-1 rounded transition-colors cursor-pointer ${boldActive ? 'bg-blue-100 text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execEditorCommand('italic');
                      }}
                      className={`p-1 rounded transition-colors cursor-pointer ${italicActive ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execEditorCommand('underline');
                      }}
                      className={`p-1 rounded transition-colors cursor-pointer ${underlineActive ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => execEditorCommand('insertOrderedList')}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => execEditorCommand('insertUnorderedList')}
                      className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    {/* Clear formatting */}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        execEditorCommand('removeFormat');
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1 py-0.5 rounded cursor-pointer"
                      title="Clear Format"
                    >
                      Tx
                    </button>
                  </div>

                  {/* Rich Text Editor Contenteditable Div */}
                  <div
                    ref={editorRef}
                    contentEditable
                    placeholder="Enter description here..."
                    onInput={(e) => {
                      setDescription(e.currentTarget.innerHTML);
                    }}
                    onKeyUp={updateToolbarStates}
                    onMouseUp={updateToolbarStates}
                    onFocus={updateToolbarStates}
                    className="rich-editor w-full min-h-[140px] p-4 text-xs text-slate-700 bg-white focus:outline-none overflow-y-auto leading-relaxed max-h-[300px]"
                    style={{ minHeight: '140px' }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
                  <span>Maximum 60 Words</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Accordion 2: Pricing & Stocks (3rd Photo) */}
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div
            onClick={() => setPricingStockOpen(!pricingStockOpen)}
            className="flex items-center justify-between p-4 bg-[#f8fafc] border-b border-slate-100 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full text-blue-500">
                <Coins className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">Pricing & Stocks</span>
            </div>
            {pricingStockOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {pricingStockOpen && (
            <div className="p-6 space-y-4 bg-white">
              
              {/* Product Type * */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold text-xs">
                  Product Type <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <span className="w-4.5 h-4.5 rounded-full border-2 border-[#f97316] flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
                    </span>
                    <span className="text-xs font-bold text-slate-700">Single Product</span>
                  </label>
                </div>
              </div>

              {/* Grid: Quantity, Buy Price, Sell Price, Quantity Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Quantity * */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    Quantity <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white"
                  />
                </div>

                {/* Buy Price * */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    Buy Price <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="Enter buy price"
                      value={buyPrice}
                      onChange={(e) => setBuyPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white pl-6"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                  </div>
                </div>

                {/* Sell Price * */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    Sell Price <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="Enter sell price"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white pl-6"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                  </div>
                </div>

                {/* Quantity Alert * */}
                <div className="space-y-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    Quantity Alert <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Enter quantity alert limit"
                    value={quantityAlert}
                    onChange={(e) => setQuantityAlert(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm bg-white"
                  />
                </div>

              </div>

              {/* Product Status Toggle */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-xs">Product Status</label>
                  <p className="text-[10px] text-slate-400 font-medium">Toggle whether this product is active and visible for transactions</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className={`text-xs font-bold transition-colors ${status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>Active</span>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${status === 'active' ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                  <span className={`text-xs font-bold transition-colors ${status === 'inactive' ? 'text-rose-600' : 'text-slate-400'}`}>Inactive</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Accordion 3: Images (4th Photo) */}
        <div className="bg-white border border-slate-200/60 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div
            onClick={() => setImagesOpen(!imagesOpen)}
            className="flex items-center justify-between p-4 bg-[#f8fafc] border-b border-slate-100 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-full text-blue-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-800 text-xs sm:text-sm">Images</span>
            </div>
            {imagesOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {imagesOpen && (
            <div className="p-6 bg-white">
              
              <div className="flex flex-wrap items-center gap-4">
                
                {/* 4th Photo: Dotted Add Images trigger */}
                <div
                  onClick={triggerFileSelect}
                  className="w-28 h-28 border-2 border-dashed border-slate-200 hover:border-[#f97316] hover:bg-slate-50/50 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-1.5 cursor-pointer transition-all bg-white shadow-sm"
                  title="Click to add product images"
                >
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                    <Plus className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 select-none">
                    {isUploadingImages ? 'Uploading...' : images.length > 0 ? 'Exchange Photo' : 'Add Photo'}
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Horizontally Listed Images (same to same design) */}
                {images.slice(0, 1).map((imgUrl, index) => (
                  <div
                    key={index}
                    className="w-28 h-28 border border-slate-200 rounded-xl relative flex items-center justify-center bg-white p-2.5 shadow-sm overflow-hidden"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product asset ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
                      }}
                    />
                    
                    {/* Square red 'X' close button aligned in top-right corner exactly like photo 4 */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-[#ef4444] text-white hover:bg-red-700 rounded flex items-center justify-center w-4 h-4 cursor-pointer transition-colors font-black shadow-sm"
                      title="Delete asset"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

              </div>

            </div>
          )}
        </div>

        {/* Audit / Metadata Info Panel (Only displayed when editingProduct is active) */}
        {editingProduct && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div
              onClick={() => setAuditLogOpen(!auditLogOpen)}
              className="flex items-center justify-between p-4 bg-[#f8fafc] border-b border-slate-100 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Product History & Audit Log</span>
              </div>
              {auditLogOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {auditLogOpen && (
              <div className="p-5 bg-slate-50/50 space-y-3.5 border-t border-slate-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Created By */}
                  <div className="flex items-start gap-2.5 bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created By</span>
                      <span className="font-bold text-slate-700">{editingProduct.createdBy || 'System Admin'}</span>
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
                        {editingProduct.createdAt 
                          ? new Date(editingProduct.createdAt).toLocaleString('en-US', {
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
                        {editingProduct.updatedAt 
                          ? new Date(editingProduct.updatedAt).toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1st Photo: Cancel & Add Product Form Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setActiveView('products');
            }}
            className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md transition-all cursor-pointer"
          >
            {editingProduct ? 'Update Product' : 'Add Product'}
          </button>
        </div>

      </form>

      {createPortal(
        <>
          {/* Add Category Inline Modal */}
          {showAddCatModal && (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowAddCatModal(false);
                }
              }}
              className="fixed inset-0 md:left-64 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in p-4 cursor-pointer"
            >
              <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full space-y-4 shadow-xl animate-scale-up relative cursor-default">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm">Add New Category</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCatModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <label className="block font-bold text-slate-700">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Devices"
                      value={newCatName}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        setNewCatName(nextName);
                        if (!isNewCatCodeManuallyEdited) {
                          setNewCatCode(generateCategoryCode(nextName));
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <label className="block font-bold text-slate-700">Category Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={3}
                      placeholder="e.g. SMD"
                      value={newCatCode}
                      onChange={(e) => {
                        setNewCatCode(e.target.value.toUpperCase());
                        setIsNewCatCodeManuallyEdited(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 uppercase bg-white animate-pulse-subtle"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(false)}
                      className="flex-1 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Save Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Brand Inline Modal */}
          {showAddBrandModal && (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowAddBrandModal(false);
                }
              }}
              className="fixed inset-0 md:left-64 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in p-4 cursor-pointer"
            >
              <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full space-y-4 shadow-xl animate-scale-up relative cursor-default">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm">Add New Brand</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBrandModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddBrandSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <label className="block font-bold text-slate-700">Brand Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apple"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <label className="block font-bold text-slate-700">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Electronics"
                      value={newBrandDescription}
                      onChange={(e) => setNewBrandDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(false)}
                      className="flex-1 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Save Brand
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Supplier Inline Modal */}
          {showAddSupplierModal && (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowAddSupplierModal(false);
                }
              }}
              className="fixed inset-0 md:left-64 bg-slate-900/40 flex items-center justify-center z-50 animate-fade-in p-4 cursor-pointer"
            >
              <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full space-y-4 shadow-xl animate-scale-up relative cursor-default">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-sm">Add New Supplier</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddSupplierSubmit} className="space-y-3">
                  <div className="space-y-1 text-xs text-slate-600">
                    <label className="block font-bold text-slate-700">Supplier Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <label className="block font-bold text-slate-700">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Tech Solutions Ltd"
                      value={newSupplierCompany}
                      onChange={(e) => setNewSupplierCompany(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 text-xs text-slate-600">
                      <label className="block font-bold text-slate-700">Email</label>
                      <input
                        type="email"
                        placeholder="e.g. john@tech.com"
                        value={newSupplierEmail}
                        onChange={(e) => setNewSupplierEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                      />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <label className="block font-bold text-slate-700">Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. 01712345678"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setShowAddSupplierModal(false)}
                      className="flex-1 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                    >
                      Save Supplier
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

    </div>
  );
};
