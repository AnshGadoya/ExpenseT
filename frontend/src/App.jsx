import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExpensesView from './components/ExpensesView';
import SalaryView from './components/SalaryView';
import DealsView from './components/DealsView';
import ServicesMaster from './components/ServicesMaster';
import CategoriesMaster from './components/CategoriesMaster';
import ReportsView from './components/ReportsView';
import { api } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Dark Mode Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Global modal triggers
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [selectedDealForPayment, setSelectedDealForPayment] = useState(null);
  const [selectedDealForRenewal, setSelectedDealForRenewal] = useState(null);

  const loadInitialData = async () => {
    try {
      const [servicesData, categoriesData, dealsData] = await Promise.all([
        api.getServices().catch(() => []),
        api.getCategories().catch(() => []),
        api.getDeals().catch(() => []),
      ]);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setDeals(Array.isArray(dealsData) ? dealsData : []);
    } catch (err) {
      console.error('Failed to load initial masters:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectDealForPayment = (deal) => {
    setSelectedDealForPayment(deal);
    setActiveTab('deals');
  };

  const handleRenewDeal = (deal) => {
    setSelectedDealForRenewal(deal);
    setActiveTab('deals');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Navigation Bar with Notification Bell & Dark Mode Toggle */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddExpense={() => {
          setActiveTab('expenses');
          setIsAddExpenseOpen(true);
        }}
        onOpenAddDeal={() => {
          setActiveTab('deals');
          setIsAddDealOpen(true);
        }}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        deals={deals}
        onRenewDeal={handleRenewDeal}
        onSelectDealForPayment={handleSelectDealForPayment}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {loadingInitial ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Gandhi Infosol Finance Suite...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onOpenAddExpense={() => {
                  setActiveTab('expenses');
                  setIsAddExpenseOpen(true);
                }}
                onOpenAddDeal={() => {
                  setActiveTab('deals');
                  setIsAddDealOpen(true);
                }}
                onSelectDealForPayment={handleSelectDealForPayment}
                setActiveTab={setActiveTab}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpensesView
                categories={categories}
                onRefreshCategories={loadInitialData}
                isAddOpen={isAddExpenseOpen}
                setIsAddOpen={setIsAddExpenseOpen}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'salary' && (
              <SalaryView
                darkMode={darkMode}
              />
            )}

            {activeTab === 'deals' && (
              <DealsView
                services={services}
                isAddOpen={isAddDealOpen}
                setIsAddOpen={setIsAddDealOpen}
                selectedDealForPayment={selectedDealForPayment}
                setSelectedDealForPayment={setSelectedDealForPayment}
                selectedDealForRenewal={selectedDealForRenewal}
                setSelectedDealForRenewal={setSelectedDealForRenewal}
                onRefreshDeals={loadInitialData}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'services' && (
              <ServicesMaster
                services={services}
                onRefreshServices={loadInitialData}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesMaster
                categories={categories}
                onRefreshCategories={loadInitialData}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView 
                darkMode={darkMode}
              />
            )}
          </>
        )}
      </main>

      {/* Modern Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} <strong className="text-slate-700 dark:text-slate-200">Gandhi Infosol</strong> • Digital Marketing & Business Expense Tracker</p>
        </div>
      </footer>

    </div>
  );
}
