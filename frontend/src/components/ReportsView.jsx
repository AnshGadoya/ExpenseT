import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Building2,
  ChevronDown,
  ChevronRight,
  Filter,
  Receipt,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate, exportProfessionalFinancialWorkbook } from '../utils/formatters';

export default function ReportsView({ darkMode }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category drill-down state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState({});

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const [sumData, expData, dealData] = await Promise.all([
        api.getAnalyticsSummary({ startDate, endDate }),
        api.getExpenses({ start_date: startDate, end_date: endDate }),
        api.getDeals({ start_date: startDate, end_date: endDate }),
      ]);

      setSummary(sumData);
      setExpenses(expData);
      setDeals(dealData);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedMonth]);

  const toggleCategoryExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const expandAllCategories = () => {
    if (summary?.categoryBreakdown) {
      const allExpanded = {};
      summary.categoryBreakdown.forEach(c => {
        allExpanded[c.id] = true;
      });
      setExpandedCategories(allExpanded);
    }
  };

  const collapseAllCategories = () => {
    setExpandedCategories({});
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportFullReport = () => {
    const periodName = new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    exportProfessionalFinancialWorkbook({
      summary,
      expenses,
      deals,
      periodName,
      fileName: `Gandhi_Infosol_Financial_Report_${selectedMonth}`
    });
  };

  const filteredExpensesList = activeCategoryFilter === 'all' 
    ? expenses 
    : expenses.filter(e => String(e.category_id) === String(activeCategoryFilter) || e.category_name === activeCategoryFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0">
      
      {/* Controls Bar (hidden in print) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden transition-colors">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Monthly P&L & Category Expense Statement
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Generate, drill-down into category logs, print, and export statements for Gandhi Infosol</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Print Statement
          </button>

          <button
            onClick={handleExportFullReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            Export Multi-Sheet Excel
          </button>
        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 space-y-8 border border-slate-200 dark:border-slate-800 shadow-2xs print:bg-white print:text-black print:p-6 print:rounded-none print:border-none print:shadow-none transition-colors">
        
        {/* Statement Header */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 print:text-indigo-600" />
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                GANDHI INFOSOL
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-500">Digital Marketing & Media Solutions</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 print:text-slate-400 mt-1 font-medium">Official Financial, P&L & Category Expense Ledger</p>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 print:bg-indigo-50 print:text-indigo-700">
              STATEMENT PERIOD
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white print:text-black mt-1.5">
              {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* High-Level P&L Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 print:bg-slate-50 print:border-slate-200">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              1. Total Revenue Collected
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white print:text-black mt-1">
              {formatCurrency(summary?.totalRevenue || 0)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">From client deal payments</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 print:bg-slate-50 print:border-slate-200">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              2. Total Operational Expenses
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white print:text-black mt-1">
              {formatCurrency(summary?.totalExpenses || 0)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Across all categories</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 print:bg-slate-50 print:border-slate-200">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              3. Net Profit for Period
            </span>
            <div className={`text-2xl font-black mt-1 ${
              (summary?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(summary?.netProfit || 0)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {summary?.profitMargin || 0}% Net Profit Margin
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: CATEGORY EXPENSE SUMMARY & INTERACTIVE DRILL-DOWN */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Category-wise Operational Expenditures (With Entry Breakdown)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 print:hidden">
                Click on any category row to expand and view the exact bill items and description
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={expandAllCategories}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllCategories}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Expandable Category Accordion Cards */}
          <div className="space-y-3">
            {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
              summary.categoryBreakdown.map((cat) => {
                const isExpanded = Boolean(expandedCategories[cat.id]);
                const catExpenses = expenses.filter(e => Number(e.category_id) === Number(cat.id));

                return (
                  <div 
                    key={cat.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Category Header Row (Clickable) */}
                    <div
                      onClick={() => toggleCategoryExpand(cat.id)}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between gap-4 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-slate-500 dark:text-slate-400 print:hidden">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#3b82f6' }}
                        />
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{cat.name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">({cat.count} entries)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400">{formatCurrency(cat.total_amount)}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold ml-2">({cat.percentage}%)</span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline print:hidden">
                          {isExpanded ? 'Hide Logs' : 'View Logs'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Sub-table of Individual Expenses */}
                    {(isExpanded || window.matchMedia?.('print')?.matches) && (
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        {catExpenses.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                  <th className="py-2 px-3">Date</th>
                                  <th className="py-2 px-3">Description / Nature</th>
                                  <th className="py-2 px-3">Paid To / Vendor</th>
                                  <th className="py-2 px-3">Mode</th>
                                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                                {catExpenses.map((exp) => (
                                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {formatDate(exp.expense_date)}
                                    </td>
                                    <td className="py-2 px-3 font-medium text-slate-900 dark:text-white max-w-xs">
                                      {exp.description}
                                      {exp.receipt_no && (
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-1.5">
                                          (Ref: #{exp.receipt_no})
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                      {exp.paid_to || '-'}
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                                        {exp.payment_mode}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                      {formatCurrency(exp.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="py-2 text-center text-slate-400 dark:text-slate-500 text-xs">
                            No individual entries found for this category.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 font-medium border border-slate-200 dark:border-slate-800 rounded-xl">
                No expenses logged for this month.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: ITEMIZED LOGS WITH FILTER PER CATEGORY */}
        {/* ========================================================= */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                All Operational Expense Logs for Period
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Filter and view individual transaction records</p>
            </div>

            {/* Category Filter Pills (hidden in print) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 print:hidden">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                  activeCategoryFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Categories ({expenses.length})
              </button>

              {summary?.categoryBreakdown?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    String(activeCategoryFilter) === String(cat.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description / Purpose</th>
                  <th className="py-2.5 px-4">Paid To / Vendor</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredExpensesList && filteredExpensesList.length > 0 ? (
                  filteredExpensesList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{
                            backgroundColor: `${exp.category_color}18`,
                            color: exp.category_color,
                            border: `1px solid ${exp.category_color}35`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: exp.category_color }} />
                          {exp.category_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white max-w-sm">
                        {exp.description}
                        {exp.receipt_no && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-1.5">
                            Ref: #{exp.receipt_no}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{exp.paid_to || '-'}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                          {exp.payment_mode}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No expense records found for the selected category filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: CLIENT DEALS CLOSED IN MONTH */}
        {/* ========================================================= */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Client Deals & Collections Ledger
          </h3>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Client / Brand</th>
                  <th className="py-2.5 px-4 text-right">Deal Value</th>
                  <th className="py-2.5 px-4 text-right">Received</th>
                  <th className="py-2.5 px-4 text-right">Pending</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {deals && deals.length > 0 ? (
                  deals.map((deal) => (
                    <tr key={deal.id}>
                      <td className="py-2 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">{formatDate(deal.deal_date)}</td>
                      <td className="py-2 px-4 font-bold text-slate-900 dark:text-white">
                        {deal.client_name}
                        {deal.company_name && <span className="text-slate-500 dark:text-slate-400 font-normal"> ({deal.company_name})</span>}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(deal.total_deal_amount)}</td>
                      <td className="py-2 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(deal.received_amount)}</td>
                      <td className="py-2 px-4 text-right font-bold text-amber-600 dark:text-amber-400">{formatCurrency(deal.pending_amount)}</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          deal.pending_amount <= 0 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {deal.pending_amount <= 0 ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-400 dark:text-slate-500 font-medium">
                      No client deals logged for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statement Footer */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div>
            <span>Generated automatically on {new Date().toLocaleString('en-IN')}</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-700 dark:text-slate-300">Gandhi Infosol Finance Administration</span>
          </div>
        </div>

      </div>

    </div>
  );
}
