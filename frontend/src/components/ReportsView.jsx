import React, { useState, useEffect, useMemo } from 'react';
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
  ArrowRight,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Sparkles
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

  // Reset scroll position on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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
    if (Array.isArray(summary?.categoryBreakdown)) {
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

  const validExpenses = Array.isArray(expenses) ? expenses : [];
  const filteredExpensesList = activeCategoryFilter === 'all' 
    ? validExpenses 
    : validExpenses.filter(e => String(e.category_id) === String(activeCategoryFilter) || e.category_name === activeCategoryFilter);

  const profitMarginVal = Number(summary?.profitMargin || 0);
  const isProfitable = (summary?.netProfit || 0) >= 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 print:p-0 print:m-0">
      
      {/* Controls Bar (hidden in print) */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 print:hidden transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Monthly P&L & Expense Statement
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                P&L LEDGER
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Generate category-wise drilldowns, print statements, and export financial workbooks
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none w-full cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Print</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportFullReport}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>

        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 border border-slate-200/80 dark:border-slate-800 shadow-2xs print:bg-white print:text-black print:p-6 print:rounded-none print:border-none print:shadow-none transition-colors">
        
        {/* Statement Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800 print:border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 print:text-indigo-600 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white print:text-black">
                GANDHI INFOSOL
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-500">Digital Marketing & Media Solutions</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 print:text-slate-400 mt-0.5 font-medium">Official Financial, P&L & Category Expense Ledger</p>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 print:bg-indigo-50 print:text-indigo-700 whitespace-nowrap">
              STATEMENT PERIOD
            </span>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white print:text-black mt-1">
              {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* High-Level P&L Summary Cards (2x2 on Mobile, 4-col on Desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* Revenue Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 print:bg-slate-50 print:border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white print:text-black mt-0.5">
                {formatCurrency(summary?.totalRevenue || 0)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                Client collections
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Expenses Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 print:bg-slate-50 print:border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Total Expenses
              </span>
              <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white print:text-black mt-0.5">
                {formatCurrency(summary?.totalExpenses || 0)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                All categories
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 print:bg-slate-50 print:border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Net Profit
              </span>
              <div className={`text-lg sm:text-2xl font-black mt-0.5 ${
                isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatCurrency(summary?.netProfit || 0)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                Period balance
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Profit Margin Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 print:bg-slate-50 print:border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                Profit Margin
              </span>
              <div className={`text-lg sm:text-2xl font-black mt-0.5 ${
                profitMarginVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {summary?.profitMargin || 0}%
              </div>
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold line-clamp-1">
                Net margin yield
              </span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* SECTION 1: CATEGORY EXPENSE SUMMARY & INTERACTIVE DRILL-DOWN */}
        {/* ========================================================= */}
        <div className="space-y-3.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Category-wise Operational Expenditures
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 print:hidden">
                Tap category to expand and view individual itemized bills
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={expandAllCategories}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllCategories}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Expandable Category Accordion Cards */}
          <div className="space-y-2.5 sm:space-y-3">
            {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
              summary.categoryBreakdown.map((cat) => {
                const isExpanded = Boolean(expandedCategories[cat.id]);
                const catExpenses = expenses.filter(e => Number(e.category_id) === Number(cat.id));

                return (
                  <div 
                    key={cat.id}
                    className="border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Category Header Row (Clickable) */}
                    <div
                      onClick={() => toggleCategoryExpand(cat.id)}
                      className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/80 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between gap-2.5 sm:gap-4 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <button className="text-slate-500 dark:text-slate-400 print:hidden shrink-0">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#e11d48' }}
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                            {cat.name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block sm:inline">
                            {cat.count} {cat.count === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:gap-4 text-right shrink-0">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 block sm:inline">
                            {formatCurrency(cat.total_amount)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold sm:ml-2">
                            ({cat.percentage}%)
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline print:hidden hidden sm:inline">
                          {isExpanded ? 'Hide Logs' : 'View Logs'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Sub-items */}
                    {(isExpanded || window.matchMedia?.('print')?.matches) && (
                      <div className="p-2 sm:p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        {catExpenses.length > 0 ? (
                          <>
                            {/* Mobile Card View (< 640px) */}
                            <div className="space-y-2 block sm:hidden">
                              {catExpenses.map((exp) => (
                                <div 
                                  key={exp.id}
                                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
                                    <span>{formatDate(exp.expense_date)}</span>
                                    <span className="font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                                      {exp.payment_mode}
                                    </span>
                                  </div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                                    {exp.description}
                                    {exp.receipt_no && (
                                      <span className="text-[10px] text-slate-400 font-mono ml-1 font-normal">
                                        (#{exp.receipt_no})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                      {exp.paid_to ? `Vendor: ${exp.paid_to}` : 'No vendor'}
                                    </span>
                                    <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                                      {formatCurrency(exp.amount)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Desktop & Print Table View (>= 640px) */}
                            <div className="overflow-x-auto hidden sm:block">
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
                          </>
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
        <div className="space-y-3.5 sm:space-y-4 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                All Operational Expense Logs for Period
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Filter and view individual transaction records</p>
            </div>

            {/* Category Filter Pills (hidden in print, smooth horizontal swipe) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 print:hidden">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  activeCategoryFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Categories ({expenses.length})
              </button>

              {summary?.categoryBreakdown?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    String(activeCategoryFilter) === String(cat.id)
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Card Feed (< 640px) */}
          <div className="space-y-2.5 block sm:hidden">
            {filteredExpensesList && filteredExpensesList.length > 0 ? (
              filteredExpensesList.map((exp) => (
                <div 
                  key={exp.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
                      {formatDate(exp.expense_date)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: `${exp.category_color}18`,
                        color: exp.category_color,
                        border: `1px solid ${exp.category_color}35`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: exp.category_color }} />
                      {exp.category_name}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {exp.description}
                    {exp.receipt_no && (
                      <span className="text-[10px] text-slate-400 font-mono ml-1 font-normal">
                        (Ref: #{exp.receipt_no})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <span>{exp.paid_to || 'General'}</span>
                      <span>•</span>
                      <span className="font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                        {exp.payment_mode}
                      </span>
                    </div>
                    <span className="font-black text-rose-600 dark:text-rose-400 text-xs">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs border border-slate-200 dark:border-slate-800 rounded-xl">
                No expense records found for this filter.
              </div>
            )}
          </div>

          {/* Desktop & Print Table View (>= 640px) */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl hidden sm:block">
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
        <div className="space-y-3 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Client Deals & Collections Ledger
          </h3>

          {/* Mobile Deals Cards (< 640px) */}
          <div className="space-y-2.5 block sm:hidden">
            {deals && deals.length > 0 ? (
              deals.map((deal) => (
                <div 
                  key={deal.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs block">
                        {deal.client_name}
                      </span>
                      {deal.company_name && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {deal.company_name}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      deal.pending_amount <= 0 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    }`}>
                      {deal.pending_amount <= 0 ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Deal</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{formatCurrency(deal.total_deal_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-600 uppercase font-bold block">Received</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(deal.received_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-600 uppercase font-bold block">Pending</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">{formatCurrency(deal.pending_amount)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Deal Date: {formatDate(deal.deal_date)}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs border border-slate-200 dark:border-slate-800 rounded-xl">
                No client deals logged for this month.
              </div>
            )}
          </div>

          {/* Desktop & Print Table View (>= 640px) */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl hidden sm:block">
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
        <div className="pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 sm:gap-4">
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

