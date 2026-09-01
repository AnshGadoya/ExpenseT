import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Receipt,
  Handshake,
  Sparkles,
  Tags,
  ArrowRight,
  Command,
  Clock,
  IndianRupee,
  User,
  Building2,
  Phone,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function GlobalSearch({ onNavigate, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ expenses: [], deals: [], services: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults({ expenses: [], deals: [], services: [], categories: [] });
    setSelectedIndex(0);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ expenses: [], deals: [], services: [], categories: [] });
      setSelectedIndex(0);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [expenses, deals, services, categories] = await Promise.all([
          api.getExpenses(),
          api.getDeals(),
          api.getServices(),
          api.getCategories(),
        ]);

        const q = query.toLowerCase();

        const filteredExpenses = expenses.filter(e =>
          (e.description && e.description.toLowerCase().includes(q)) ||
          (e.category_name && e.category_name.toLowerCase().includes(q)) ||
          (e.paid_to && e.paid_to.toLowerCase().includes(q)) ||
          (e.payment_mode && e.payment_mode.toLowerCase().includes(q)) ||
          (e.amount && String(e.amount).includes(q))
        ).slice(0, 5);

        const filteredDeals = deals.filter(d =>
          (d.client_name && d.client_name.toLowerCase().includes(q)) ||
          (d.company_name && d.company_name.toLowerCase().includes(q)) ||
          (d.client_phone && d.client_phone.includes(q)) ||
          (d.client_email && d.client_email.toLowerCase().includes(q)) ||
          (d.insta_id && d.insta_id.toLowerCase().includes(q)) ||
          (d.notes && d.notes.toLowerCase().includes(q)) ||
          (d.total_deal_amount && String(d.total_deal_amount).includes(q))
        ).slice(0, 5);

        const filteredServices = services.filter(s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.base_price && String(s.base_price).includes(q))
        ).slice(0, 4);

        const filteredCategories = categories.filter(c =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q))
        ).slice(0, 4);

        setResults({
          expenses: filteredExpenses,
          deals: filteredDeals,
          services: filteredServices,
          categories: filteredCategories,
        });
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Flatten results for keyboard navigation
  const allResults = [
    ...results.deals.map(d => ({ type: 'deal', data: d })),
    ...results.expenses.map(e => ({ type: 'expense', data: e })),
    ...results.services.map(s => ({ type: 'service', data: s })),
    ...results.categories.map(c => ({ type: 'category', data: c })),
  ];

  const totalCount = allResults.length;
  const hasResults = totalCount > 0;

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, totalCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && hasResults) {
      e.preventDefault();
      const item = allResults[selectedIndex];
      if (item) handleResultClick(item);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const selected = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleResultClick = (item) => {
    if (item.type === 'deal') {
      onNavigate('deals');
    } else if (item.type === 'expense') {
      onNavigate('expenses');
    } else if (item.type === 'service') {
      onNavigate('services');
    } else if (item.type === 'category') {
      onNavigate('categories');
    }
    handleClose();
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      completed: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      lost: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      pending: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
    return styles[status] || styles.active;
  };

  // Track the running index across sections
  let runningIndex = 0;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Global Search (⌘K)"
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all text-xs font-medium shadow-2xs active:scale-95 group"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 group-hover:border-slate-400 dark:group-hover:border-slate-500">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] px-4">
        <div
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <Search className={`w-5 h-5 flex-shrink-0 ${loading ? 'text-indigo-500 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search clients, expenses, services, categories..."
              className="flex-1 bg-transparent text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Search Results */}
          <div
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto overscroll-contain"
          >
            {/* Empty / Idle State */}
            {!query.trim() && (
              <div className="px-5 py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Quick Search</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Type to search across clients, expenses, services & categories</p>
              </div>
            )}

            {/* No Results */}
            {query.trim() && !loading && !hasResults && (
              <div className="px-5 py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No results found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try different keywords or check your spelling</p>
              </div>
            )}

            {/* Results Sections */}
            {hasResults && (
              <div className="py-2">

                {/* Client Deals */}
                {results.deals.length > 0 && (
                  <div className="mb-1">
                    <div className="px-5 py-2 flex items-center gap-2">
                      <Handshake className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Client Deals
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {results.deals.length}
                      </span>
                    </div>
                    {results.deals.map((deal) => {
                      const idx = runningIndex++;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={`deal-${deal.id}`}
                          data-index={idx}
                          onClick={() => handleResultClick({ type: 'deal', data: deal })}
                          className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isSelected 
                              ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {deal.client_name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{deal.client_name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadge(deal.status)}`}>
                                {deal.status === 'completed' ? 'Paid' : deal.status === 'lost' ? 'Lost' : deal.pending_amount > 0 ? 'Pending' : 'Active'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {deal.company_name && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> {deal.company_name}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" /> {formatCurrency(deal.total_deal_amount)}
                              </span>
                              {deal.client_phone && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {deal.client_phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Expenses */}
                {results.expenses.length > 0 && (
                  <div className="mb-1">
                    <div className="px-5 py-2 flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Expenses
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                        {results.expenses.length}
                      </span>
                    </div>
                    {results.expenses.map((exp) => {
                      const idx = runningIndex++;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={`exp-${exp.id}`}
                          data-index={idx}
                          onClick={() => handleResultClick({ type: 'expense', data: exp })}
                          className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <TrendingDown className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                {exp.description || 'Expense'}
                              </span>
                              {exp.category_name && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {exp.category_name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" /> {formatCurrency(exp.amount)}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatDate(exp.expense_date)}
                              </span>
                              {exp.payment_mode && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" /> {exp.payment_mode}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-rose-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Services */}
                {results.services.length > 0 && (
                  <div className="mb-1">
                    <div className="px-5 py-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Services
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                        {results.services.length}
                      </span>
                    </div>
                    {results.services.map((svc) => {
                      const idx = runningIndex++;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={`svc-${svc.id}`}
                          data-index={idx}
                          onClick={() => handleResultClick({ type: 'service', data: svc })}
                          className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-violet-50 dark:bg-violet-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <Sparkles className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white truncate block">{svc.name}</span>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" /> {formatCurrency(svc.base_price)}
                              </span>
                              {svc.description && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{svc.description}</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-violet-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Categories */}
                {results.categories.length > 0 && (
                  <div className="mb-1">
                    <div className="px-5 py-2 flex items-center gap-2">
                      <Tags className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Categories
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        {results.categories.length}
                      </span>
                    </div>
                    {results.categories.map((cat) => {
                      const idx = runningIndex++;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={`cat-${cat.id}`}
                          data-index={idx}
                          onClick={() => handleResultClick({ type: 'category', data: cat })}
                          className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-amber-50 dark:bg-amber-950/40'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <Tags className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-800 dark:text-white truncate block">{cat.name}</span>
                            {cat.description && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">{cat.description}</span>
                            )}
                          </div>
                          <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700">↵</kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold border border-slate-200 dark:border-slate-700">ESC</kbd>
                Close
              </span>
            </div>
            {hasResults && (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {totalCount} result{totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
