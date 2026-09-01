import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Handshake,
  Sparkles,
  Tags,
  FileSpreadsheet,
  PlusCircle,
  Wallet,
  Building2,
  Sun,
  Moon,
  Users
} from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import GlobalSearch from './GlobalSearch';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenAddExpense,
  onOpenAddDeal,
  darkMode,
  onToggleDarkMode,
  deals = [],
  onRenewDeal,
  onSelectDealForPayment
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Daily Expenses', icon: Receipt },
    { id: 'salary', label: 'Team & Salary', icon: Users },
    { id: 'deals', label: 'Client Deals & Receivables', icon: Handshake },
    { id: 'services', label: 'Services Master', icon: Sparkles },
    { id: 'categories', label: 'Expense Categories', icon: Tags },
    { id: 'reports', label: 'P&L Reports', icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl overflow-hidden shadow-md shadow-cyan-600/20 border border-slate-200 dark:border-slate-800 bg-white shrink-0">
              <img src="/logo.png" alt="Gandhi Infosol Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  GANDHI <span className="text-indigo-600 dark:text-indigo-400">INFOSOL</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full">
                  FINANCE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital Marketing & Expense Tracker</p>
            </div>
          </div>

          {/* Right Action Controls: Bell Notifications, Dark Mode Toggle & Quick Add */}
          <div className="flex items-center gap-2.5">

            {/* Global Search Spotlight */}
            <GlobalSearch
              onNavigate={(tab) => setActiveTab(tab)}
              darkMode={darkMode}
            />
            {/* Notification Bell Dropdown */}
            <NotificationsDropdown
              deals={deals}
              onRenewDeal={onRenewDeal}
              onSelectDealForPayment={onSelectDealForPayment}
              darkMode={darkMode}
            />

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs active:scale-95 flex items-center justify-center"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-200" />
              )}
            </button>

            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-2xs active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>+ Log Expense</span>
            </button>

            <button
              onClick={onOpenAddDeal}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>+ New Client Deal</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 dark:border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/70 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
