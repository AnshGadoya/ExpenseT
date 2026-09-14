import React, { useState } from 'react';
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
  Users,
  LogOut,
  UserCheck,
  Menu,
  X
} from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">

          {/* Brand & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl overflow-hidden shadow-md shadow-cyan-600/20 border border-slate-200 dark:border-slate-800 bg-white shrink-0">
              <img src="/logo.png" alt="Gandhi Infosol Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg lg:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  GANDHI <span className="text-indigo-600 dark:text-indigo-400">INFOSOL</span>
                </span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-[9px] sm:text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full shrink-0">
                  FINANCE
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Digital Marketing & Expense Tracker</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Global Search Spotlight */}
            <GlobalSearch
              onNavigate={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
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
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs active:scale-95 flex items-center justify-center shrink-0"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-200" />
              )}
            </button>

            {/* Desktop User Profile Badge & Logout */}
            {user && (
              <div className="hidden lg:flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div className="flex flex-col text-right px-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight capitalize max-w-[110px] truncate">
                    {user.name || user.username}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">
                    ● Logged in
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-2xs active:scale-95 flex items-center justify-center shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Action: Log Expense (Desktop) */}
            <button
              onClick={onOpenAddExpense}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-2xs active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="hidden xl:inline">+ Log Expense</span>
            </button>

            {/* Quick Action: New Deal */}
            <button
              onClick={onOpenAddDeal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 shrink-0"
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">+ Deal</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="flex md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-1.5 sm:py-2 border-t border-slate-100 dark:border-slate-800/80 scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/70 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Expanded Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-3 px-1 space-y-3 animate-in slide-in-from-top-2 duration-150">
            
            {/* Quick Action Buttons in Mobile Drawer */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenAddExpense();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-bold text-xs shadow-2xs active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>+ Log Expense</span>
              </button>

              <button
                onClick={() => {
                  onOpenAddDeal();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm active:scale-95 hover:bg-indigo-700 transition-all"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>+ Client Deal</span>
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 mb-1">
                Navigation
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                  </button>
                );
              })}
            </div>

            {/* User Profile & Logout in Mobile Menu */}
            {user && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs uppercase">
                    {(user.name || user.username).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {user.name || user.username}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-none">
                      ● Active
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}

