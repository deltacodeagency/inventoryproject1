import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { confirmToast } from '../lib/confirmToast';
import Swal from 'sweetalert2';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Download,
  UploadCloud,
  X,
  Check,
  FileText
} from 'lucide-react';
import { Product } from '../types';
import { AppSelect } from '../components/AppSelect';
import { appNavigate } from '../lib/appNavigate';
import ExcelJS from 'exceljs';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    suppliers,
    deleteProduct,
    deleteProducts,
    updateProduct,
    setActiveView,
    currentUser,
    setEditingProduct,
    setViewingProduct,
    addMultipleProducts
  } = useInventory();

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSup, setSelectedSup] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState(''); // 'all', 'low', 'out', 'good'
  const [showFilters, setShowFilters] = useState(false);

  // Import Product States
  const [showImportModal, setShowImportModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedProductsList, setParsedProductsList] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeRefTab, setActiveRefTab] = useState<'categories' | 'brands' | 'suppliers'>('categories');
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importBrandId, setImportBrandId] = useState('');
  const [importSupplierId, setImportSupplierId] = useState('');

  useEffect(() => {
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  }, [importCategoryId, importBrandId, importSupplierId]);

  // Selected Products Checklist
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Column visibility states for export
  const [visibleColumns, setVisibleColumns] = useState({
    sku: true,
    name: true,
    category: true,
    brand: true,
    supplier: true,
    price: true,
    cost: true,
    stock: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const columnToggleRef = React.useRef<HTMLDivElement>(null);
  const [columnMenuPosition, setColumnMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // View Mode: Table or Card
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setViewMode('card');
    }
  }, []);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    
    const matchesCat = selectedCat ? p.categoryId === selectedCat : true;
    const matchesBrand = selectedBrand ? p.brandId === selectedBrand : true;
    const matchesSup = selectedSup ? p.supplierId === selectedSup : true;
    
    let matchesStock = true;
    if (selectedStockStatus === 'low') {
      matchesStock = p.stock <= p.minStockAlert && p.stock > 0;
    } else if (selectedStockStatus === 'out') {
      matchesStock = p.stock <= 0;
    } else if (selectedStockStatus === 'good') {
      matchesStock = p.stock > p.minStockAlert;
    }

    return matchesSearch && matchesCat && matchesBrand && matchesSup && matchesStock;
  });

  // Derived Pagination metrics
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const activePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // PDF Export
  const handleExportPDF = () => {
    const productsToExport = selectedProductIds.length > 0 
      ? products.filter(p => selectedProductIds.includes(p.id)) 
      : filteredProducts;

    if (productsToExport.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Export Failed', text: 'No products available to export.', confirmButtonColor: '#2563eb' });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Swal.fire({ icon: 'error', title: 'Popup Blocked', text: 'Please allow popups to export PDF', confirmButtonColor: '#2563eb' });
      return;
    }

    // Build the dynamic headers based on visibleColumns
    const ths = [];
    if (visibleColumns.sku) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">SKU</th>');
    if (visibleColumns.name) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Product Name</th>');
    if (visibleColumns.category) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Category</th>');
    if (visibleColumns.brand) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Brand</th>');
    if (visibleColumns.supplier) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Supplier</th>');
    if (visibleColumns.price) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Price</th>');
    if (visibleColumns.cost) ths.push('<th style="padding: 10px 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Cost</th>');
    if (visibleColumns.stock) ths.push('<th style="padding: 10px 12px; text-align: center; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569;">Stock</th>');

    const headersHtml = `<tr>${ths.join('')}</tr>`;

    // Build dynamic rows based on visibleColumns
    const rowsHtml = productsToExport.map(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || 'N/A';
      const br = brands.find(b => b.id === p.brandId)?.name || 'N/A';
      const sup = suppliers.find(s => s.id === p.supplierId)?.name || 'N/A';
      
      const tds = [];
      if (visibleColumns.sku) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${p.sku}</td>`);
      if (visibleColumns.name) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${p.name}</td>`);
      if (visibleColumns.category) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">${cat}</td>`);
      if (visibleColumns.brand) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">${br}</td>`);
      if (visibleColumns.supplier) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9;">${sup}</td>`);
      if (visibleColumns.price) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: left;">৳${p.price.toFixed(0)}</td>`);
      if (visibleColumns.cost) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: left;">৳${p.cost.toFixed(0)}</td>`);
      if (visibleColumns.stock) tds.push(`<td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${p.stock}</td>`);
      
      return `<tr>${tds.join('')}</tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <title></title>
          <style>
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
              color: #1e293b; 
              background-color: #f1f5f9;
              margin: 0;
              padding: 0;
              padding-top: 72px;
              -webkit-text-size-adjust: 100%;
            }
            .no-print {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background-color: #0f172a;
              color: white;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 20px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              z-index: 1000;
              flex-wrap: wrap;
              gap: 12px;
            }
            .no-print .logo-area {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .no-print .title-text {
              font-weight: 700;
              font-size: 15px;
              letter-spacing: -0.025em;
            }
            .no-print .actions {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
            }
            .btn {
              padding: 8px 14px;
              font-size: 12px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              white-space: nowrap;
              min-height: 36px;
            }
            .btn-primary {
              background-color: #2563eb;
              color: white;
            }
            .btn-primary:hover {
              background-color: #1d4ed8;
            }
            .btn-secondary {
              background-color: #10b981;
              color: white;
            }
            .btn-secondary:hover {
              background-color: #059669;
            }
            .btn-outline {
              background-color: rgba(255,255,255,0.08);
              border: 1px solid rgba(255,255,255,0.2);
              color: #cbd5e1;
            }
            .btn-outline:hover {
              background-color: rgba(255,255,255,0.18);
              color: white;
            }
            .page-container {
              background-color: white;
              max-width: 900px;
              width: calc(100% - 24px);
              margin: 20px auto 40px auto;
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05);
              border: 1px solid #e2e8f0;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 15px; 
              margin-bottom: 20px; 
              gap: 16px;
              flex-wrap: wrap;
            }
            .title { 
              font-size: 22px; 
              font-weight: 800; 
              color: #1e3a8a; 
              letter-spacing: -0.025em;
            }
            .meta { 
              font-size: 12px; 
              color: #475569; 
              text-align: right; 
              line-height: 1.5;
            }
            .table-wrapper {
              width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              margin-top: 15px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 11px; 
              min-width: 600px;
            }
            th { 
              background-color: #f8fafc; 
              padding: 10px 12px; 
              text-align: left; 
              font-weight: bold; 
              border-bottom: 2px solid #e2e8f0; 
              color: #475569; 
              white-space: nowrap;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #f1f5f9;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .footer { 
              margin-top: 40px; 
              font-size: 10px; 
              color: #94a3b8; 
              text-align: center; 
              border-top: 1px solid #e2e8f0; 
              padding-top: 15px; 
            }
            .alert-info {
              background-color: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1e3a8a;
              padding: 12px;
              border-radius: 8px;
              font-size: 12px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
              line-height: 1.4;
            }
            @media (max-width: 768px) {
              body {
                padding-top: 120px;
              }
              .no-print {
                padding: 10px 12px;
                gap: 8px;
                justify-content: center;
              }
              .no-print .logo-area {
                width: 100%;
                justify-content: center;
              }
              .no-print .actions {
                width: 100%;
                justify-content: space-between;
              }
              .btn {
                flex: 1;
                padding: 8px 10px;
                font-size: 12px;
              }
              .page-container {
                width: calc(100% - 12px);
                margin: 10px auto;
                padding: 16px;
                border-radius: 8px;
              }
              .header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
              }
              .meta {
                text-align: left;
              }
              .title {
                font-size: 18px;
              }
              th, td {
                padding: 8px 8px;
                font-size: 10px;
              }
            }
            @media print {
              @page {
                margin: 0mm;
                size: auto;
              }
              .no-print { 
                display: none !important; 
              }
              body { 
                padding: 0 !important; 
                background-color: white !important; 
              }
              .page-container { 
                border: none !important; 
                box-shadow: none !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                max-width: 100% !important; 
                width: 100% !important;
              }
              .alert-info {
                display: none !important;
              }
              .table-wrapper {
                border: none !important;
                overflow: visible !important;
              }
              table {
                min-width: 100% !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <div class="logo-area">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#ef4444" />
                <path d="M17 12H7M17 12L13 8M17 12L13 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="title-text">Report Document Preview</span>
            </div>
            <div class="actions">
              <button class="btn btn-outline" onclick="window.close()">✕ Close Preview</button>
              <button class="btn btn-secondary" onclick="triggerDownload()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Download PDF
              </button>
              <button class="btn btn-primary" onclick="window.print()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print Document
              </button>
            </div>
          </div>

          <div class="page-container">
            <div class="alert-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span><strong>Export Guide:</strong> To save this report as a PDF file, click the <strong>"Download PDF"</strong> or <strong>"Print Document"</strong> button and change the Destination to <strong>"Save as PDF"</strong> in the dialog box.</span>
            </div>

            <div class="header">
              <div>
                <div class="title">Store Product Catalog Report</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px;">Generated Inventory Records</div>
              </div>
              <div class="meta">
                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
                <div><strong>Total Items:</strong> ${productsToExport.length}</div>
              </div>
            </div>

            <div class="table-wrapper">
              <table>
                <thead>
                  ${headersHtml}
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <script>
            function triggerDownload() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Excel Export (CSV)
  const handleExportExcel = () => {
    const productsToExport = selectedProductIds.length > 0 
      ? products.filter(p => selectedProductIds.includes(p.id)) 
      : filteredProducts;

    if (productsToExport.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Export Failed', text: 'No products available to export.', confirmButtonColor: '#2563eb' });
      return;
    }

    const headers = [];
    if (visibleColumns.sku) headers.push('SKU');
    if (visibleColumns.name) headers.push('Name');
    if (visibleColumns.category) headers.push('Category');
    if (visibleColumns.brand) headers.push('Brand');
    if (visibleColumns.supplier) headers.push('Supplier');
    if (visibleColumns.price) headers.push('Retail Price');
    if (visibleColumns.cost) headers.push('Cost Price');
    if (visibleColumns.stock) headers.push('Stock Level');

    const rows = productsToExport.map(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || 'N/A';
      const br = brands.find(b => b.id === p.brandId)?.name || 'N/A';
      const sup = suppliers.find(s => s.id === p.supplierId)?.name || 'N/A';
      
      const rowData = [];
      if (visibleColumns.sku) rowData.push(p.sku);
      if (visibleColumns.name) rowData.push(`"${p.name.replace(/"/g, '""')}"`);
      if (visibleColumns.category) rowData.push(`"${cat.replace(/"/g, '""')}"`);
      if (visibleColumns.brand) rowData.push(`"${br.replace(/"/g, '""')}"`);
      if (visibleColumns.supplier) rowData.push(`"${sup.replace(/"/g, '""')}"`);
      if (visibleColumns.price) rowData.push(p.price);
      if (visibleColumns.cost) rowData.push(p.cost);
      if (visibleColumns.stock) rowData.push(p.stock);
      
      return rowData;
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Import Product Modal Helpers ---
  const handleDownloadSampleFile = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      // Define columns
      worksheet.columns = [
        { header: 'sku', key: 'sku', width: 15 },
        { header: 'name', key: 'name', width: 25 },
        { header: 'description', key: 'description', width: 35 },
        { header: 'category', key: 'category', width: 20 },
        { header: 'brand', key: 'brand', width: 20 },
        { header: 'supplier', key: 'supplier', width: 20 },
        { header: 'price', key: 'price', width: 12 },
        { header: 'cost', key: 'cost', width: 12 },
        { header: 'stock', key: 'stock', width: 10 },
        { header: 'minStockAlert', key: 'minStockAlert', width: 15 }
      ];

      // Format header row with styling
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0A2540' } // Navy blue brand color
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

      // Add sample rows
      const sampleCategory = categories.find(c => c.id === importCategoryId)?.name || categories[0]?.name || 'Smartphones';
      const sampleBrand = brands.find(b => b.id === importBrandId)?.name || brands[0]?.name || 'Apple';
      const sampleSupplier = suppliers.find(s => s.id === importSupplierId)?.name || suppliers[0]?.name || 'TechSource';

      worksheet.addRow({
        sku: 'APL-14P-001',
        name: 'iPhone 14 Pro',
        description: 'Flagship Apple smartphone with Dynamic Island',
        category: sampleCategory,
        brand: sampleBrand,
        supplier: sampleSupplier,
        price: 120000,
        cost: 95000,
        stock: 50,
        minStockAlert: 5
      });

      worksheet.addRow({
        sku: 'MAC-AIR-002',
        name: 'MacBook Air M2',
        description: 'Ultra-slim laptop with Apple M2 silicon chip',
        category: sampleCategory,
        brand: sampleBrand,
        supplier: sampleSupplier,
        price: 145000,
        cost: 115000,
        stock: 25,
        minStockAlert: 3
      });

      // Prepare lists for dropdown validation
      const categoryNames = categories.map(c => c.name).join(',');
      const brandNames = brands.map(b => b.name).join(',');
      const supplierNames = suppliers.map(s => s.name).join(',');

      // Apply data validation list dropdown to columns D, E, F (Category, Brand, Supplier) for rows 2 to 100
      for (let i = 2; i <= 100; i++) {
        const categoryCell = worksheet.getCell(`D${i}`);
        categoryCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${categoryNames}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a category from the dropdown list.'
        };

        const brandCell = worksheet.getCell(`E${i}`);
        brandCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${brandNames}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a brand from the dropdown list.'
        };

        const supplierCell = worksheet.getCell(`F${i}`);
        supplierCell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${supplierNames}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a supplier from the dropdown list.'
        };
      }

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products_import_sample.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate Excel sample file:', err);
      Swal.fire({ icon: 'error', title: 'Download Failed', text: 'Failed to generate Excel sample file. Please try again.', confirmButtonColor: '#2563eb' });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const getCellValueAsString = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if (val.text !== undefined) return String(val.text);
      if (val.result !== undefined) return String(val.result);
      if (val.richText !== undefined && Array.isArray(val.richText)) {
        return val.richText.map((rt: any) => rt.text || '').join('');
      }
      if (val.value !== undefined) return getCellValueAsString(val.value);
      return JSON.stringify(val);
    }
    return String(val);
  };

  const parseExcel = async (arrayBuffer: ArrayBuffer) => {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        return { error: 'The Excel file does not contain any sheets.' };
      }

      const colCount = worksheet.columnCount || 10;
      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowValues: any[] = [];
        for (let col = 1; col <= colCount; col++) {
          rowValues.push(row.getCell(col).value);
        }
        rows.push({ rowNumber, values: rowValues });
      });

      if (rows.length < 2) {
        return { error: 'Excel must contain headers and at least one data row.' };
      }

      // First row contains headers
      const headers = rows[0].values.map((h: any) => {
        return getCellValueAsString(h).trim().toLowerCase();
      });

      const requiredFields = ['name', 'price', 'cost', 'stock'];
      const missingFields = requiredFields.filter(f => !headers.includes(f));
      if (missingFields.length > 0) {
        return { error: `Missing required headers in Excel: ${missingFields.join(', ')}` };
      }

      const parsedProducts: any[] = [];

      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i];
        const fields = rowData.values;

        if (!fields || fields.length === 0 || fields.every((f: any) => f === null || f === undefined || f === '')) {
          continue;
        }

        const rowObj: Record<string, string> = {};
        headers.forEach((header: string, index: number) => {
          if (index < fields.length) {
            rowObj[header] = getCellValueAsString(fields[index]).trim();
          }
        });

        const name = rowObj['name'];
        if (!name) {
          return { error: `Row ${rowData.rowNumber} is missing a required Name.` };
        }

        // Determine Category ID from Excel value or dropdown select
        const categoryVal = rowObj['category'] || rowObj['categoryid'] || '';
        const cat = categories.find(c => 
          c.id.toLowerCase() === categoryVal.toLowerCase() || 
          c.name.toLowerCase() === categoryVal.toLowerCase()
        );

        let finalCategoryId = '';
        if (cat) {
          finalCategoryId = cat.id;
        } else if (importCategoryId) {
          finalCategoryId = importCategoryId;
        } else {
          return { error: `Row ${rowData.rowNumber} contains an invalid or missing Category: "${categoryVal}". Please write a valid Category Name.` };
        }

        // Determine Brand ID from Excel value or dropdown select
        const brandVal = rowObj['brand'] || rowObj['brandid'] || '';
        const bnd = brands.find(b => 
          b.id.toLowerCase() === brandVal.toLowerCase() || 
          b.name.toLowerCase() === brandVal.toLowerCase()
        );

        let finalBrandId = '';
        if (bnd) {
          finalBrandId = bnd.id;
        } else if (importBrandId) {
          finalBrandId = importBrandId;
        } else {
          return { error: `Row ${rowData.rowNumber} contains an invalid or missing Brand: "${brandVal}". Please write a valid Brand Name.` };
        }

        // Determine Supplier ID from Excel value or dropdown select
        const supplierVal = rowObj['supplier'] || rowObj['supplierid'] || '';
        const sup = suppliers.find(s => 
          s.id.toLowerCase() === supplierVal.toLowerCase() || 
          s.name.toLowerCase() === supplierVal.toLowerCase()
        );

        let finalSupplierId = '';
        if (sup) {
          finalSupplierId = sup.id;
        } else if (importSupplierId) {
          finalSupplierId = importSupplierId;
        } else {
          finalSupplierId = suppliers[0]?.id || '';
        }

        const price = Math.round(Number(rowObj['price'])) || 0;
        const cost = Math.round(Number(rowObj['cost'])) || 0;
        const stock = Math.round(Number(rowObj['stock'])) || 0;
        const minStockAlert = rowObj['minstockalert'] ? (Math.round(Number(rowObj['minstockalert'])) || 5) : 5;
        const sku = rowObj['sku'] || '';
        const description = rowObj['description'] || '';

        parsedProducts.push({
          sku,
          name,
          description,
          categoryId: finalCategoryId,
          brandId: finalBrandId,
          supplierId: finalSupplierId,
          price,
          cost,
          stock,
          minStockAlert,
          status: 'active' as const,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
        });
      }

      if (parsedProducts.length === 0) {
        return { error: 'No valid data rows found in the Excel sheet.' };
      }

      return { products: parsedProducts };
    } catch (e: any) {
      console.error('Excel parse error:', e);
      return { error: `Error parsing Excel file: ${e.message || e}` };
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return { error: 'CSV must contain headers and at least one data row.' };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    // Name, Price, Cost, Stock are required fields
    const requiredFields = ['name', 'price', 'cost', 'stock'];
    const missingFields = requiredFields.filter(f => !headers.includes(f));
    if (missingFields.length > 0) {
      return { error: `Missing required headers in CSV: ${missingFields.join(', ')}` };
    }
    
    const parsedProducts: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim());
      
      const rowObj: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index < fields.length) {
          let val = fields[index];
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
          }
          rowObj[header] = val;
        }
      });
      
      const name = rowObj['name'];
      if (!name) {
        return { error: `Row ${i + 1} is missing a required Name.` };
      }
      
      // Determine Category ID from CSV value or Modal Selection dropdown
      const categoryVal = rowObj['category'] || rowObj['categoryid'] || '';
      const cat = categories.find(c => 
        c.id.toLowerCase() === categoryVal.toLowerCase() || 
        c.name.toLowerCase() === categoryVal.toLowerCase()
      );
      
      let finalCategoryId = '';
      if (cat) {
        finalCategoryId = cat.id;
      } else if (importCategoryId) {
        finalCategoryId = importCategoryId;
      } else {
        return { error: `Row ${i + 1} contains an invalid or missing Category: "${categoryVal}". Please write a valid Category Name/ID in the CSV.` };
      }
      
      // Determine Brand ID from CSV value or Modal Selection dropdown
      const brandVal = rowObj['brand'] || rowObj['brandid'] || '';
      const bnd = brands.find(b => 
        b.id.toLowerCase() === brandVal.toLowerCase() || 
        b.name.toLowerCase() === brandVal.toLowerCase()
      );
      
      let finalBrandId = '';
      if (bnd) {
        finalBrandId = bnd.id;
      } else if (importBrandId) {
        finalBrandId = importBrandId;
      } else {
        return { error: `Row ${i + 1} contains an invalid or missing Brand: "${brandVal}". Please write a valid Brand Name/ID in the CSV.` };
      }
      
      // Determine Supplier ID from CSV value or Modal Selection dropdown
      const supplierVal = rowObj['supplier'] || rowObj['supplierid'] || '';
      const sup = suppliers.find(s => 
        s.id.toLowerCase() === supplierVal.toLowerCase() || 
        s.name.toLowerCase() === supplierVal.toLowerCase()
      );
      
      let finalSupplierId = '';
      if (sup) {
        finalSupplierId = sup.id;
      } else if (importSupplierId) {
        finalSupplierId = importSupplierId;
      } else {
        // Supplier can be optional, fallback to first supplier or blank
        finalSupplierId = suppliers[0]?.id || '';
      }
      
      const price = Math.round(Number(rowObj['price'])) || 0;
      const cost = Math.round(Number(rowObj['cost'])) || 0;
      const stock = Math.round(Number(rowObj['stock'])) || 0;
      const minStockAlert = rowObj['minstockalert'] ? (Math.round(Number(rowObj['minstockalert'])) || 5) : 5;
      const sku = rowObj['sku'] || '';
      const description = rowObj['description'] || '';
      
      parsedProducts.push({
        sku,
        name,
        description,
        categoryId: finalCategoryId,
        brandId: finalBrandId,
        supplierId: finalSupplierId,
        price,
        cost,
        stock,
        minStockAlert,
        status: 'active' as const,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
      });
    }
    
    if (parsedProducts.length === 0) {
      return { error: 'No valid data rows found in the CSV.' };
    }
    
    return { products: parsedProducts };
  };

  const processFile = (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    
    if (!isExcel && !isCsv) {
      setImportError('Please upload a valid Excel (.xlsx) or CSV (.csv) file.');
      setUploadedFile(null);
      setParsedProductsList([]);
      return;
    }
    
    setUploadedFile(file);
    setImportError(null);
    
    const reader = new FileReader();
    if (isExcel) {
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          setImportError('Could not read file content.');
          return;
        }
        const result = await parseExcel(arrayBuffer);
        if (result.error) {
          setImportError(result.error);
          setParsedProductsList([]);
        } else if (result.products) {
          setParsedProductsList(result.products);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          setImportError('Could not read file content.');
          return;
        }
        const result = parseCSV(text);
        if (result.error) {
          setImportError(result.error);
          setParsedProductsList([]);
        } else if (result.products) {
          setParsedProductsList(result.products);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (parsedProductsList.length === 0) {
      setImportError('No valid products to import. Please check your file.');
      return;
    }
    
    addMultipleProducts(parsedProductsList);
    
    // Reset states and close modal
    setUploadedFile(null);
    setParsedProductsList([]);
    setImportError(null);
    setShowImportModal(false);
    setImportCategoryId('');
    setImportBrandId('');
    setImportSupplierId('');
  };

  const handleBulkDelete = () => {
    confirmToast(`Are you sure you want to delete ${selectedProductIds.length} selected products?`, () => {
      deleteProducts(selectedProductIds);
      setSelectedProductIds([]);
    });
  };

  const handleDeleteSingle = (id: string) => {
    confirmToast('Are you sure you want to delete this product?', () => {
      deleteProduct(id);
      setSelectedProductIds((prev) => prev.filter((item) => item !== id));
    });
  };

  const activeFiltersCount = [
    selectedCat,
    selectedBrand,
    selectedSup,
    selectedStockStatus
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="mobile-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800">Product Catalog</h3>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Manage live store stock items, prices, and thresholds</span>
          </div>
          {selectedProductIds.length > 0 && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 bg-rose-50 border border-rose-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl animate-fade-in">
              <span className="text-[9px] sm:text-[10px] font-extrabold text-rose-600">
                {selectedProductIds.length} Selected
              </span>
              {currentUser?.role !== 'Salesman' && (
                <button
                  onClick={handleBulkDelete}
                  className="text-[8px] sm:text-[9px] bg-rose-600 text-white px-1.5 sm:px-2 py-0.5 rounded font-bold uppercase hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Delete Selected
                </button>
              )}
              <button
                onClick={() => setSelectedProductIds([])}
                className="text-[8px] sm:text-[9px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {currentUser?.role !== 'Salesman' && (
            <>
              {/* Column Settings Toggle Button */}
              <div ref={columnToggleRef} className="relative">
                <button
                  onClick={() => {
                    if (!showColumnDropdown && columnToggleRef.current) {
                      const rect = columnToggleRef.current.getBoundingClientRect();
                      const width = Math.min(224, window.innerWidth - 24);
                      const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
                      setColumnMenuPosition({ top: rect.bottom + 8, left, width });
                    }
                    setShowColumnDropdown(!showColumnDropdown);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
                    showColumnDropdown 
                      ? 'bg-blue-50 border-blue-200 text-blue-600' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Toggle Columns for Export"
                >
                  <SlidersHorizontal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </button>
                
                {showColumnDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowColumnDropdown(false)}
                    />
                    <div
                      style={columnMenuPosition ? {
                        '--export-columns-top': `${columnMenuPosition.top}px`,
                        '--export-columns-left': `${columnMenuPosition.left}px`,
                        '--export-columns-width': `${columnMenuPosition.width}px`,
                      } as React.CSSProperties : undefined}
                      className="export-columns-menu absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-20 animate-fade-in text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                        <span className="font-bold text-slate-700">Export Columns</span>
                        <button 
                          onClick={() => {
                            setVisibleColumns({
                              sku: true,
                              name: true,
                              category: true,
                              brand: true,
                              supplier: true,
                              price: true,
                              cost: true,
                              stock: true,
                            });
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {(['sku', 'name', 'category', 'brand', 'supplier', 'price', 'cost', 'stock'] as const).map((colKey) => {
                          const labelMap: Record<string, string> = {
                            sku: 'SKU Code',
                            name: 'Product Name',
                            category: 'Category',
                            brand: 'Brand',
                            supplier: 'Supplier',
                            price: 'Retail Price',
                            cost: 'Cost Price',
                            stock: 'Stock Qty',
                          };
                          return (
                            <label key={colKey} className="flex items-center space-x-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={visibleColumns[colKey]}
                                onChange={(e) => {
                                  setVisibleColumns(prev => ({
                                    ...prev,
                                    [colKey]: e.target.checked
                                  }));
                                }}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                              />
                              <span className="font-medium text-slate-600">{labelMap[colKey]}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* PDF Export Button */}
              <button
                onClick={handleExportPDF}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Export to PDF"
              >
                <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#ef4444" />
                  <text x="12" y="14.5" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">PDF</text>
                </svg>
              </button>

              {/* Excel Export Button */}
              <button
                onClick={handleExportExcel}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Export to Excel"
              >
                <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#10b981" />
                  <text x="12" y="14.5" fill="white" fontSize="6.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">XLS</text>
                </svg>
              </button>
            </>
          )}

          {currentUser?.role !== 'Salesman' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-[#0a2540] text-white font-bold text-[10px] sm:text-xs rounded-lg sm:rounded-xl hover:bg-[#113152] transition-colors shadow-lg shadow-[#0a2540]/15 flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap cursor-pointer flex-1 justify-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import Product</span>
              <span className="sm:hidden">Import</span>
            </button>
          )}

          {currentUser?.role !== 'Salesman' && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setActiveView('create-product');
                appNavigate('/create-product');
              }}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-blue-600 text-white font-bold text-[10px] sm:text-xs rounded-lg sm:rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15 flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap cursor-pointer flex-1 justify-center"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between text-slate-700">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold">Filter Options</span>
          </div>
          {/* View toggle option */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                viewMode === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Search + Filter toggler bar (visible below lg screen) */}
        <div className="flex lg:hidden gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Responsive Grid container for all selectors */}
        <div className={`${showFilters ? 'grid' : 'hidden lg:grid'} min-w-0 items-stretch grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3`}>
          {/* Search text (visible only on desktop lg screen) */}
          <div className="relative hidden lg:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
            />
          </div>

          {/* Category selection */}
          <AppSelect
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full px-3 py-1 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 cursor-pointer shadow-sm transition-all hover:border-slate-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </AppSelect>

          {/* Brand selection */}
          <AppSelect
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-1 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 cursor-pointer shadow-sm transition-all hover:border-slate-300"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </AppSelect>

          {/* Supplier selection */}
          <AppSelect
            value={selectedSup}
            onChange={(e) => setSelectedSup(e.target.value)}
            className="w-full px-3 py-1 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 cursor-pointer shadow-sm transition-all hover:border-slate-300"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </AppSelect>

          {/* Stock state */}
          <AppSelect
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="w-full px-3 py-1 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 cursor-pointer shadow-sm transition-all hover:border-slate-300"
          >
            <option value="">All Stock Levels</option>
            <option value="good">Adequate Stock</option>
            <option value="low">Low Stock Warning</option>
            <option value="out">Out of Stock</option>
          </AppSelect>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {viewMode === 'card' && paginatedProducts.length > 0 && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/55 flex items-center justify-between">
            <label className="flex items-center space-x-2 text-xs text-slate-500 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.includes(p.id))}
                onChange={(e) => {
                  if (e.target.checked) {
                    const pageIds = paginatedProducts.map((p) => p.id);
                    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                  } else {
                    const pageIds = paginatedProducts.map((p) => p.id);
                    setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                  }
                }}
                className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
              />
              <span>Select All on Page</span>
            </label>
            <span className="text-[10px] text-slate-400 font-semibold">
              Showing {paginatedProducts.length} items
            </span>
          </div>
        )}

        {viewMode === 'card' ? (
          <div className="p-4 bg-slate-50/20">
            {paginatedProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Boxes className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">No matching products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                {paginatedProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const br = brands.find((b) => b.id === p.brandId);
                  const isLow = p.stock <= p.minStockAlert;
                  const isOut = p.stock <= 0;
                  const isSelected = selectedProductIds.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className={`relative border rounded-xl p-3.5 bg-white transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:border-slate-200/80 flex flex-col justify-between group ${
                        isSelected ? 'border-blue-400 bg-blue-50/5' : 'border-slate-100'
                      }`}
                    >
                      {/* Checkbox & Status */}
                      <div className="flex items-center justify-between w-full mb-2.5">
                        <div 
                          className="flex items-center p-1 -m-1 cursor-pointer rounded hover:bg-slate-50 transition-colors"
                          onClick={(e) => {
                            if (e.target instanceof HTMLInputElement) return;
                            if (isSelected) {
                              setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                            } else {
                              setSelectedProductIds((prev) => [...prev, p.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds((prev) => [...prev, p.id]);
                              } else {
                                setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer mr-1.5"
                          />
                          <span className="text-[10px] text-slate-400 font-bold select-none">Select</span>
                        </div>
                        <div>
                          {isOut ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 flex items-center">
                              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                              Adequate
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Image & Product info */}
                      <div className="space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-24 sm:h-28 rounded-lg object-cover bg-slate-50 border border-slate-100/80"
                          />
                          <div className="space-y-0.5 mt-2">
                            <span className="text-[9px] text-slate-400 font-mono block">{p.sku}</span>
                            <h4 className="font-bold text-slate-800 text-xs line-clamp-1" title={p.name}>{p.name}</h4>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50/80 text-blue-600 text-[8px] font-bold">
                              {cat ? cat.name : 'Unassigned'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-bold">
                              {br ? br.name : 'Unassigned'}
                            </span>
                          </div>
                        </div>

                        {/* Prices & Stock info */}
                        <div className="mt-2 pt-2 border-t border-slate-100/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800">৳{p.price.toFixed(0)}</span>
                            {currentUser?.role !== 'Salesman' && (
                              <span className="text-[9px] text-slate-400 font-medium">Cost: ৳{p.cost.toFixed(0)}</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-medium">Stock Count:</span>
                            <span className={`font-extrabold px-1.5 py-0.5 rounded text-[9px] ${
                              isOut 
                                ? 'text-rose-600 bg-rose-50' 
                                : isLow 
                                  ? 'text-amber-600 bg-amber-50' 
                                  : 'text-slate-700 bg-slate-50'
                            }`}>
                              {p.stock} units
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-100/80 mt-2">
                        <button
                          onClick={() => {
                            setViewingProduct(p);
                            setActiveView('view-product');
                            appNavigate('/view-product');
                          }}
                          className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 transition-all flex items-center justify-center cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {currentUser?.role !== 'Salesman' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setActiveView('create-product');
                                appNavigate('/create-product');
                              }}
                              className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all flex items-center justify-center cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSingle(p.id)}
                              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-all flex items-center justify-center cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  {/* Checkbox Header */}
                  <th 
                    className="p-4 w-12 text-center cursor-pointer select-none"
                    onClick={(e) => {
                      if (e.target instanceof HTMLInputElement) return;
                      const allSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.includes(p.id));
                      const pageIds = paginatedProducts.map((p) => p.id);
                      if (allSelected) {
                        setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                      } else {
                        setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = paginatedProducts.map((p) => p.id);
                          setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                        } else {
                          const pageIds = paginatedProducts.map((p) => p.id);
                          setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4 text-left">Price</th>
                  {currentUser?.role !== 'Salesman' && (
                    <th className="p-4 text-left">Cost</th>
                  )}
                  <th className="p-4 text-center">Stock Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={currentUser?.role === 'Salesman' ? 7 : 8} className="p-12 text-center text-slate-400">
                      <Boxes className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs">No matching products found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const br = brands.find((b) => b.id === p.brandId);
                    const isLow = p.stock <= p.minStockAlert;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors group">
                        {/* Checkbox column */}
                        <td 
                          className="p-4 text-center w-12 cursor-pointer"
                          onClick={(e) => {
                            if (e.target instanceof HTMLInputElement) return;
                            const isSelected = selectedProductIds.includes(p.id);
                            if (isSelected) {
                              setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                            } else {
                              setSelectedProductIds((prev) => [...prev, p.id]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(p.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds((prev) => [...prev, p.id]);
                              } else {
                                setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                              }
                            }}
                            className="rounded border-slate-200 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                          />
                        </td>

                        {/* Image / Name with visual display of SKU code */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-100"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 block truncate max-w-[200px]">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{p.sku}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-4 text-slate-500 font-semibold">{cat ? cat.name : 'Unassigned'}</td>

                        {/* Brand */}
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {br ? br.name : 'Unassigned'}
                          </span>
                        </td>

                        {/* Retail Price */}
                        <td className="p-4 text-left font-bold text-slate-800">৳{p.price.toFixed(0)}</td>

                        {/* Supplier Cost */}
                        {currentUser?.role !== 'Salesman' && (
                          <td className="p-4 text-left font-medium text-slate-400">৳{p.cost.toFixed(0)}</td>
                        )}

                        {/* Real-time Stock level */}
                        <td className="p-4">
                          <div className="flex flex-col items-center space-y-1">
                            <span className={`font-black text-xs text-center ${isOut ? 'text-rose-600' : isLow ? 'text-blue-600' : 'text-slate-800'}`}>
                              {p.stock} units
                            </span>

                            {/* Low stock indicators */}
                            {isOut ? (
                              <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider">Out of Stock</span>
                            ) : isLow ? (
                              <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider flex items-center">
                                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                                Low Stock (Alert: {p.minStockAlert})
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Adequate</span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5 opacity-100 group-hover:opacity-100 transition-opacity">
                            {/* View details button (always visible) */}
                            <button
                              onClick={() => {
                                setViewingProduct(p);
                                setActiveView('view-product');
                                appNavigate('/view-product');
                              }}
                              className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 transition-all flex items-center justify-center cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {currentUser?.role !== 'Salesman' && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setActiveView('create-product');
                                    appNavigate('/create-product');
                                  }}
                                  className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-all flex items-center justify-center cursor-pointer"
                                  title="Edit Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSingle(p.id)}
                                  className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-all flex items-center justify-center cursor-pointer"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
            <span className="text-[11px] text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-700">
                {Math.min(endIndex, filteredProducts.length)}
              </span>{' '}
              of <span className="font-bold text-slate-700">{filteredProducts.length}</span> products
            </span>
            
            <div className="flex items-center space-x-1">
              {/* Previous page button */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-full text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                    activePage === pageNum
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next page button */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages || totalPages === 0}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Import Product Modal Component --- */}
      {showImportModal && (
        <div
          onClick={() => {
            setShowImportModal(false);
            setUploadedFile(null);
            setParsedProductsList([]);
            setImportError(null);
            setImportCategoryId('');
            setImportBrandId('');
            setImportSupplierId('');
          }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 relative flex flex-col max-h-[95vh] overflow-hidden animate-fade-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">Import Product</h3>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setUploadedFile(null);
                  setParsedProductsList([]);
                  setImportError(null);
                  setImportCategoryId('');
                  setImportBrandId('');
                  setImportSupplierId('');
                }} 
                className="text-white hover:opacity-90 bg-red-500 rounded-full flex items-center justify-center p-1 cursor-pointer w-5 h-5 absolute top-5 right-5"
                title="Close"
              >
                <X className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Toggle-able Database ID reference lists */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-slate-700">Database Name & ID Reference:</span>
                  <div className="flex space-x-1 bg-slate-200/60 rounded-lg p-0.5 self-start">
                    {(['categories', 'brands', 'suppliers'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveRefTab(tab)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all capitalize cursor-pointer ${
                          activeRefTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                  {activeRefTab === 'categories' && categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-white border border-slate-100 px-2 py-1 rounded">
                      <span className="text-slate-600 font-medium">{c.name}</span>
                      <span className="text-blue-600 font-bold select-all">{c.id}</span>
                    </div>
                  ))}
                  {activeRefTab === 'brands' && brands.map(b => (
                    <div key={b.id} className="flex justify-between items-center bg-white border border-slate-100 px-2 py-1 rounded">
                      <span className="text-slate-600 font-medium">{b.name}</span>
                      <span className="text-blue-600 font-bold select-all">{b.id}</span>
                    </div>
                  ))}
                  {activeRefTab === 'suppliers' && suppliers.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-white border border-slate-100 px-2 py-1 rounded">
                      <span className="text-slate-600 font-medium">{s.name}</span>
                      <span className="text-blue-600 font-bold select-all">{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download Sample Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadSampleFile}
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample File</span>
                </button>
              </div>

              {/* Upload Drag & Drop Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Upload Excel / CSV File</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => {
                    const input = document.getElementById('csv-file-input');
                    if (input) input.click();
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    dragActive 
                      ? 'border-[#f97316] bg-[#f97316]/5' 
                      : uploadedFile 
                        ? 'border-emerald-300 bg-emerald-50/20' 
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50'
                  }`}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {/* Beautiful Orange Cloud SVG with Arrow */}
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-2 text-[#f97316]">
                    <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>

                  <p className="text-xs font-medium text-slate-600 text-center">
                    Drag and drop a <span className="text-[#f97316] font-bold">file to upload</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports Excel (.xlsx, .xls) and CSV (.csv) files</p>
                </div>
              </div>

              {/* Status & Error Display */}
              {uploadedFile && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between font-medium text-slate-700">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                  </div>

                  {importError ? (
                    <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg p-2.5 text-[11px] font-medium leading-relaxed">
                      <div className="flex items-start space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{importError}</span>
                      </div>
                    </div>
                  ) : parsedProductsList.length > 0 ? (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg p-2.5 text-[11px] font-bold">
                      <div className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 stroke-[3px]" />
                        <span>Successfully parsed {parsedProductsList.length} products! Ready to import.</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setUploadedFile(null);
                  setParsedProductsList([]);
                  setImportError(null);
                  setImportCategoryId('');
                  setImportBrandId('');
                  setImportSupplierId('');
                }}
                className="px-5 py-2.5 bg-[#0a2540] hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={parsedProductsList.length === 0}
                className={`px-5 py-2.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
                  parsedProductsList.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
