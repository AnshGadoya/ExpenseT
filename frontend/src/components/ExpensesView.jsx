import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Tag, 
  User, 
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate, getTodayDateString, exportProfessionalFinancialWorkbook } from '../utils/formatters';
import Modal from './Modal';

export default function ExpensesView({ 
  categories, 
  onRefreshCategories, 
  isAddOpen, 
  setIsAddOpen,
  darkMode
}) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [editingExpense, setEditingExpense] = useState(null);
  const [isQuickAddCatOpen, setIsQuickAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  // Expense Form State
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    expense_date: getTodayDateString(),
    payment_mode: 'GPay',
    description: '',
    paid_to: '',
    receipt_no: '',
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedMode) params.payment_mode = selectedMode;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await api.getExpenses(params);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [search, selectedCategory, selectedMode, startDate, endDate]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    const validCats = Array.isArray(categories) ? categories : [];
    setFormData({
      category_id: validCats.length > 0 ? validCats[0].id : '',
      amount: '',
      expense_date: getTodayDateString(),
      payment_mode: 'GPay',
      description: '',
      paid_to: '',
      receipt_no: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setFormData({
      category_id: exp.category_id,
      amount: exp.amount,
      expense_date: exp.expense_date,
      payment_mode: exp.payment_mode,
      description: exp.description,
      paid_to: exp.paid_to || '',
      receipt_no: exp.receipt_no || '',
    });
    setIsAddOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.amount || !formData.expense_date || !formData.description) {
      alert('Please fill all required fields');
      return;
    }

    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense.id, formData);
      } else {
        await api.createExpense(formData);
      }
      setIsAddOpen(false);
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      loadExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await api.createCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'tag',
      });
      onRefreshCategories();
      setFormData(prev => ({ ...prev, category_id: created.id }));
      setIsQuickAddCatOpen(false);
      setNewCatName('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = async () => {
    try {
      const deals = await api.getDeals();
      exportProfessionalFinancialWorkbook({
        expenses,
        deals,
        periodName: 'Expenses & Business Deals Export',
        fileName: 'Gandhi_Infosol_Expenses_And_Deals'
      });
    } catch {
      exportProfessionalFinancialWorkbook({
        expenses,
        deals: [],
        periodName: 'Expenses Export',
        fileName: 'Gandhi_Infosol_Expenses'
      });
    }
  };

  const totalFilteredExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Daily Business Expenses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track day-to-day agency costs (Food, Travel, Salesman Pitch, Rent, Fuel, Party, Subscriptions, Crew)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Export Excel/CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-xs sm:text-sm font-bold transition-all shadow-sm shadow-rose-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Log Expense
          </button>
        </div>
      </div>

      {/* Filter & Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        
        {/* Top Filter Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Filtered Total Spending</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatCurrency(totalFilteredExpense)}</div>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Entries</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{expenses.length}</div>
            </div>
          </div>

          {(search || selectedCategory || selectedMode || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedMode('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 underline"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Filters Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search description, vendor, receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
            >
              <option value="">All Categories</option>
              {(Array.isArray(categories) ? categories : []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
            >
              <option value="">All Payment Modes</option>
              <option value="GPay">GPay</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Paytm">Paytm</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Date Picker Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From Date"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
            />
          </div>

        </div>

      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description / Nature</th>
                <th className="py-3.5 px-4">Paid To / Vendor</th>
                <th className="py-3.5 px-4">Payment Mode</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    Loading expenses...
                  </td>
                </tr>
              ) : (!Array.isArray(expenses) || expenses.length === 0) ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: `${exp.category_color}18`,
                          color: exp.category_color,
                          border: `1px solid ${exp.category_color}35`,
                        }}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: exp.category_color }} 
                        />
                        {exp.category_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-medium max-w-xs">
                      {exp.description}
                      {exp.receipt_no && (
                        <span className="block text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          Ref: #{exp.receipt_no}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                      {exp.paid_to || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {exp.payment_mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingExpense ? 'Edit Expense Record' : 'Log New Business Expense'}
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          
          {/* Amount and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Amount (₹) <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 2500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white font-black text-base focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expense Date <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Category Dropdown with quick add */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Expense Category <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsQuickAddCatOpen(true)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                + Add New Category
              </button>
            </div>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
            >
              <option value="" disabled>Select category (Food, Travel, Rent, Fuel, Party...)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Nature of Expense <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <textarea
              required
              rows="2"
              placeholder="e.g. Lunch for 4 crew members during Reel shoot at Goregaon..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Payment Mode & Paid To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
              >
                <option value="GPay">GPay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Paid To / Vendor / Person
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber, Studio Landlord"
                value={formData.paid_to}
                onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Receipt / Invoice Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Receipt / Bill Reference No. (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. INV-9024 or UPI-294829"
              value={formData.receipt_no}
              onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs sm:text-sm hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 transition-all shadow-sm shadow-rose-600/20"
            >
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>

        </form>
      </Modal>

      {/* Quick Add Category Modal */}
      <Modal
        isOpen={isQuickAddCatOpen}
        onClose={() => setIsQuickAddCatOpen(false)}
        title="Add New Expense Category"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Salesman Travel, Studio Equipment, Fuel..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Badge Color
            </label>
            <div className="flex items-center gap-2">
              {['#f97316', '#06b6d4', '#3b82f6', '#8b5cf6', '#eab308', '#ec4899', '#6366f1', '#10b981', '#14b8a6', '#f43f5e'].map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setNewCatColor(col)}
                  className={`w-6 h-6 rounded-full transition-transform ${newCatColor === col ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickAddCatOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/20"
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
