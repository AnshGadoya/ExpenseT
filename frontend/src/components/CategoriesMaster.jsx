import React, { useState } from 'react';
import { Tags, Plus, Edit3, Trash2, Layers } from 'lucide-react';
import { api } from '../utils/api';
import Modal from './Modal';

export default function CategoriesMaster({ categories, onRefreshCategories, darkMode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    icon: 'tag',
  });

  const PRESET_COLORS = [
    '#3b82f6', '#f97316', '#10b981', '#ec4899', '#8b5cf6', 
    '#06b6d4', '#eab308', '#6366f1', '#14b8a6', '#f43f5e', 
    '#64748b', '#84cc16'
  ];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      color: '#3b82f6',
      icon: 'tag',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      color: cat.color || '#3b82f6',
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
    if (!window.confirm('Are you sure you want to delete this category? Associated expenses might lose category link.')) return;
    try {
      await api.deleteCategory(id);
      onRefreshCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tags className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            Expense Categories Master
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Categorize operational costs to view bifurcation (Food, Travel, Salesman Travel, Rent, Fuel, Party...)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm shadow-rose-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          + Add New Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
              >
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {cat.color}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Expense Category'}
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setFormData({ ...formData, color: col })}
                  className={`w-7 h-7 rounded-full transition-transform ${formData.color === col ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-80 hover:opacity-100'}`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs sm:text-sm hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 transition-all shadow-sm shadow-rose-600/20"
            >
              {editingCategory ? 'Update Category' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
