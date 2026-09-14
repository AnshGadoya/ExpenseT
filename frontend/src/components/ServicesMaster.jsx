import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Plus, Edit3, Trash2, Tag, Layers, CheckCircle2, 
  Search, X, Calendar, Hash, FolderKanban, Video, Megaphone, 
  Palette, ArrowUpRight, Filter, ChevronRight
} from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import Modal from './Modal';

export default function ServicesMaster({ services = [], onRefreshServices, darkMode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPricingType, setSelectedPricingType] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: 'Specialized Creative Solutions',
    pricing_type: 'month_wise',
  });

  // Scroll to top on mount for clean mobile navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      base_price: '',
      category: 'Specialized Creative Solutions',
      pricing_type: 'month_wise',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (serv) => {
    setEditingService(serv);
    setFormData({
      name: serv.name,
      description: serv.description || '',
      base_price: serv.base_price,
      category: serv.category || 'Specialized Creative Solutions',
      pricing_type: serv.pricing_type || 'month_wise',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      description: formData.description ? formData.description.trim() : '',
      base_price: Number(formData.base_price) || 0,
      category: formData.category || 'Specialized Creative Solutions',
      pricing_type: formData.pricing_type || 'month_wise',
    };

    try {
      if (editingService) {
        await api.updateService(editingService.id, payload);
      } else {
        await api.createService(payload);
      }
      setIsModalOpen(false);
      onRefreshServices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this service from master?')) return;
    try {
      await api.deleteService(id);
      onRefreshServices();
    } catch (err) {
      alert(err.message);
    }
  };

  // Dynamic Categories from available services
  const uniqueCategories = useMemo(() => {
    const defaultCats = [
      'Specialized Creative Solutions',
      'Digital & Production',
      'Meta Ads & Performance',
      'Strategic Marketing Packages'
    ];
    const fromServices = services.map(s => s.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...fromServices]));
  }, [services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((serv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        serv.name?.toLowerCase().includes(q) || 
        serv.description?.toLowerCase().includes(q) || 
        serv.category?.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'all' || serv.category === selectedCategory;
      const matchPricing = selectedPricingType === 'all' || (serv.pricing_type || 'month_wise') === selectedPricingType;

      return matchSearch && matchCategory && matchPricing;
    });
  }, [services, searchQuery, selectedCategory, selectedPricingType]);

  // Summary Metrics
  const totalCount = services.length;
  const monthWiseCount = services.filter(s => (s.pricing_type || 'month_wise') === 'month_wise').length;
  const qtyWiseCount = services.filter(s => s.pricing_type === 'qty_wise').length;
  const categoriesCount = new Set(services.map(s => s.category).filter(Boolean)).size;

  // Helper for category-specific icon
  const getCategoryIcon = (category = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('meta') || cat.includes('ads') || cat.includes('marketing')) {
      return <Megaphone className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
    }
    if (cat.includes('video') || cat.includes('production') || cat.includes('reel')) {
      return <Video className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
    }
    if (cat.includes('creative') || cat.includes('design') || cat.includes('logo')) {
      return <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Digital Services Master
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                CATALOG
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Standardized offerings, retainers & creative packages for Gandhi Infosol
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Service</span>
        </button>
      </div>

      {/* KPI Overview Grid (2x2 on Mobile, 4-col on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Offerings */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Services
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalCount}
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              Master catalog items
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Month-wise Retainers */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Month-wise Retainers
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {monthWiseCount}
            </h3>
            <span className="text-[10px] text-amber-700 dark:text-amber-500 font-semibold">
              Scales by duration
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Qty-wise Deliverables */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Deliverables & Units
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {qtyWiseCount}
            </h3>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-500 font-semibold">
              Fixed unit pricing
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Categories
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
              {categoriesCount}
            </h3>
            <span className="text-[10px] text-purple-700 dark:text-purple-500 font-semibold">
              Organized domains
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <FolderKanban className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        
        {/* Search & Pricing Mode Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search services by title, description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
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

          {/* Pricing Type Filter Chips */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setSelectedPricingType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPricingType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Types ({totalCount})
            </button>
            <button
              onClick={() => setSelectedPricingType('month_wise')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPricingType === 'month_wise'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              📅 Month-wise ({monthWiseCount})
            </button>
            <button
              onClick={() => setSelectedPricingType('qty_wise')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPricingType === 'qty_wise'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              🔢 Qty-wise ({qtyWiseCount})
            </button>
          </div>
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {uniqueCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = services.filter(s => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected 
                    ? 'bg-indigo-200/80 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Services Grid or Empty State */}
      {filteredServices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-7 h-7 opacity-70" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            No matching services found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedPricingType !== 'all'
              ? 'Try adjusting your search terms or clearing category and pricing type filters.'
              : 'No services registered yet. Click "+ Add New Service" above to build your catalog.'}
          </p>
          {(searchQuery || selectedCategory !== 'all' || selectedPricingType !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedPricingType('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredServices.map((serv) => {
            const isMonthWise = (serv.pricing_type || 'month_wise') === 'month_wise';
            return (
              <div
                key={serv.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
              >
                <div>
                  
                  {/* Top Badges & Action Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80 uppercase tracking-wider">
                        {getCategoryIcon(serv.category)}
                        <span className="truncate max-w-[140px] sm:max-w-[160px]">{serv.category || 'Digital'}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        isMonthWise
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {isMonthWise ? '📅 Month-wise' : '🔢 Qty-wise'}
                      </span>
                    </div>

                    {/* Touch-Friendly Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(serv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                        title="Edit Service"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(serv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Service Title */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                    {serv.name}
                  </h3>
                  
                  {/* Service Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {serv.description || 'Standard digital media offering. No additional details specified.'}
                  </p>
                </div>

                {/* Price Box Footer */}
                <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    {isMonthWise ? 'Base Monthly Rate' : 'Fixed Unit Rate'}
                  </span>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatCurrency(serv.base_price)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold ml-1">
                      {isMonthWise ? '/ Month' : '/ Unit'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service Details' : 'Add Digital Marketing Service'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Service Name <span className="text-indigo-600 dark:text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 15 Reels Bundle Shoot & Editing"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 font-medium"
            />
          </div>

          {/* Pricing Mode Selector (Responsive Grid) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Billing & Pricing Mode <span className="text-indigo-600 dark:text-indigo-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pricing_type: 'month_wise' })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  formData.pricing_type === 'month_wise'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>📅</span> Month-wise Retainer
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Scales with contract duration months. Quantity selector hidden in deal creation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, pricing_type: 'qty_wise' })}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  formData.pricing_type === 'qty_wise'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>🔢</span> Qty-wise Deliverable
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  Fixed unit price (e.g. per Reel / per Logo). Quantity selector enabled; contract duration ignored.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 font-medium"
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {formData.pricing_type === 'month_wise' ? 'Base Monthly Rate (₹)' : 'Base Unit Rate (₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs sm:text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 25000"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description / Package Inclusions
            </label>
            <textarea
              rows="3"
              placeholder="Detail what is included in this service (e.g. Concept script, 4K camera, lighting, sound, model coordination, final color grading)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
            />
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
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              {editingService ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

