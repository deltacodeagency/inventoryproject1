import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useInventory, ensureProductBatches } from '../context/InventoryContext';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Layers,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { TakaIcon } from '../components/TakaIcon';
import { AppSelect } from '../components/AppSelect';

export const DashboardView: React.FC = () => {
  const {
    products,
    categories,
    suppliers,
    sales,
    purchases,
    expenses,
    returns,
    setActiveView,
    updateProduct,
    addAlert,
    users,
    currentUser
  } = useInventory();

  // Interactive filters state
  const [salesPurchaseRange, setSalesPurchaseRange] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'Custom'>('1Y');
  const [salesPurchaseStartDate, setSalesPurchaseStartDate] = useState<string>('');
  const [salesPurchaseEndDate, setSalesPurchaseEndDate] = useState<string>('');
  const [topSellingRange, setTopSellingRange] = useState<'Today' | 'Weekly' | 'Monthly'>('Today');
  const [recentSalesRange, setRecentSalesRange] = useState<'Weekly' | 'Today' | 'Monthly' | 'Custom'>('Weekly');
  const [recentSalesStartDate, setRecentSalesStartDate] = useState<string>('');
  const [recentSalesEndDate, setRecentSalesEndDate] = useState<string>('');
  const [recentSalesSearch, setRecentSalesSearch] = useState<string>('');

  // Quick Reorder modal state
  const [reorderProduct, setReorderProduct] = useState<any>(null);
  const [reorderQty, setReorderQty] = useState(20);

  // --- HELPER: Date filtering ---
  const isWithinRange = (
    dateStr: string,
    range: 'Today' | 'Weekly' | 'Monthly' | '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'Custom',
    customStart?: string,
    customEnd?: string
  ) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Month-based views must use whole calendar months so the totals match
    // the month columns (and the 1M calendar) exactly.
    const isInRecentCalendarMonths = (monthCount: number) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return d >= start && d < end;
    };

    if (range === 'Custom') {
      // Date inputs do not include a time. Use local day boundaries so the
      // selected end date includes every order made on that day.
      const start = customStart ? new Date(`${customStart}T00:00:00`) : null;
      const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : null;
      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) return false;
      if (start && end && start > end) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    }

    switch (range) {
      case 'Today':
      case '1D':
        return diffHours <= 24 || d.toDateString() === now.toDateString();
      case 'Weekly':
      case '1W':
        return diffDays <= 7;
      case 'Monthly':
      case '1M':
        return isInRecentCalendarMonths(1);
      case '3M':
        return isInRecentCalendarMonths(3);
      case '6M':
        return isInRecentCalendarMonths(6);
      case '1Y':
        return isInRecentCalendarMonths(12);
      default:
        return true;
    }
  };

  // --- CORE TOTALS (REAL-TIME DATA) ---
  const totalSalesVal = useMemo(() => sales.reduce((sum, s) => sum + (s.total || 0), 0), [sales]);
  const totalPurchasesVal = useMemo(() => { return products.reduce((sum, p) => { const batches = ensureProductBatches ? ensureProductBatches(p) : (p.batches || []); const batchVal = batches.reduce((bSum, b) => bSum + ((b.initialQuantity || b.quantity || 0) * (b.cost || 0)), 0); return sum + batchVal; }, 0); }, [products]); const totalStockEntries = useMemo(() => { return products.reduce((sum, p) => { const batches = ensureProductBatches ? ensureProductBatches(p) : (p.batches || []); return sum + batches.length; }, 0); }, [products]);
  const totalExpensesVal = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);

  // Stock Asset Value (calculated using batches or product cost * stock)
  const totalStockVal = useMemo(() => {
    return products.reduce((sum, p) => {
      const batches = ensureProductBatches ? ensureProductBatches(p) : (p.batches || []);
      if (batches && batches.length > 0) {
        const batchVal = batches.reduce((bSum, b) => bSum + (b.cost || 0) * (b.quantity || 0), 0);
        return sum + batchVal;
      }
      return sum + ((p.cost || 0) * (p.stock || 0));
    }, 0);
  }, [products]);

  // COGS & Profit
  const cogsVal = useMemo(() => {
    return sales.reduce((sum, s) => {
      if (s.costOfGoodsSold) return sum + s.costOfGoodsSold;
      const saleCost = (s.items || []).reduce((iSum, item) => {
        const prod = products.find(p => p.id === item.productId);
        const itemCost = item.cost || prod?.cost || (item.price * 0.7);
        return iSum + (itemCost * item.quantity);
      }, 0);
      return sum + saleCost;
    }, 0);
  }, [sales, products]);

  const profitVal = totalSalesVal - cogsVal - totalExpensesVal;

  // --- 1. SALES & PURCHASE DYNAMIC WIDGET DATA ---
  const filteredSalesForChart = useMemo(
    () => sales.filter(s => isWithinRange(s.date, salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate)),
    [sales, salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate]
  );
  const allStockAdditions = useMemo(() => { const additions = []; products.forEach(p => { const batches = ensureProductBatches ? ensureProductBatches(p) : (p.batches || []); batches.forEach(b => { additions.push({ date: b.date || p.createdAt || new Date().toISOString(), total: (b.initialQuantity || b.quantity || 0) * (b.cost || 0) }); }); }); return additions; }, [products]); const filteredPurchasesForChart = useMemo(() => allStockAdditions.filter(p => isWithinRange(p.date, salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate)), [allStockAdditions, salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate]);

  const salesPurchasePeriodSum = useMemo(() => {
    const sSum = filteredSalesForChart.reduce((acc, s) => acc + (s.total || 0), 0);
    const pSum = filteredPurchasesForChart.reduce((acc, p) => acc + (p.total || 0), 0);
    return { sales: sSum, purchases: pSum };
  }, [filteredSalesForChart, filteredPurchasesForChart]);

  const salesPurchaseProfit = useMemo(
    () => salesPurchasePeriodSum.sales - salesPurchasePeriodSum.purchases,
    [salesPurchasePeriodSum]
  );

  const getRecentPeriods = (range: typeof salesPurchaseRange) => {
    const now = new Date();
    if (range === '3M' || range === '6M' || range === '1Y') {
      const count = range === '3M' ? 3 : range === '6M' ? 6 : 12;
      return Array.from({ length: count }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
        return { label: date.toLocaleString('default', { month: 'short' }), month: date.getMonth(), year: date.getFullYear() };
      });
    }

    if (range === '1W') {
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - i));
        return { label: date.toLocaleDateString('en-GB', { weekday: 'short' }), date } as any;
      });
    }

    return [] as any[];
  };

  // Chart bars for current selected range
  const salesPurchaseBars = useMemo(() => {
    if (salesPurchaseRange === 'Custom') {
      if (!salesPurchaseStartDate || !salesPurchaseEndDate) return [];

      const start = new Date(`${salesPurchaseStartDate}T00:00:00`);
      const end = new Date(`${salesPurchaseEndDate}T00:00:00`);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

      const months = [] as Date[];
      for (
        const date = new Date(start.getFullYear(), start.getMonth(), 1);
        date <= end;
        date.setMonth(date.getMonth() + 1)
      ) {
        months.push(new Date(date));
      }

      return months.map((month) => {
        const isSameMonth = (dateValue: string) => {
          const date = new Date(dateValue);
          return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
        };
        const sVal = filteredSalesForChart
          .filter(s => isSameMonth(s.date))
          .reduce((sum, s) => sum + s.total, 0);
        const pVal = filteredPurchasesForChart
          .filter(p => isSameMonth(p.date))
          .reduce((sum, p) => sum + p.total, 0);

        return {
          time: month.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
          sales: Math.round(sVal),
          purchase: Math.round(pVal)
        };
      });
    }

    if (salesPurchaseRange === '1D') {
      const hours = ['2 am', '4 am', '6 am', '8 am', '10 am', '12 am', '14 pm', '16 pm', '18 pm', '20 pm', '22 pm', '24 pm'];
      return hours.map((time, idx) => {
        const hStart = idx * 2;
        const hEnd = hStart + 2;
        const sVal = filteredSalesForChart.filter(s => {
          const h = new Date(s.date).getHours();
          return h >= hStart && h < hEnd;
        }).reduce((sum, s) => sum + s.total, 0);

        const pVal = filteredPurchasesForChart.filter(p => {
          const h = new Date(p.date).getHours();
          return h >= hStart && h < hEnd;
        }).reduce((sum, p) => sum + p.total, 0);

        return { time, sales: Math.round(sVal), purchase: Math.round(pVal) };
      });
    }

    if (salesPurchaseRange === '1W') {
      const days = getRecentPeriods('1W');
      return days.map((day) => {
        const sVal = filteredSalesForChart.filter(s => {
          const d = new Date(s.date);
          return d.toDateString() === new Date(day.date).toDateString();
        }).reduce((sum, s) => sum + s.total, 0);
        const pVal = filteredPurchasesForChart.filter(p => {
          const d = new Date(p.date);
          return d.toDateString() === new Date(day.date).toDateString();
        }).reduce((sum, p) => sum + p.total, 0);
        return { time: day.label, sales: Math.round(sVal), purchase: Math.round(pVal) };
      });
    }

    if (salesPurchaseRange === '1M') {
      return [];
    }

    const months = getRecentPeriods(salesPurchaseRange as any);
    return months.map((month) => {
      const sVal = filteredSalesForChart.filter(s => {
        const d = new Date(s.date);
        return d.getFullYear() === month.year && d.getMonth() === month.month;
      }).reduce((sum, s) => sum + s.total, 0);
      const pVal = filteredPurchasesForChart.filter(p => {
        const d = new Date(p.date);
        return d.getFullYear() === month.year && d.getMonth() === month.month;
      }).reduce((sum, p) => sum + p.total, 0);
      return { time: month.label, sales: Math.round(sVal), purchase: Math.round(pVal) };
    });
  }, [salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate, filteredSalesForChart, filteredPurchasesForChart]);

  const maxChartVal = useMemo(() => {
    const max = Math.max(...salesPurchaseBars.flatMap(b => [b.sales, b.purchase]), 100);
    return max;
  }, [salesPurchaseBars]);

  const salesPurchaseCalendarDays = useMemo(() => {
    if (salesPurchaseRange !== '1M') return [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: '', isCurrentMonth: false, ordersCount: 0, salesAmount: 0 });
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const daySales = filteredSalesForChart.filter(s => {
        const sd = new Date(s.date);
        return sd.getFullYear() === year && sd.getMonth() === month && sd.getDate() === d;
      });
      const ordersCount = daySales.length;
      const salesAmount = daySales.reduce((sum, s) => sum + s.total, 0);
      days.push({
        day: d,
        isCurrentMonth: true,
        ordersCount,
        salesAmount,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      days.push({ day: '', isCurrentMonth: false, ordersCount: 0, salesAmount: 0 });
    }

    return days;
  }, [salesPurchaseRange, filteredSalesForChart]);

  // --- 3. TOP SELLING PRODUCTS ---
  const topSellingList = useMemo(() => {
    const filteredSales = sales.filter(s => isWithinRange(s.date, topSellingRange));
    const prodMap: Record<string, { id: string; name: string; qty: number; price: number; image: string; category: string; revenue: number }> = {};

    filteredSales.forEach(s => {
      (s.items || []).forEach(item => {
        if (!prodMap[item.productId]) {
          const prod = products.find(p => p.id === item.productId);
          const cat = categories.find(c => c.id === prod?.categoryId);
          prodMap[item.productId] = {
            id: item.productId,
            name: item.productName || prod?.name || 'Product',
            qty: 0,
            price: item.price || prod?.price || 0,
            image: prod?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
            category: cat?.name || 'General',
            revenue: 0
          };
        }
        prodMap[item.productId].qty += item.quantity;
        prodMap[item.productId].revenue += item.quantity * item.price;
      });
    });

    const sorted = Object.values(prodMap).sort((a, b) => b.qty - a.qty);

    if (sorted.length > 0) {
      return sorted.slice(0, 5).map((p, idx) => ({
        ...p,
        growth: `+${25 - idx * 3}%`,
        isPositive: true
      }));
    }

    // Fallback to top products from catalog if no sales in period
    return products.slice(0, 5).map((p, idx) => {
      const cat = categories.find(c => c.id === p.categoryId);
      return {
        id: p.id,
        name: p.name,
        qty: Math.max(1, p.stock * 2),
        price: p.price,
        image: p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
        category: cat?.name || 'General',
        revenue: p.price * 5,
        growth: `+${20 - idx * 2}%`,
        isPositive: true
      };
    });
  }, [sales, topSellingRange, products, categories]);

  const recentSalesList = useMemo(() => {
    const filtered = sales
      .filter(s => isWithinRange(s.date, recentSalesRange, recentSalesStartDate, recentSalesEndDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered
      .map(s => ({
        id: s.id,
        date: new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        customer: s.customerName,
        invoice: s.invoiceNo,
        seller: s.salesperson || 'Unknown',
        price: s.total || 0,
        status: s.status || 'Paid'
      }))
      .filter((sale) => {
        if (!recentSalesSearch.trim()) return true;
        const query = recentSalesSearch.toLowerCase();
        return (
          sale.customer.toLowerCase().includes(query) ||
          sale.invoice.toLowerCase().includes(query) ||
          sale.seller.toLowerCase().includes(query) ||
          sale.date.toLowerCase().includes(query)
        );
      })
      .slice(0, 12);
  }, [sales, recentSalesRange, recentSalesStartDate, recentSalesEndDate, recentSalesSearch]);

  const orderStats = useMemo(() => {
    const filteredOrders = sales.filter(s => isWithinRange(s.date, salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate));
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders
      ? Math.round(filteredOrders.reduce((sum, s) => sum + (s.total || 0), 0) / totalOrders)
      : 0;
    const returnedOrders = filteredOrders.filter(s => s.status === 'Returned').length;
    const processingOrders = filteredOrders.filter(s => s.status === 'Partial').length;
    const sellerCount: Record<string, number> = {};
    filteredOrders.forEach((s) => {
      const name = s.salesperson || 'Unknown';
      sellerCount[name] = (sellerCount[name] || 0) + 1;
    });
    const topSellerEntry = Object.entries(sellerCount).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    return {
      totalOrders,
      avgOrderValue,
      returnedOrders,
      processingOrders,
      topSellerName: topSellerEntry[0],
      topSellerCount: topSellerEntry[1]
    };
  }, [sales, salesPurchaseRange, salesPurchaseStartDate, salesPurchaseEndDate]);

  // --- 4. LOW STOCK PRODUCTS ---
  const lowStockList = useMemo(() => {
    const lowProds = products.filter(p => p.stock <= p.minStockAlert);
    const listToUse = lowProds.length > 0 ? lowProds : [...products].sort((a, b) => a.stock - b.stock);

    return listToUse.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || `#${p.id.slice(0, 6).toUpperCase()}`,
      stock: p.stock,
      image: p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
      isCritical: p.stock <= p.minStockAlert
    }));
  }, [products]);

  // --- 9. ORDER STATISTICS FULL MONTH CALENDAR DATA ---

  // Quick Reorder Submit handler
  const handleQuickReorder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderProduct) return;
    updateProduct(reorderProduct.id, { stock: reorderProduct.stock + Number(reorderQty) });
    addAlert('system', 'Inventory Replenished', `Replenished ${reorderProduct.name} with ${reorderQty} units.`);
    setReorderProduct(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* SECTION 1: Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sales */}
        <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="space-y-1 z-10 min-w-0 flex-1 mr-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 truncate">৳{Math.round(totalSalesVal).toLocaleString()}</h3>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
              <TrendingUp className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate">{sales.length} transactions</span>
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 z-10 shadow-inner">
            <TakaIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Total Purchases */}
        <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="space-y-1 z-10 min-w-0 flex-1 mr-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Purchases</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 truncate">৳{Math.round(totalPurchasesVal).toLocaleString()}</h3>
            <span className="text-[10px] sm:text-[11px] text-blue-600 font-bold flex items-center bg-blue-50 px-2 py-0.5 rounded-full w-fit">
              <ShoppingCart className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate">{totalStockEntries} stock additions</span>
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 z-10 shadow-inner">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Stock Asset Value */}
        <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="space-y-1 z-10 min-w-0 flex-1 mr-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Stock Asset Value</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 truncate">৳{Math.round(totalStockVal).toLocaleString()}</h3>
            <span className="text-[10px] sm:text-[11px] text-indigo-600 font-bold flex items-center bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
              <Boxes className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate">{products.length} distinct products</span>
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 z-10 shadow-inner">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
        </div>

        {/* Profit */}
        {currentUser?.role !== 'Salesman' && (
          <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="space-y-1 z-10 min-w-0 flex-1 mr-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">Profit</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 truncate">৳{Math.round(profitVal).toLocaleString()}</h3>
              <span className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                <TrendingUp className="w-3 h-3 mr-1 shrink-0" />
                <span className="truncate">Net Income Calc</span>
              </span>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 z-10 shadow-inner">
              <TakaIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
          </div>
        )}
      </div>

      {/* SECTION 2: Row 1 — Sales & Purchase */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Sales & Purchase Widget */}
        <div className="p-4 sm:p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4 sm:space-y-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Sales & Purchase</h3>
            </div>

            {/* Time Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 overflow-x-auto max-w-full shrink-0">
              {(['1D', '1W', '1M', '3M', '6M', '1Y', 'Custom'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSalesPurchaseRange(range)}
                  className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all shrink-0 ${
                    salesPurchaseRange === range
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {salesPurchaseRange === 'Custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">From</label>
                <input
                  type="date"
                  value={salesPurchaseStartDate}
                  onChange={(e) => setSalesPurchaseStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-2xl bg-white text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">To</label>
                <input
                  type="date"
                  value={salesPurchaseEndDate}
                  onChange={(e) => setSalesPurchaseEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-2xl bg-white text-slate-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 gap-3 ${currentUser?.role === 'Salesman' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Sales</span>
              <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">৳{salesPurchasePeriodSum.sales.toLocaleString()}</h3>
              <span className="text-[11px] text-slate-500">Includes all invoices in selected period.</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Purchases</span>
              <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">৳{salesPurchasePeriodSum.purchases.toLocaleString()}</h3>
              <span className="text-[11px] text-slate-500">Supplier orders and restock spend.</span>
            </div>
            {currentUser?.role !== 'Salesman' && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Profit</span>
                <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">৳{salesPurchaseProfit.toLocaleString()}</h3>
                <span className="text-[11px] text-slate-500">Sales minus purchases for selected range.</span>
              </div>
            )}
          </div>

          {salesPurchaseRange === '1M' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {salesPurchaseCalendarDays.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-1.5 sm:p-2 rounded-xl border transition-all min-h-[48px] sm:min-h-[56px] ${
                      item.isCurrentMonth
                        ? item.ordersCount > 0
                          ? 'bg-blue-50/80 border-blue-200/80 hover:border-blue-400 shadow-2xs'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                        : 'bg-slate-50/40 border-transparent opacity-30 select-none'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] sm:text-xs font-bold ${
                          item.isToday
                            ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-xs'
                            : item.ordersCount > 0
                            ? 'text-blue-900 font-extrabold'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.day || ''}
                      </span>
                    </div>
                    {item.isCurrentMonth && item.ordersCount > 0 ? (
                      <div className="mt-1">
                        <span className="block px-1 py-0.5 rounded bg-blue-600 text-white text-[8px] sm:text-[9px] font-black text-center truncate shadow-2xs">
                          {item.ordersCount} {item.ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                        <span className="block text-[8px] text-blue-700 font-extrabold text-center mt-0.5 truncate">
                          ৳{Math.round(item.salesAmount)}
                        </span>
                      </div>
                    ) : item.isCurrentMonth ? (
                      <span className="block text-[8px] text-slate-300 font-medium text-center">-</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2 -mx-2 px-2">
              <div className="min-w-[380px]">
                <div className="relative w-full h-56 sm:h-64 border-b border-dashed border-slate-200 pt-4 px-2">
                  <div className="absolute inset-x-0 top-0 border-b border-slate-100 border-dashed text-[10px] font-bold text-slate-300 pl-1">
                    {Math.round(maxChartVal)}
                  </div>
                  <div className="absolute inset-x-0 top-1/2 border-b border-slate-100 border-dashed text-[10px] font-bold text-slate-300 pl-1">
                    {Math.round(maxChartVal / 2)}
                  </div>

                  {/* Bars container */}
                  <div className="h-full flex items-end justify-between px-1 sm:px-2 pt-6 pb-1">
                    {salesPurchaseBars.map((bar, idx) => {
                      const purchHeight = Math.min(200, Math.max(12, (bar.purchase / maxChartVal) * 180));
                      const salesHeight = Math.min(purchHeight, Math.max(8, (bar.sales / maxChartVal) * 180));

                      return (
                        <div key={idx} className="flex flex-col items-center space-y-1 group relative">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap z-20 pointer-events-none shadow-lg">
                            Sales: ৳{bar.sales} | Purchase: ৳{bar.purchase}
                          </div>
                          <div className="w-4 sm:w-8 bg-blue-200 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-105" style={{ height: `${purchHeight}px` }}>
                            <div className="w-full bg-blue-600 rounded-b-sm" style={{ height: `${salesHeight}px` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time axis labels */}
                <div className="flex justify-between px-1 sm:px-2 text-[9px] sm:text-[11px] font-bold text-slate-500 pt-1">
                  {salesPurchaseBars.map((b, i) => (
                    <span key={i} className="truncate">{b.time}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Orders</span>
              <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">{orderStats.totalOrders}</h3>
              <span className="text-[11px] text-slate-500">Orders in selected period.</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Avg Order</span>
              <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900">৳{orderStats.avgOrderValue.toLocaleString()}</h3>
              <span className="text-[11px] text-slate-500">Average order value.</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Top Seller</span>
              <h3 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 truncate">{orderStats.topSellerName}</h3>
              <span className="text-[11px] text-slate-500">{orderStats.topSellerCount} orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Row 2 — Recent Sales, Top Selling & Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        <div className="xl:col-span-7 p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4 lg:flex-nowrap lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-3 max-[639px]:flex-1">
              <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 sm:text-base">Recent Sales</h3>
                <p className="mobile-page-description text-[11px] text-slate-500">Filter sales by date, customer, invoice or seller.</p>
              </div>
            </div>
            <div className="flex w-full flex-nowrap items-center justify-end gap-2 md:w-full lg:w-auto max-[639px]:contents">
              <input
                type="text"
                value={recentSalesSearch}
                onChange={(e) => setRecentSalesSearch(e.target.value)}
                placeholder="Search customer, invoice, seller"
                className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 max-[639px]:order-3 max-[639px]:basis-full max-[639px]:w-full lg:w-[220px] lg:flex-none"
              />
              <AppSelect
                value={recentSalesRange}
                onChange={(e) => setRecentSalesRange(e.target.value as any)}
                className="w-[90px] md:!w-[90px] max-[639px]:order-2 max-[639px]:!w-[90px]"
              >
                <option value="Today">Today</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom">Custom</option>
              </AppSelect>
            </div>
          </div>

          {recentSalesRange === 'Custom' && (
            <div className="mt-4 grid w-full min-w-0 max-w-full grid-cols-1 gap-3 overflow-hidden md:grid-cols-2">
              <div className="min-w-0 space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">From</label>
                <input
                  type="date"
                  value={recentSalesStartDate}
                  onChange={(e) => setRecentSalesStartDate(e.target.value)}
                  className="block h-9 w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-bold">To</label>
                <input
                  type="date"
                  value={recentSalesEndDate}
                  onChange={(e) => setRecentSalesEndDate(e.target.value)}
                  className="block h-9 w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500 border-b border-slate-200">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Invoice</th>
                  <th className="pb-3 pr-4">Seller</th>
                  <th className="pb-3 pr-4 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {recentSalesList.map((sale) => (
                  <tr key={sale.id} className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-3xl">
                    <td className="py-3 pr-4 text-[12px] text-slate-600">{sale.date}</td>
                    <td className="py-3 pr-4 text-[12px] font-semibold text-slate-800 truncate max-w-[180px]">{sale.customer}</td>
                    <td className="py-3 pr-4 text-[12px] text-slate-600">{sale.invoice}</td>
                    <td className="py-3 pr-4 text-[12px] text-slate-600">{sale.seller}</td>
                    <td className="py-3 pr-4 text-[12px] font-black text-slate-800 text-right">৳{sale.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 grid gap-4">
          <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 sm:text-base">Top Selling</h3>
                  <p className="mobile-page-description text-[11px] text-slate-500">Best selling products this period.</p>
                </div>
              </div>
              <AppSelect
                value={topSellingRange}
                onChange={(e) => setTopSellingRange(e.target.value as any)}
                className="!w-[110px]"
              >
                <option value="Today">Today</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </AppSelect>
            </div>
            <div className="space-y-3">
              {topSellingList.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-sm font-black text-slate-900">{item.qty}</p>
                    <p className="text-[10px] text-slate-500">sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Low Stock</h3>
                  <p className="text-[11px] text-slate-500">Products needing restock.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('low-stock')}
                className="text-xs font-bold text-slate-500 hover:text-blue-600"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {lowStockList.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">ID: {item.sku}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${item.isCritical ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-700'}`}>
                    {item.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Quick Reorder Modal overlay */}
      {reorderProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900">Quick Reorder</h3>
              <button
                onClick={() => setReorderProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                <strong>{reorderProduct?.name}</strong> - SKU: {reorderProduct?.sku}
              </p>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={reorderQty}
                  onChange={(e) => setReorderQty(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setReorderProduct(null)}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reorderProduct) {
                    toast.success(`Ordered ${reorderQty}x ${reorderProduct.name}`);
                    setReorderProduct(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
