const fs = require('fs');
let content = fs.readFileSync('src/views/ReportsView.tsx', 'utf8');

// Normalize newlines to \n for matching
content = content.replace(/\r\n/g, '\n');

// 1. Date states
content = content.replace(
    'const [exporting, setExporting] = useState(false);',
    'const [exporting, setExporting] = useState(false);\n  const [startDate, setStartDate] = useState("");\n  const [endDate, setEndDate] = useState("");'
);

// 2. Metrics Block
const metricsTarget = `  // -------------------------------------------------------------
  // REPORT AGGREGATORS & COMPUTATIONS (COMPUTED DYNAMICALLY)
  // -------------------------------------------------------------
  const totalSalesSum = sales.reduce((sum, s) => sum + s.total, 0);
  const totalPurchasesSum = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalExpensesSum = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncomesSum = incomes.reduce((sum, i) => sum + i.amount, 0);
  const stockAssetValuation = products.reduce((sum, p) => {
    const batches = ensureProductBatches(p);
    return sum + batches.reduce((bSum, b) => bSum + b.cost * b.quantity, 0);
  }, 0);
  const totalStockUnitsCount = products.reduce((sum, p) => sum + p.stock, 0);`;

const metricsReplacement = `  // -------------------------------------------------------------
  // REPORT AGGREGATORS & COMPUTATIONS (COMPUTED DYNAMICALLY)
  // -------------------------------------------------------------
  // Extract adjustments from context (assuming it is exported, else default to [])
  const inventoryData = useInventory();
  const adjustments = inventoryData.adjustments || [];

  // Filter functions
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
  const totalStockUnitsCount = products.reduce((sum, p) => sum + p.stock, 0);`;

if (!content.includes(metricsTarget)) {
    console.log("METRICS TARGET NOT FOUND!");
}
content = content.replace(metricsTarget, metricsReplacement);

// Fix Annual Report
const annualReportTarget = `        const totalCOGSVal = sales.reduce((sum, s) => sum + (s.costOfGoodsSold !== undefined ? s.costOfGoodsSold : s.items.reduce((iSum, item) => iSum + (item.cost || 0) * item.quantity, 0)), 0);
        const grossProfits = totalSalesSum - totalCOGSVal;
        const netProfits = grossProfits + totalIncomesSum - totalExpensesSum;`;
const annualReportReplacement = `        const totalCOGSVal = filteredSales.reduce((sum, s) => sum + (s.costOfGoodsSold !== undefined ? s.costOfGoodsSold : s.items.reduce((iSum, item) => iSum + (item.cost || 0) * item.quantity, 0)), 0);
        const grossProfits = totalSalesSum - totalCOGSVal;
        const netProfits = grossProfits + totalIncomesSum - totalExpensesSum;`;
content = content.replace(annualReportTarget, annualReportReplacement);

fs.writeFileSync('src/views/ReportsView.tsx', content);
