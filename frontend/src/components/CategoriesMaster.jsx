import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tags, Plus, Edit3, Trash2, Layers, Search, X, 
  Palette, Check, Sparkles, FolderPlus, Tag, ShieldCheck
} from 'lucide-react';
import { api } from '../utils/api';
import Modal from './Modal';

export default function CategoriesMaster({ categories = [], onRefreshCategories, darkMode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    color: '#e11d48',
    icon: 'tag',
  });

  const PRESET_COLORS = [
    '#e11d48', '#f97316', '#eab308', '#10b981', '#06b6d4', 
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', 
    '#64748b', '#84cc16', '#0284c7', '#d97706', '#be185d'
  ];

  // Reset scroll position on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      color: '#e11d48',
      icon: 'tag',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      color: cat.color || '#e11d48',
      icon: cat.icon || 'tag',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
      } else {
        await api.createCategory(formData);
      }
      setIsModalOpen(false);
      onRefreshCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Associated expenses might lose their category link.')) return;
    try {
      await api.deleteCategory(id);
      onRefreshCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || cat.name?.toLowerCase().includes(q);
      const matchColor = selectedColorFilter === 'all' || cat.color?.toLowerCase() === selectedColorFilter.toLowerCase();
      return matchSearch && matchColor;
    });
  }, [categories, searchQuery, selectedColorFilter]);

  // Distinct palette colors used
  const usedColors = useMemo(() => {
    return Array.from(new Set(categories.map(c => c.color).filter(Boolean)));
  }, [categories]);

  // Metrics
  const totalCount = categories.length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
            <Tags className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Expense Categories Master
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                COST HEADS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Categorize operational spending (Food, Travel, Rent, Fuel, Production, Party...)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Category</span>
        </button>
      </div>

      {/* KPI Overview Grid (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Categories */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Categories
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalCount}
            </h3>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
              Active ledger buckets
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Tags className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Color Palettes */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Theme Colors
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 mt-0.5">
              {usedColors.length}
            </h3>
            <span className="text-[10px] text-violet-700 dark:text-violet-400 font-semibold">
              Distinct color cues
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-50 dark:bg-violet-950/70 border border-violet-100 dark:border-violet-800/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
            <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Tag Classification */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Bifurcation
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              100%
            </h3>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
              Linked to expense log
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Master Status */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Status
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              Active
            </h3>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Ready for expenses
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search category name (e.g. Travel, Rent, Food)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Swatch Quick Filters */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setSelectedColorFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedColorFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Colors ({totalCount})
            </button>
            
            {usedColors.map((color) => {
              const isSelected = selectedColorFilter.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  onClick={() => setSelectedColorFilter(isSelected ? 'all' : color)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                    isSelected ? 'ring-2 ring-slate-900 dark:ring-white scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Filter by ${color}`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* Categories Grid or Empty State */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Tags className="w-7 h-7 opacity-70" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            No matching expense categories found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedColorFilter !== 'all'
              ? 'Try changing your search keywords or resetting the color filter.'
              : 'No categories created yet. Click "+ Add New Category" above to get started.'}
          </p>
          {(searchQuery || selectedColorFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedColorFilter('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredCategories.map((cat) => {
            const catColor = cat.color || '#e11d48';
            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Top Subtle Color Accent Line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 transition-all opacity-80 group-hover:opacity-100"
                  style={{ backgroundColor: catColor }}
                />

                <div className="space-y-3">
                  
                  {/* Icon & Action Buttons Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
                      style={{ 
                        backgroundColor: `${catColor}18`, 
                        color: catColor,
                        border: `1px solid ${catColor}30` 
                      }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>

                    {/* Touch-Friendly Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Category Name */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {cat.name}
                    </h3>
                  </div>

                </div>

                {/* Live Badge Preview in Expenses */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Receipt Tag
                  </span>
                  
                  <span 
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold truncate max-w-[170px]"
                    style={{ 
                      backgroundColor: `${catColor}15`, 
                      color: catColor,
                      border: `1px solid ${catColor}35`
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Expense Category' : 'Create New Expense Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Salesman Travel, Office Rent, Fuel, Party"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Color Palette Theme
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {PRESET_COLORS.map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setFormData({ ...formData, color: col })}
                  className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    formData.color.toLowerCase() === col.toLowerCase()
                      ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow-sm'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {formData.color.toLowerCase() === col.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow-xs" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Live Badge Preview inside Modal */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Live Badge Preview (How it appears in Daily Expenses)
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ 
                  backgroundColor: `${formData.color}18`, 
                  color: formData.color,
                  border: `1px solid ${formData.color}40`
                }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: formData.color }} />
                <span>{formData.name.trim() || 'Category Name'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs sm:text-sm hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
            >
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

