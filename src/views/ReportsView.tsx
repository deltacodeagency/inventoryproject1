import React, { useState } from 'react';
import { useInventory, ensureProductBatches } from '../context/InventoryContext';
import Swal from 'sweetalert2';
import {
  TrendingUp,
  Boxes,
  Truck,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  FileText,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    products,
    categories,
    brands,
    suppliers,
    sales,
    purchases,
    expenses,
    incomes,
    returns,
    activeView
  } = useInventory();

  // Export Simulation
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const handleExport = (format: string) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      Swal.fire({ icon: 'success', title: 'Export Complete', text: `Report exported successfully as ${format.toUpperCase()}!`, confirmButtonColor: '#2563eb' });
    }, 1500);
  };

  // -------------------------------------------------------------
  // REPORT AGGREGATORS & COMPUTATIONS (COMPUTED DYNAMICALLY)
  // -------------------------------------------------------------
  const inventoryData = useInventory();
  const adjustments = inventoryData.adjustments || [];

  const isWithinDate = (dateStr) => {
    if (!startDate && !endDate) return true;
    const d = new Date(dateStr);
    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-01-01');
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  const filteredSales = sales.filter(s => isWithinDate(s.date));
  const filteredPurchases = purchases.filter(p => isWithinDate(p.date));
  const filteredExpenses = expenses.filter(e => isWithinDate(e.date));
  const filteredIncomes = incomes.filter(i => isWithinDate(i.date));
  const filteredAdjustments = adjustments.filter(a => isWithinDate(a.date));

  const totalSalesSum = filteredSales.reduce((sum, s) => sum + s.total, 0);
  
  const purchaseAdjustments = filteredAdjustments.filter(a => a.type === 'addition');
  const adjustmentPurchaseTotal = purchaseAdjustments.reduce((sum, a) => {
      const prod = products.find(p => p.id === a.productId);
      return sum + (a.quantity * (a.cost || (prod?.cost ?? 0)));
  }, 0);
  const totalPurchasesSum = filteredPurchases.reduce((sum, p) => sum + p.total, 0) + adjustmentPurchaseTotal;

  const totalExpensesSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const totalIncomesSum = filteredIncomes.reduce((sum, i) => sum + i.amount, 0) + totalSalesSum;

  const stockAssetValuation = products.reduce((sum, p) => {
    const batches = ensureProductBatches(p);
    return sum + batches.reduce((bSum, b) => bSum + b.cost * b.quantity, 0);
  }, 0);
  const totalStockUnitsCount = products.reduce((sum, p) => sum + p.stock, 0);

  // Render proper sub-report depending on activeView
  const renderSubReport = () => {
    switch (activeView) {
      // 1. SALES REPORT
      case 'rep-sales':
        return (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Sales Value</span>
                <p className="text-lg font-black text-slate-800">৳{totalSalesSum.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sales Invoices</span>
                <p className="text-lg font-black text-slate-800">{filteredSales.length}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Average Ticket Size</span>
                <p className="text-lg font-black text-slate-800">
                  ৳{sales.length > 0 ? (totalSalesSum / (filteredSales.length || 1)).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="p-3 font-mono font-bold text-slate-700">{sale.invoiceNo}</td>
                      <td className="p-3 font-semibold text-slate-800">{sale.customerName}</td>
                      <td className="p-3">{sale.paymentMethod}</td>
                      <td className="p-3 text-right font-medium text-slate-400">৳{sale.subtotal.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-slate-800">৳{sale.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 2. PURCHASE REPORT
      case 'rep-purchase':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Procurement Expenditure</span>
                <p className="text-lg font-black text-slate-800">৳{totalPurchasesSum.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Sourcing Batches</span>
                <p className="text-lg font-black text-slate-800">{filteredPurchases.length + purchaseAdjustments.length} Batches</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Sourcing No</th>
                    <th className="p-3">Sourcing Date</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3 text-right">Total Outflow</th>
                    <th className="p-3 text-center">Batch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredPurchases.map((pur) => (
                    <tr key={pur.id}>
                      <td className="p-3 font-mono font-bold text-slate-700">{pur.purchaseNo}</td>
                      <td className="p-3 text-slate-400">{new Date(pur.date).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-800">{pur.supplierName}</td>
                      <td className="p-3 text-right font-bold text-slate-800">৳{pur.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          pur.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {pur.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {purchaseAdjustments.map((adj) => {
                    const prod = products.find(p => p.id === adj.productId);
                    const cost = adj.quantity * (adj.cost || (prod?.cost ?? 0));
                    return (
                      <tr key={adj.id}>
                        <td className="p-3 font-mono font-bold text-slate-700">ADJ-{adj.id.slice(0,4)}</td>
                        <td className="p-3 text-slate-400">{new Date(adj.date).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold text-slate-800">Stock Addition</td>
                        <td className="p-3 text-right font-bold text-slate-800">৳{cost.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-600">
                            Added
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 3. INVENTORY REPORT
      case 'rep-inventory':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Stock Asset Valuation</span>
                <p className="text-lg font-black text-slate-800">৳{stockAssetValuation.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sourced Units</span>
                <p className="text-lg font-black text-slate-800">{totalStockUnitsCount} Units</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Low Stock Warnings</span>
                <p className="text-lg font-black text-amber-500">
                  {products.filter(p => p.stock <= p.minStockAlert).length} Items
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-left">Unit Cost</th>
                    <th className="p-3 text-center">In-Stock units</th>
                    <th className="p-3 text-left">Asset Sub-total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td className="p-3 font-mono text-slate-400 font-bold">{prod.sku}</td>
                      <td className="p-3 font-semibold text-slate-800">{prod.name}</td>
                      <td className="p-3 text-left">৳{prod.cost.toFixed(2)}</td>
                      <td className="p-3 text-center font-bold">{prod.stock}</td>
                      <td className="p-3 text-left font-black text-slate-800">
                        ৳{(prod.stock * prod.cost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 4. SUPPLIER REPORT
      case 'rep-supplier':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 max-w-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Suppliers</span>
              <p className="text-lg font-black text-slate-800">{suppliers.length} Registered partners</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Supplier Company</th>
                    <th className="p-3">Agent</th>
                    <th className="p-3">Linked Catalog</th>
                    <th className="p-3 text-right">Sourcing Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {suppliers.map((sup) => {
                    const supplierProducts = products.filter(p => p.supplierId === sup.id);
                    const catalogCount = supplierProducts.length;
                    const sourcedCost = supplierProducts.reduce((sum, p) => sum + (p.stock * p.cost), 0);

                    return (
                      <tr key={sup.id}>
                        <td className="p-3 font-bold text-slate-800">{sup.company}</td>
                        <td className="p-3 font-medium text-slate-500">{sup.name}</td>
                        <td className="p-3">{catalogCount} distinct products</td>
                        <td className="p-3 text-right font-black text-slate-800">৳{sourcedCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 5. PRODUCT PERFORMANCE REPORT
      case 'rep-product':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">In Stock</th>
                    <th className="p-3 text-center">Units Sold</th>
                    <th className="p-3 text-left">Gross Profit Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {products.map((prod) => {
                    // Calculate sold units and FIFO-based profits
                    let soldUnits = 0;
                    let totalRevenueOfProduct = 0;
                    let totalCostOfProduct = 0;
                    filteredSales.forEach((s) => {
                      s.items.forEach((item) => {
                        if (item.productId === prod.id) {
                          soldUnits += item.quantity;
                          totalRevenueOfProduct += item.quantity * item.price;
                          totalCostOfProduct += item.quantity * (item.cost !== undefined ? item.cost : prod.cost);
                        }
                      });
                    });

                    const actualProfit = totalRevenueOfProduct - totalCostOfProduct;
                    const profitPercentage = totalRevenueOfProduct > 0 
                      ? (actualProfit / totalRevenueOfProduct) * 100 
                      : (((prod.price - prod.cost) / (prod.price || 1)) * 100);
                    const profitPerUnit = soldUnits > 0 
                      ? actualProfit / soldUnits 
                      : (prod.price - prod.cost);

                    return (
                      <tr key={prod.id}>
                        <td className="p-3 font-bold text-slate-800">{prod.name}</td>
                        <td className="p-3 text-center font-bold text-slate-400">{prod.stock}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{soldUnits}</td>
                        <td className="p-3 text-left font-semibold text-emerald-600">
                          {profitPercentage.toFixed(1)}% (৳{profitPerUnit.toFixed(0)} / unit)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 6. INCOME REPORT
      case 'rep-income':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 max-w-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Auxiliary Incomes</span>
              <p className="text-lg font-black text-slate-800">৳{totalIncomesSum.toFixed(2)}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Sourcing Description</th>
                    <th className="p-3 text-right">Outflow Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredIncomes.map((inc) => (
                    <tr key={inc.id}>
                      <td className="p-3 text-slate-400">{new Date(inc.date).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-800">{inc.category}</td>
                      <td className="p-3 text-slate-500">{inc.description}</td>
                      <td className="p-3 text-right font-black text-slate-800">৳{inc.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="p-3 text-slate-400">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-800">Product Sales</td>
                      <td className="p-3 text-slate-500">Invoice: {sale.invoiceNo}</td>
                      <td className="p-3 text-right font-black text-slate-800">৳{sale.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 7. EXPENSE REPORT
      case 'rep-expense':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1 max-w-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Administrative Outflows</span>
              <p className="text-lg font-black text-slate-800">৳{totalExpensesSum.toFixed(2)}</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Outflow Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Invoiced Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="p-3 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-800">{exp.category}</td>
                      <td className="p-3 text-slate-500">{exp.description}</td>
                      <td className="p-3 text-right font-black text-slate-800">৳{exp.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 8. ANNUAL REPORT
      case 'rep-annual':
        const totalCOGSVal = filteredSales.reduce((sum, s) => sum + (s.costOfGoodsSold !== undefined ? s.costOfGoodsSold : s.items.reduce((iSum, item) => iSum + (item.cost || 0) * item.quantity, 0)), 0);
        const grossProfits = totalSalesSum - totalCOGSVal;
        const netProfits = grossProfits + totalIncomesSum - totalExpensesSum;

        return (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Corporate Income Turnover</span>
                <p className="text-lg font-black text-slate-800">৳{(totalSalesSum + totalIncomesSum).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Corporate Cash Outflows</span>
                <p className="text-lg font-black text-slate-800">৳{(totalPurchasesSum + totalExpensesSum).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Gross Margin</span>
                <p className={`text-lg font-black ${grossProfits >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ৳{grossProfits.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Annual Net Margin</span>
                <p className={`text-lg font-black ${netProfits >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  ৳{netProfits.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Sourcing Trends Charts */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-800">AnnualSourcing Margin Curves</h4>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Estimated performance trajectory curve based on May-July data</span>
              </div>

              {/* Custom SVG Area curve */}
              <div className="w-full h-44 px-2 pt-4 relative border-b border-l border-slate-100">
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="300" y2="25" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="300" y2="75" stroke="#F1F5F9" strokeDasharray="3 3" />

                  {/* Profit Area */}
                  <path
                    d={`M 10 90 L 150 45 L 290 ${netProfits >= 0 ? 25 : 85} L 290 100 L 10 100 Z`}
                    fill="url(#annualBlueGrad)"
                    opacity="0.15"
                  />
                  {/* Profit Line */}
                  <path
                    d={`M 10 90 L 150 45 L 290 ${netProfits >= 0 ? 25 : 85}`}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Dots */}
                  <circle cx="10" cy="90" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="150" cy="45" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="290" cy={netProfits >= 0 ? 25 : 85} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />

                  <defs>
                    <linearGradient id="annualBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X labels */}
                <div className="absolute bottom-[-24px] left-0 right-0 flex justify-between px-6 text-[10px] text-slate-400 font-bold">
                  <span>Q2 Start (May)</span>
                  <span>Mid Q2 (June)</span>
                  <span>Q3 Start (July)</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Format active report label
  const getReportLabel = () => {
    const reportType = activeView.split('-')[1];
    return `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Performance Report`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mobile-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">{getReportLabel()}</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Corporate business statistics and audit dashboards</span>
        </div>

        {/* Date Filter & Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer" />
            <span className="text-slate-300">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer" />
          </div>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 disabled:bg-slate-50 transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting}
            className="px-3.5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-1.5 shadow-lg shadow-blue-500/15"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Render selected sub-report */}
      {renderSubReport()}
    </div>
  );
};
