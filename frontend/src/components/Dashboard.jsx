import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid
} from 'recharts';
import { 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Clock, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus 
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';

const PRESET_COLORS = ['#3b82f6', '#f97316', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#eab308', '#6366f1', '#14b8a6', '#f43f5e', '#64748b'];

export default function Dashboard({ 
  onOpenAddExpense, 
  onOpenAddDeal, 
  onSelectDealForPayment,
  setActiveTab,
  darkMode
}) {
  const [timeRange, setTimeRange] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    const toISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (timeRange === 'today') {
      startDate = toISO(now);
      endDate = toISO(now);
    } else if (timeRange === 'this_week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate = toISO(firstDay);
      endDate = toISO(new Date());
    } else if (timeRange === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = toISO(firstDay);
      endDate = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (timeRange === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = toISO(firstDay);
      endDate = toISO(lastDay);
    } else if (timeRange === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      startDate = toISO(firstDay);
      endDate = toISO(new Date(now.getFullYear(), 11, 31));
    } else if (timeRange === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    }

    return { startDate, endDate, range: timeRange };
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const params = getDateRangeParams();
      const data = await api.getAnalyticsSummary(params);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [timeRange, customStartDate, customEndDate]);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-lg">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5" style={{ color: entry.color }}>
              <span className="font-semibold">{entry.name}:</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Filters & Range Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/80">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Financial Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track profits, pending client balances & category expenses</p>
          </div>
        </div>

        {/* Preset Selectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'all_time', label: 'All Time' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTimeRange(preset.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                timeRange === preset.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <button
            onClick={loadSummary}
            title="Refresh Data"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Inputs if 'custom' is active */}
      {timeRange === 'custom' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex flex-wrap items-center gap-4 border border-indigo-200 dark:border-indigo-800 shadow-2xs transition-colors">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Collected Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Collected Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/80">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary?.totalRevenue || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Actual Received</span> from client deals
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/80">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-rose-700 dark:text-rose-400 font-bold">Food, Travel, Rent, Fuel, Crew</span> & bills
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Net Profit & Margin</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/80">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
            (summary?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(summary?.netProfit || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
              (summary?.netProfit || 0) >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
            }`}>
              {summary?.profitMargin || 0}% margin
            </span>
            <span>Revenue minus Expenses</span>
          </p>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Receivables</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/80">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(summary?.totalReceivables || 0)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>To collect from clients</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold">{summary?.pendingDealsCount || 0} active deals</span>
          </p>
        </div>

      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expenses Monthly Trends */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs lg:col-span-2 flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Income vs Expense Monthly Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly breakdown of revenue collected vs operational expenditure</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {summary?.monthlyTrends && summary.monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis dataKey="month" stroke={darkMode ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
                  <YAxis stroke={darkMode ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Revenue Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Business Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No trend data available for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* Expense Bifurcation by Category */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-rose-500" />
                Expense Bifurcation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Category-wise operational spending</p>
            </div>
          </div>

          <div className="h-56 w-full relative">
            {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown}
                    dataKey="total_amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {summary.categoryBreakdown.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || PRESET_COLORS[index % PRESET_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [formatCurrency(val), 'Spent']}
                    contentStyle={{ 
                      background: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0', 
                      color: darkMode ? '#ffffff' : '#0f172a',
                      borderRadius: '10px', 
                      fontSize: '12px', 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No expense records in this timeframe
              </div>
            )}
          </div>

          {/* Category Top Spends List */}
          <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
            {summary?.categoryBreakdown?.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[130px]">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cat.total_amount)}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5 font-medium">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Row: Revenue by Service & Pending Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Clients with Pending Amount */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Client Receivables Watchlist
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Clients with pending payment balances to be collected</p>
            </div>
            <button
              onClick={() => setActiveTab('deals')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              View All Deals <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary?.topPendingClients && summary.topPendingClients.length > 0 ? (
              summary.topPendingClients.map((client) => (
                <div 
                  key={client.id}
                  className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3 border border-slate-200/80 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-600 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{client.client_name}</span>
                      {client.company_name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">({client.company_name})</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>Total Deal: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(client.total_deal_amount)}</strong></span>
                      <span>Paid: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(client.received_amount)}</strong></span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(client.pending_amount)}
                    </div>
                    <button
                      onClick={() => onSelectDealForPayment(client)}
                      className="mt-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800/80 transition-colors"
                    >
                      + Record Payment
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                🎉 No pending payments from any client.
              </div>
            )}
          </div>
        </div>

        {/* Digital Marketing Service Revenue Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Revenue by Digital Service
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Which digital offerings generate the highest agency volume</p>
            </div>
            <button
              onClick={() => setActiveTab('services')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
            >
              Manage Services <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {summary?.serviceStats && summary.serviceStats.length > 0 ? (
              summary.serviceStats.slice(0, 5).map((serv) => (
                <div key={serv.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{serv.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{serv.deal_count} deals</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(serv.estimated_revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(10, (serv.estimated_revenue / (summary.totalDealVolume || 1)) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                No service revenue logged yet
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Ledger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Recent Financial Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest client payments received and business expenses logged</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
            summary.recentTransactions.map((tx, idx) => {
              const isIncome = tx.type === 'income';
              return (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isIncome 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/80' 
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/80'
                    }`}>
                      {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{tx.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{tx.subtitle}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {tx.payment_mode}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className={`text-base font-black tracking-tight shrink-0 ${
                    isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
              No transactions recorded yet. Use the top buttons to log an expense or client deal.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
