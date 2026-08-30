const fs = require('fs');
let content = fs.readFileSync('src/views/ReportsView.tsx', 'utf8');

content = content.replace(/\r\n/g, '\n');

content = content.replace(
    'const [exporting, setExporting] = useState(false);',
    'const [exporting, setExporting] = useState(false);\n  const [startDate, setStartDate] = useState("");\n  const [endDate, setEndDate] = useState("");'
);

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
  const totalStockUnitsCount = products.reduce((sum, p) => sum + p.stock, 0);`;

content = content.replace(metricsTarget, metricsReplacement);

const purchaseTableTarget = `                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {purchases.map((pur) => (
                    <tr key={pur.id}>
                      <td className="p-3 font-mono font-bold text-slate-700">{pur.purchaseNo}</td>
                      <td className="p-3 text-slate-400">{new Date(pur.date).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-800">{pur.supplierName}</td>
                      <td className="p-3 text-right font-bold text-slate-800">৳{pur.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={\`px-2 py-0.5 rounded text-[8px] font-bold \${
                          pur.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }\`}>
                          {pur.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>`;

const purchaseTableReplacement = `                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredPurchases.map((pur) => (
                    <tr key={pur.id}>
                      <td className="p-3 font-mono font-bold text-slate-700">{pur.purchaseNo}</td>
                      <td className="p-3 text-slate-400">{new Date(pur.date).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-800">{pur.supplierName}</td>
                      <td className="p-3 text-right font-bold text-slate-800">৳{pur.total.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={\`px-2 py-0.5 rounded text-[8px] font-bold \${
                          pur.status === 'Received' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }\`}>
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
                </tbody>`;
content = content.replace(purchaseTableTarget, purchaseTableReplacement);

const supplierTableTarget = `                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {suppliers.map((sup) => {
                    const catalogCount = products.filter(p => p.supplierId === sup.id).length;
                    const sourcedCost = purchases
                      .filter(pur => pur.supplierId === sup.id)
                      .reduce((sum, pur) => sum + pur.total, 0);

                    return (
                      <tr key={sup.id}>
                        <td className="p-3 font-bold text-slate-800">{sup.company}</td>
                        <td className="p-3 font-medium text-slate-500">{sup.name}</td>
                        <td className="p-3">{catalogCount} distinct products</td>
                        <td className="p-3 text-right font-black text-slate-800">৳{sourcedCost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>`;

const supplierTableReplacement = `                <tbody className="divide-y divide-slate-50 text-slate-600">
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
                </tbody>`;
content = content.replace(supplierTableTarget, supplierTableReplacement);

const incomeTableTarget = `                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {incomes.map((inc) => (
                    <tr key={inc.id}>
                      <td className="p-3 text-slate-400">{new Date(inc.date).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-slate-800">{inc.category}</td>
                      <td className="p-3 text-slate-500">{inc.description}</td>
                      <td className="p-3 text-right font-black text-slate-800">৳{inc.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>`;

const incomeTableReplacement = `                <tbody className="divide-y divide-slate-50 text-slate-600">
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
                </tbody>`;
content = content.replace(incomeTableTarget, incomeTableReplacement);

content = content.replaceAll('{sales.map((sale) => (', '{filteredSales.map((sale) => (');
content = content.replaceAll('{purchases.length} Batches', '{filteredPurchases.length + purchaseAdjustments.length} Batches');
content = content.replaceAll('Total Cashier Invoices', 'Total Sales Invoices');
content = content.replaceAll('{sales.length}', '{filteredSales.length}');
content = content.replaceAll('(totalSalesSum / sales.length)', '(totalSalesSum / (filteredSales.length || 1))');
content = content.replaceAll('{expenses.map((exp) => (', '{filteredExpenses.map((exp) => (');
content = content.replaceAll('sales.forEach((s) => {', 'filteredSales.forEach((s) => {');

const headerTarget = `      {/* Header */}
      <div className="mobile-page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">{getReportLabel()}</h3>
          <span className="text-[10px] text-slate-400 block -mt-0.5">Corporate business statistics and audit dashboards</span>
        </div>

        {/* Action button */}
        <div className="flex items-center space-x-2 shrink-0">`;

const headerReplacement = `      {/* Header */}
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
          </div>`;
content = content.replace(headerTarget, headerReplacement);

const annualReportTarget = `        const totalCOGSVal = sales.reduce((sum, s) => sum + (s.costOfGoodsSold !== undefined ? s.costOfGoodsSold : s.items.reduce((iSum, item) => iSum + (item.cost || 0) * item.quantity, 0)), 0);
        const grossProfits = totalSalesSum - totalCOGSVal;
        const netProfits = grossProfits + totalIncomesSum - totalExpensesSum;`;
const annualReportReplacement = `        const totalCOGSVal = filteredSales.reduce((sum, s) => sum + (s.costOfGoodsSold !== undefined ? s.costOfGoodsSold : s.items.reduce((iSum, item) => iSum + (item.cost || 0) * item.quantity, 0)), 0);
        const grossProfits = totalSalesSum - totalCOGSVal;
        const netProfits = grossProfits + totalIncomesSum - totalExpensesSum;`;
content = content.replace(annualReportTarget, annualReportReplacement);

fs.writeFileSync('src/views/ReportsView.tsx', content);
