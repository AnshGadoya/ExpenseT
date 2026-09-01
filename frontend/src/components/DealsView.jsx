import React, { useState, useEffect } from 'react';
import { 
  Handshake, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  Phone, 
  CreditCard, 
  AtSign,
  Sparkles, 
  History, 
  Calendar,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  AlertTriangle,
  FileX2,
  Undo2,
  Lock,
  CheckCheck,
  FileText,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { formatCurrency, formatDate, getTodayDateString, exportProfessionalFinancialWorkbook } from '../utils/formatters';
import Modal from './Modal';
import ProposalInvoiceModal from './ProposalInvoiceModal';

const getInstaUrl = (instaId) => {
  if (!instaId) return '';
  const clean = instaId.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  const handle = clean.startsWith('@') ? clean.slice(1) : clean;
  return `https://instagram.com/${handle}`;
};

export default function DealsView({ 
  services, 
  isAddOpen, 
  setIsAddOpen,
  selectedDealForPayment,
  setSelectedDealForPayment,
  selectedDealForRenewal,
  setSelectedDealForRenewal,
  onRefreshDeals,
  darkMode
}) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [editingDeal, setEditingDeal] = useState(null);
  const [paymentLedgerDeal, setPaymentLedgerDeal] = useState(null);

  // Proposal & Invoice Generator Modal State
  const [proposalModalDeal, setProposalModalDeal] = useState(null);
  const [proposalModalMode, setProposalModalMode] = useState('proposal');

  // Mark as Lost Modal State
  const [lostModalDeal, setLostModalDeal] = useState(null);
  const [lossReason, setLossReason] = useState('');

  // Close Deal Modal State
  const [closeModalDeal, setCloseModalDeal] = useState(null);
  const [closeReason, setCloseReason] = useState('');

  // Renewal Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewSourceDeal, setRenewSourceDeal] = useState(null);
  const [renewFormData, setRenewFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    company_name: '',
    insta_id: '',
    deal_date: getTodayDateString(),
    total_deal_amount: '',
    advance_amount: '',
    payment_mode: 'GPay',
    payment_reference: '',
    selected_service_ids: [],
    plan_cycle: '1 Month Retainer',
    notes: '',
  });

  // Deal Form
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    company_name: '',
    insta_id: '',
    deal_date: getTodayDateString(),
    duration_months: 1,
    total_deal_amount: '',
    advance_amount: '',
    payment_mode: 'GPay',
    payment_reference: '',
    selected_service_ids: [],
    notes: '',
  });

  // Payment Recording Form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: getTodayDateString(),
    payment_mode: 'GPay',
    reference_no: '',
    notes: '',
  });

  const loadDeals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await api.getDeals(params);
      setDeals(data);

      if (paymentLedgerDeal) {
        const refreshed = data.find(d => d.id === paymentLedgerDeal.id);
        if (refreshed) setPaymentLedgerDeal(refreshed);
      }
    } catch (err) {
      console.error('Failed to load client deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [search, statusFilter]);

  useEffect(() => {
    if (selectedDealForPayment) {
      handleOpenPaymentLedger(selectedDealForPayment);
      setSelectedDealForPayment(null);
    }
  }, [selectedDealForPayment]);

  useEffect(() => {
    if (selectedDealForRenewal) {
      handleOpenRenew(selectedDealForRenewal);
      if (setSelectedDealForRenewal) setSelectedDealForRenewal(null);
    }
  }, [selectedDealForRenewal]);

  const handleOpenAdd = () => {
    setEditingDeal(null);
    const initialServices = services.length > 0 ? [services[0].id] : [];
    const initialPrice = services.length > 0 && services[0].base_price ? Number(services[0].base_price) : '';

    setFormData({
      client_name: '',
      client_phone: '',
      client_email: '',
      company_name: '',
      insta_id: '',
      deal_date: getTodayDateString(),
      duration_months: 1,
      total_deal_amount: initialPrice,
      advance_amount: '',
      payment_mode: 'GPay',
      payment_reference: '',
      selected_service_ids: initialServices,
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({
      client_name: deal.client_name,
      client_phone: deal.client_phone || '',
      client_email: deal.client_email || '',
      company_name: deal.company_name || '',
      insta_id: deal.insta_id || '',
      deal_date: deal.deal_date,
      duration_months: deal.duration_months || 1,
      total_deal_amount: deal.total_deal_amount,
      advance_amount: deal.received_amount,
      payment_mode: 'GPay',
      payment_reference: '',
      selected_service_ids: deal.services ? deal.services.map(s => s.service_id) : [],
      notes: deal.notes || '',
    });
    setIsAddOpen(true);
  };

  // Open Renewal Modal
  const handleOpenRenew = (deal) => {
    setRenewSourceDeal(deal);
    const existingServiceIds = deal.services ? deal.services.map(s => s.service_id) : [];
    
    setRenewFormData({
      client_name: deal.client_name,
      client_phone: deal.client_phone || '',
      client_email: deal.client_email || '',
      company_name: deal.company_name || '',
      insta_id: deal.insta_id || '',
      deal_date: getTodayDateString(),
      total_deal_amount: deal.total_deal_amount || '',
      advance_amount: '',
      payment_mode: 'GPay',
      payment_reference: '',
      selected_service_ids: existingServiceIds,
      plan_cycle: '1 Month Retainer Extension',
      notes: `Service Renewal for ${deal.client_name} (${deal.company_name || 'Client'}) • 1 Month Extension`,
    });
    setIsRenewModalOpen(true);
  };

  // Calculate 1-Month Base Sum of selected services
  const calculateOneMonthSum = (serviceIds) => {
    return serviceIds.reduce((total, id) => {
      const s = services.find(srv => srv.id === id);
      return total + (s ? Number(s.base_price || 0) : 0);
    }, 0);
  };

  // Calculate Total Deal Price for selected Duration
  const calculateDealPrice = (serviceIds, durationMonths = 1) => {
    const dur = Number(durationMonths) || 1;
    let totalSum = 0;

    serviceIds.forEach(id => {
      const s = services.find(srv => srv.id === id);
      if (!s) return;
      
      const price = Number(s.base_price || 0);

      // Special Meta Ads 3-Month Offer Rule: ₹12,000 for 3 months instead of ₹18,000
      if (s.name.includes('Meta Ads') && dur === 3) {
        totalSum += 12000;
      } else {
        // Multiply 1-month service price by selected duration months (1, 2, 3, 6, 12)
        totalSum += price * dur;
      }
    });

    return totalSum;
  };

  const toggleServiceSelection = (serviceId) => {
    setFormData(prev => {
      const exists = prev.selected_service_ids.includes(serviceId);
      const updated = exists 
        ? prev.selected_service_ids.filter(id => id !== serviceId)
        : [...prev.selected_service_ids, serviceId];

      const sum = calculateDealPrice(updated, prev.duration_months);

      return { 
        ...prev, 
        selected_service_ids: updated, 
        total_deal_amount: sum > 0 ? sum : '' 
      };
    });
  };

  const toggleRenewServiceSelection = (serviceId) => {
    setRenewFormData(prev => {
      const exists = prev.selected_service_ids.includes(serviceId);
      const updated = exists 
        ? prev.selected_service_ids.filter(id => id !== serviceId)
        : [...prev.selected_service_ids, serviceId];

      const sum = calculateDealPrice(updated, prev.duration_months || 1);

      return { 
        ...prev, 
        selected_service_ids: updated, 
        total_deal_amount: sum > 0 ? sum : prev.total_deal_amount 
      };
    });
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    if (!formData.client_name?.trim()) {
      alert('Please enter Client / Contact Name.');
      return;
    }
    if (!formData.company_name?.trim()) {
      alert('Please enter Brand / Company Name.');
      return;
    }
    if (!formData.client_phone?.trim()) {
      alert('Please enter Phone / WhatsApp number.');
      return;
    }
    const digitsOnly = formData.client_phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      alert('Please enter a valid 10-digit Phone / WhatsApp number.');
      return;
    }
    if (!formData.deal_date) {
      alert('Please select Deal Date.');
      return;
    }
    if (!formData.total_deal_amount || Number(formData.total_deal_amount) <= 0) {
      alert('Please enter a valid Total Deal Amount.');
      return;
    }

    try {
      const payload = {
        ...formData,
        client_name: formData.client_name.trim(),
        company_name: formData.company_name.trim(),
        client_phone: formData.client_phone.trim(),
        services: formData.selected_service_ids.map(id => ({ service_id: id })),
      };

      if (editingDeal) {
        await api.updateDeal(editingDeal.id, payload);
      } else {
        await api.createDeal(payload);
      }
      setIsAddOpen(false);
      loadDeals();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Renewal Deal
  const handleSaveRenewal = async (e) => {
    e.preventDefault();
    if (!renewFormData.client_name || !renewFormData.deal_date || !renewFormData.total_deal_amount) {
      alert('Please enter renewal date and total deal amount');
      return;
    }

    try {
      const payload = {
        client_name: renewFormData.client_name,
        client_phone: renewFormData.client_phone,
        client_email: renewFormData.client_email,
        company_name: renewFormData.company_name,
        insta_id: renewFormData.insta_id,
        deal_date: renewFormData.deal_date,
        total_deal_amount: renewFormData.total_deal_amount,
        advance_amount: renewFormData.advance_amount || 0,
        payment_mode: renewFormData.payment_mode,
        payment_reference: renewFormData.payment_reference,
        notes: `[RENEWAL] ${renewFormData.plan_cycle}: ${renewFormData.notes}`,
        services: renewFormData.selected_service_ids.map(id => ({ service_id: id })),
      };

      await api.createDeal(payload);
      
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });

      setIsRenewModalOpen(false);
      setPaymentLedgerDeal(null);
      loadDeals();
    } catch (err) {
      alert('Failed to process deal renewal: ' + err.message);
    }
  };

  // Open Mark as Lost Modal
  const handleOpenMarkLost = (deal) => {
    setLostModalDeal(deal);
    setLossReason('');
  };

  // Submit Mark as Lost
  const handleConfirmMarkLost = async (e) => {
    e.preventDefault();
    if (!lossReason.trim()) {
      alert('Please specify the loss reason or remarks for accounting records');
      return;
    }

    try {
      await api.markDealAsLost(lostModalDeal.id, lossReason.trim());
      setLostModalDeal(null);
      setPaymentLedgerDeal(null);
      loadDeals();
    } catch (err) {
      alert('Failed to mark deal as lost: ' + err.message);
    }
  };

  // Open Close Contract Modal
  const handleOpenCloseModal = (deal) => {
    setCloseModalDeal(deal);
    setCloseReason('Contract cycle completed • Client did not renew membership');
  };

  // Confirm Close Contract
  const handleConfirmCloseDeal = async (e) => {
    e.preventDefault();
    try {
      await api.closeDeal(closeModalDeal.id, closeReason.trim() || 'Contract cycle completed • Non-renewed');
      setCloseModalDeal(null);
      if (paymentLedgerDeal) setPaymentLedgerDeal(null);
      loadDeals();
    } catch (err) {
      alert('Failed to close deal: ' + err.message);
    }
  };

  // Restore Deal from Lost to Active
  const handleRestoreDeal = async (deal) => {
    try {
      await api.restoreDeal(deal.id);
      loadDeals();
    } catch (err) {
      alert('Failed to restore deal: ' + err.message);
    }
  };

  const handleDeleteDeal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal and its payment records?')) return;
    try {
      await api.deleteDeal(id);
      loadDeals();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenPaymentLedger = async (deal) => {
    try {
      const fullDeal = await api.getDeal(deal.id);
      setPaymentLedgerDeal(fullDeal);
      setPaymentForm({
        amount: fullDeal.pending_amount > 0 ? fullDeal.pending_amount : '',
        payment_date: getTodayDateString(),
        payment_mode: 'GPay',
        reference_no: '',
        notes: '',
      });
    } catch (err) {
      alert('Failed to load deal details: ' + err.message);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0 || !paymentForm.payment_date) {
      alert('Please provide valid amount and payment date');
      return;
    }

    try {
      const res = await api.recordDealPayment(paymentLedgerDeal.id, paymentForm);
      
      if (res.newPending === 0) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      const updatedDeal = await api.getDeal(paymentLedgerDeal.id);
      setPaymentLedgerDeal(updatedDeal);
      setPaymentForm({
        amount: updatedDeal.pending_amount > 0 ? updatedDeal.pending_amount : '',
        payment_date: getTodayDateString(),
        payment_mode: 'UPI',
        reference_no: '',
        notes: '',
      });
      loadDeals();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    try {
      await api.deleteDealPayment(paymentId);
      const updatedDeal = await api.getDeal(paymentLedgerDeal.id);
      setPaymentLedgerDeal(updatedDeal);
      loadDeals();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExport = async () => {
    try {
      const expenses = await api.getExpenses();
      exportProfessionalFinancialWorkbook({
        expenses,
        deals,
        periodName: 'Client Deals & Expenses Export',
        fileName: 'Gandhi_Infosol_Deals_And_Expenses'
      });
    } catch {
      exportProfessionalFinancialWorkbook({
        expenses: [],
        deals,
        periodName: 'Client Deals Export',
        fileName: 'Gandhi_Infosol_Client_Deals'
      });
    }
  };

  const totalDealValue = deals.reduce((sum, d) => sum + Number(d.total_deal_amount), 0);
  const totalCollected = deals.reduce((sum, d) => sum + Number(d.received_amount), 0);
  const totalPending = deals
    .filter(d => d.status !== 'lost' && d.status !== 'completed')
    .reduce((sum, d) => sum + Number(d.pending_amount), 0);
  const totalLost = deals
    .filter(d => d.status === 'lost')
    .reduce((sum, d) => sum + Number(d.pending_amount), 0);

  const lostCount = deals.filter(d => d.status === 'lost').length;
  const closedCount = deals.filter(d => d.status === 'completed').length;
  const activeCount = deals.filter(d => d.status === 'active').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Handshake className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Client Deals & Receivables
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track client service packages, advance tokens, pending collections, renewals & contract closures
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs sm:text-sm font-bold transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + New Client Deal
          </button>
        </div>
      </div>

      {/* Overview Cards (4 Grid with Lost Bad Debt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-xs text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">Total Deals Value</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(totalDealValue)}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{deals.length} total closed clients</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">Total Received</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalCollected)}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {totalDealValue > 0 ? ((totalCollected / totalDealValue) * 100).toFixed(0) : 0}% collected
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Active Collectibles</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalPending)}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{activeCount} active retainers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <span className="text-xs text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Lost / Bad Debt</span>
            {lostCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold">
                {lostCount} Lost
              </span>
            )}
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalLost)}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Uncollectible default write-offs</p>
        </div>
      </div>

      {/* Filter & Search Bar with 4 Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search client, company, phone, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        {/* Status Toggle (All, Active, Closed/Completed, Lost) */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'active', label: `Pending Active (${activeCount})` },
            { id: 'completed', label: `Closed & Paid (${closedCount})` },
            { id: 'lost', label: `Lost / Bad Debt ${lostCount > 0 ? `(${lostCount})` : ''}`, isDanger: true },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === s.id
                  ? s.isDanger
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-indigo-600 text-white shadow-2xs'
                  : s.isDanger && lostCount > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

      </div>

      {/* Deals Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">Loading client deals...</div>
        ) : deals.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 font-medium">
            {statusFilter === 'lost' 
              ? 'No lost / defaulted deals in record.' 
              : statusFilter === 'completed'
              ? 'No closed / completed deals in record.'
              : 'No client deals found matching your search.'}
          </div>
        ) : (
          deals.map((deal) => {
            const isLost = deal.status === 'lost';
            const isClosed = deal.status === 'completed';
            const isPaidInFull = deal.pending_amount <= 0;
            const progress = deal.total_deal_amount > 0 ? (deal.received_amount / deal.total_deal_amount) * 100 : 0;

            // Check Contract Duration & Expiry
            const durMonths = deal.duration_months || 1;
            const dealDateObj = new Date(deal.deal_date);
            let expiryDateObj = deal.expiry_date ? new Date(deal.expiry_date) : new Date(dealDateObj);
            if (!deal.expiry_date) {
              expiryDateObj.setMonth(expiryDateObj.getMonth() + durMonths);
            }
            const todayObj = new Date();
            const daysRemaining = Math.ceil((expiryDateObj - todayObj) / (1000 * 60 * 60 * 24));
            const isExpiredPlan = daysRemaining <= 0 && deal.status === 'active';
            const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7 && deal.status === 'active';

            return (
              <div 
                key={deal.id}
                className={`rounded-2xl p-5 flex flex-col justify-between border shadow-2xs transition-all ${
                  isLost
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : isClosed
                    ? 'bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Bar: Client & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">{deal.client_name}</h3>
                        {deal.company_name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                            {deal.company_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Date: {formatDate(deal.deal_date)}</span>
                        {deal.client_phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400">
                              <Phone className="w-3 h-3 text-slate-400" /> {deal.client_phone}
                            </span>
                          </>
                        )}
                        {deal.insta_id && (
                          <>
                            <span>•</span>
                            <a
                              href={getInstaUrl(deal.insta_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 hover:underline text-xs font-semibold"
                              title="Open Instagram Profile"
                            >
                              <AtSign className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                              <span>{deal.insta_id.startsWith('@') || deal.insta_id.includes('/') ? deal.insta_id : `@${deal.insta_id}`}</span>
                            </a>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1 ${
                        isLost
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : isClosed && isPaidInFull
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : isClosed
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {isLost ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Lost / Bad Debt</span>
                          </>
                        ) : isClosed && isPaidInFull ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Closed & Fully Paid</span>
                          </>
                        ) : isClosed ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Closed Contract</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Active Retainer</span>
                          </>
                        )}
                      </span>

                      {/* Contract Duration & Expiry Status */}
                      {deal.status === 'active' && (
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                          isExpiredPlan
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                            : isExpiringSoon
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                        }`}>
                          {durMonths} Mo ({daysRemaining > 0 ? `${daysRemaining}d left` : `Expired ${Math.abs(daysRemaining)}d ago`})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Services Availed Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {deal.services && deal.services.length > 0 ? (
                      deal.services.map((s, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80 rounded-lg flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          {s.service_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">No specific service attached</span>
                    )}
                  </div>

                  {/* Financial Breakdown Progress Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/60 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Deal Value:</span>
                        <div className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(deal.total_deal_amount)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Received:</span>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(deal.received_amount)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {isLost ? 'Lost Amount:' : isClosed ? 'Final Balance:' : 'Pending:'}
                        </span>
                        <div className={`text-sm font-black ${isLost ? 'text-rose-600 dark:text-rose-400' : isClosed && isPaidInFull ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {formatCurrency(deal.pending_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isLost 
                            ? 'bg-rose-500' 
                            : isPaidInFull 
                            ? 'bg-emerald-500' 
                            : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes / Loss Remarks */}
                  {deal.notes && (
                    <p className={`text-xs p-2.5 rounded-lg border mb-3 whitespace-pre-line leading-relaxed ${
                      isLost 
                        ? 'bg-rose-100/70 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900 font-medium'
                        : isClosed
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 italic border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 italic border-slate-200/60 dark:border-slate-700/60'
                    }`}>
                      {deal.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-medium shrink-0">
                    <History className="w-3.5 h-3.5" />
                    <span>{deal.payments ? deal.payments.length : 0} payments</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
                    
                    {/* If deal is marked as Lost: Show Restore button */}
                    {isLost ? (
                      <button
                        onClick={() => handleRestoreDeal(deal)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all"
                        title="Restore this deal back to active receivables"
                      >
                        <Undo2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Restore Deal
                      </button>
                    ) : (
                      <>
                        {/* 1-Click Renew Plan Button */}
                        <button
                          onClick={() => handleOpenRenew(deal)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all shadow-2xs active:scale-95"
                          title="Renew services or upgrade contract for next month"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Renew
                        </button>

                        <button
                          onClick={() => handleOpenPaymentLedger(deal)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Payments
                        </button>

                        {/* Proposal & Quote Generator */}
                        <button
                          onClick={() => {
                            setProposalModalMode('proposal');
                            setProposalModalDeal(deal);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all shadow-2xs"
                          title="Generate Gandhi Infosol Proposal & Quote PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          Quote
                        </button>

                        {/* Invoice & Bill Generator */}
                        <button
                          onClick={() => {
                            setProposalModalMode('invoice');
                            setProposalModalDeal(deal);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-all shadow-2xs"
                          title="Generate Official Service Invoice & Bill PDF"
                        >
                          <Receipt className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          Bill
                        </button>

                        {/* Close Contract Button (When Active and not renewing) */}
                        {deal.status === 'active' && (
                          <button
                            onClick={() => handleOpenCloseModal(deal)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs"
                            title="Close contract (Client does not renew membership)"
                          >
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            Close
                          </button>
                        )}

                        {/* Mark as Lost Button (if pending amount exists) */}
                        {deal.pending_amount > 0 && deal.status === 'active' && (
                          <button
                            onClick={() => handleOpenMarkLost(deal)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Mark as Lost / Defaulted Bad Debt"
                          >
                            <FileX2 className="w-4 h-4 text-rose-500" />
                          </button>
                        )}
                      </>
                    )}
                    
                    <button
                      onClick={() => handleOpenEdit(deal)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Deal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDeal(deal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      title="Delete Deal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Deal Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingDeal ? 'Edit Client Deal' : 'Register New Client Deal'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveDeal} className="space-y-4">
          
          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Client / Contact Name <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar (ABC Jewels)"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company / Brand Name <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ABC Jewels Pvt Ltd"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone / WhatsApp <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={formData.client_phone}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, client_phone: numeric });
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5 text-pink-500" />
                Instagram Handle / Link
              </label>
              <input
                type="text"
                placeholder="e.g. @brand_official or instagram.com/brand"
                value={formData.insta_id || ''}
                onChange={(e) => setFormData({ ...formData, insta_id: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Deal Date <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.deal_date}
                onChange={(e) => setFormData({ ...formData, deal_date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contract Term / Duration <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <select
                value={formData.duration_months || 1}
                onChange={(e) => {
                  const newDur = Number(e.target.value);
                  const updatedSum = calculateDealPrice(formData.selected_service_ids, newDur);
                  setFormData(prev => ({
                    ...prev,
                    duration_months: newDur,
                    total_deal_amount: updatedSum > 0 ? updatedSum : prev.total_deal_amount
                  }));
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-600"
              >
                <option value={1}>1 Month Membership (Standard 30 Days)</option>
                <option value={2}>2 Months Membership (60 Days)</option>
                <option value={3}>3 Months Membership (90 Days - Special Offer)</option>
                <option value={6}>6 Months Membership (180 Days)</option>
                <option value={12}>1 Year Membership (365 Days)</option>
              </select>
            </div>
          </div>

          {/* SPECIAL META ADS OFFER BANNER */}
          {formData.selected_service_ids.some(id => {
            const s = services.find(srv => srv.id === id);
            return s && s.name.includes('Meta Ads');
          }) && formData.duration_months === 3 && (
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700/80 rounded-xl flex items-center gap-3 animate-pulse">
              <div className="p-2 bg-amber-500 text-white rounded-lg font-black text-xs shrink-0">
                🎉 SPECIAL OFFER
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-amber-900 dark:text-amber-200">
                  Meta Ads 3-Month Membership Offer Applied!
                </p>
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Special rate: <strong className="underline">₹12,000 for 3 Months</strong> instead of ₹18,000 (Saved ₹6,000!)
                </p>
              </div>
            </div>
          )}

          {/* Services Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Services Included (Select to auto-calculate price)
              </label>
              <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                1 Mo Price: {formatCurrency(calculateOneMonthSum(formData.selected_service_ids))}
                {formData.duration_months > 1 && (
                  <span className="text-emerald-700 dark:text-emerald-300 ml-1.5">
                    × {formData.duration_months} Months = {formatCurrency(calculateDealPrice(formData.selected_service_ids, formData.duration_months))}
                  </span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {services.map((serv) => {
                const isSelected = formData.selected_service_ids.includes(serv.id);
                return (
                  <button
                    type="button"
                    key={serv.id}
                    onClick={() => toggleServiceSelection(serv.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="truncate mr-2">{serv.name}</span>
                    <span className="font-mono text-[11px] shrink-0 text-slate-500 dark:text-slate-400">{formatCurrency(serv.base_price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Deal Amount (₹) <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 50000"
                  value={formData.total_deal_amount}
                  onChange={(e) => setFormData({ ...formData, total_deal_amount: e.target.value })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white font-black text-base focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {!editingDeal && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Advance Received (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10000 (if advance paid)"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-emerald-700 dark:text-emerald-400 font-black text-base focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* If advance is entered on new deal */}
          {!editingDeal && Number(formData.advance_amount) > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Payment Mode
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="GPay">GPay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Paytm">Paytm</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Payment Ref / UPI ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/2948274928"
                  value={formData.payment_reference}
                  onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Deal Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Deliverables & Remarks / Campaign Scope
            </label>
            <textarea
              rows="2"
              placeholder="e.g. 8 Reels shoot + Meta Ad campaign setup for festive launch..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-600/20"
            >
              {editingDeal ? 'Update Deal' : 'Save Deal'}
            </button>
          </div>

        </form>
      </Modal>

      {/* CLOSE CONTRACT MODAL */}
      <Modal
        isOpen={Boolean(closeModalDeal)}
        onClose={() => setCloseModalDeal(null)}
        title="Close Client Contract (Non-Renewed / Term Finished)"
        maxWidth="max-w-lg"
      >
        {closeModalDeal && (
          <form onSubmit={handleConfirmCloseDeal} className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Archive & Close Active Retainer</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Client: <strong className="text-slate-900 dark:text-white">{closeModalDeal.client_name}</strong> {closeModalDeal.company_name && `(${closeModalDeal.company_name})`}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This will mark the contract as <strong>Closed & Completed</strong> in your records. You can always renew or view it in the Closed section.
              </p>
            </div>

            {/* Quick Reason Suggestions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Closing Reason:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Contract cycle completed • Client did not renew membership',
                  'One-time deliverables (Reels/Ads) completed',
                  'Client paused marketing campaign for season',
                  'Contract concluded with full satisfaction',
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCloseReason(reason)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Closing Remarks & Scope Notes
              </label>
              <textarea
                rows="2"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCloseModalDeal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                Confirm & Close Deal
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MARK AS LOST / BAD DEBT MODAL */}
      <Modal
        isOpen={Boolean(lostModalDeal)}
        onClose={() => setLostModalDeal(null)}
        title="Mark Client Deal as Lost (Bad Debt Default)"
        maxWidth="max-w-lg"
      >
        {lostModalDeal && (
          <form onSubmit={handleConfirmMarkLost} className="space-y-4">
            
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 rounded-2xl border border-rose-200 dark:border-rose-900 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Move to Lost Section & Write Off Remaining Balance</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Client: <strong className="text-slate-900 dark:text-white">{lostModalDeal.client_name}</strong> {lostModalDeal.company_name && `(${lostModalDeal.company_name})`}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-200 dark:border-rose-900/60 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Already Received:</span>
                  <div className="font-bold text-emerald-600">{formatCurrency(lostModalDeal.received_amount)}</div>
                </div>
                <div>
                  <span className="text-rose-700 dark:text-rose-400 font-semibold">Uncollectible Loss:</span>
                  <div className="font-black text-rose-600 text-sm">{formatCurrency(lostModalDeal.pending_amount)}</div>
                </div>
              </div>
            </div>

            {/* Quick Reason Suggestions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Quick Reason Selection:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Client refused remaining payment after deliverable',
                  'Client business shut down / default',
                  'Client unresponsive / ghosted for 60+ days',
                  'Scope dispute settlement agreement',
                  'Client refused due to campaign cancellation',
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLossReason(reason)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/80 hover:text-rose-700 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Loss Remarks & Accounting Notes <span className="text-rose-600">*</span>
              </label>
              <textarea
                required
                rows="3"
                placeholder="Explain why this payment could not be collected..."
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-rose-600 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLostModalDeal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-rose-600/20 transition-all"
              >
                Confirm & Move to Lost
              </button>
            </div>

          </form>
        )}
      </Modal>

      {/* RENEWAL / PLAN UPDATION MODAL */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title="Renew Deal / Update Retainer Contract"
        maxWidth="max-w-2xl"
      >
        {renewSourceDeal && (
          <form onSubmit={handleSaveRenewal} className="space-y-4">
            
            {/* Renewal Header Banner */}
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/70 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {renewSourceDeal.client_name} {renewSourceDeal.company_name && `(${renewSourceDeal.company_name})`}
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    Previous Deal: {formatCurrency(renewSourceDeal.total_deal_amount)} • Closed on {formatDate(renewSourceDeal.deal_date)}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg bg-emerald-600 text-white">
                New Billing Term
              </span>
            </div>

            {/* Contract Period / Cycle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Renewal Start Date <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={renewFormData.deal_date}
                  onChange={(e) => setRenewFormData({ ...renewFormData, deal_date: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contract Term / Retainer Cycle
                </label>
                <select
                  value={renewFormData.plan_cycle}
                  onChange={(e) => setRenewFormData({ ...renewFormData, plan_cycle: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="1 Month Retainer Extension">1 Month Retainer (Monthly Continuing)</option>
                  <option value="3 Months Growth Bundle">3 Months Retainer Package</option>
                  <option value="6 Months Extended Contract">6 Months Media Contract</option>
                  <option value="Annual Retainer">1 Year Annual Marketing Retainer</option>
                  <option value="Custom Project Extension">Custom Service Extension</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <AtSign className="w-3.5 h-3.5 text-pink-500" />
                  Instagram Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. @brand_handle"
                  value={renewFormData.insta_id || ''}
                  onChange={(e) => setRenewFormData({ ...renewFormData, insta_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Service & Plan Updation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Update Plan & Services for this New Term
                </label>
                <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Package Total: {formatCurrency(calculateDealPrice(renewFormData.selected_service_ids, renewFormData.duration_months || 1))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {services.map((serv) => {
                  const isSelected = renewFormData.selected_service_ids.includes(serv.id);
                  return (
                    <button
                      type="button"
                      key={serv.id}
                      onClick={() => toggleRenewServiceSelection(serv.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="truncate mr-2">{serv.name}</span>
                      <span className="font-mono text-[11px] shrink-0 text-slate-500 dark:text-slate-400">
                        {formatCurrency(serv.base_price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pricing & Advance Received for Renewal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Renewal Total Deal Amount (₹) <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50000"
                    value={renewFormData.total_deal_amount}
                    onChange={(e) => setRenewFormData({ ...renewFormData, total_deal_amount: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white font-black text-base focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Paid for this Term (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 20000 (if advance paid)"
                    value={renewFormData.advance_amount}
                    onChange={(e) => setRenewFormData({ ...renewFormData, advance_amount: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-emerald-600 font-black text-base focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Advance payment details if entered */}
            {Number(renewFormData.advance_amount) > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={renewFormData.payment_mode}
                    onChange={(e) => setRenewFormData({ ...renewFormData, payment_mode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                  >
                    <option value="GPay">GPay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Ref / UPI Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/3948274928"
                    value={renewFormData.payment_reference}
                    onChange={(e) => setRenewFormData({ ...renewFormData, payment_reference: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            )}

            {/* Renewal Scope / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Renewal Scope & Deliverables Remarks
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Month 2 Retainer: 12 Reels + Instagram Stories & Meta Ad budget management..."
                value={renewFormData.notes}
                onChange={(e) => setRenewFormData({ ...renewFormData, notes: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Confirm & Create Renewal Deal
              </button>
            </div>

          </form>
        )}
      </Modal>

      {/* Payment Ledger & Recording Modal */}
      <Modal
        isOpen={Boolean(paymentLedgerDeal)}
        onClose={() => setPaymentLedgerDeal(null)}
        title="Client Payment Installments & Ledger"
        maxWidth="max-w-2xl"
      >
        {paymentLedgerDeal && (
          <div className="space-y-5">
            
            {/* Deal Overview Card */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{paymentLedgerDeal.client_name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{paymentLedgerDeal.company_name || 'Client Deal'}</p>
                    {paymentLedgerDeal.insta_id && (
                      <a
                        href={getInstaUrl(paymentLedgerDeal.insta_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 text-[11px] font-semibold hover:bg-pink-100 transition-colors"
                        title="Open Instagram Profile"
                      >
                        <AtSign className="w-3 h-3 text-pink-500 shrink-0" />
                        {paymentLedgerDeal.insta_id.startsWith('@') || paymentLedgerDeal.insta_id.includes('/') ? paymentLedgerDeal.insta_id : `@${paymentLedgerDeal.insta_id}`}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    paymentLedgerDeal.status === 'lost'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : paymentLedgerDeal.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {paymentLedgerDeal.status === 'lost' 
                      ? 'Marked as Lost' 
                      : paymentLedgerDeal.status === 'completed' 
                      ? 'Closed & Completed' 
                      : 'Active Retainer'}
                  </span>

                  {/* Renew Button inside Ledger */}
                  <button
                    onClick={() => {
                      const d = paymentLedgerDeal;
                      setPaymentLedgerDeal(null);
                      handleOpenRenew(d);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                    title="Renew plan for next cycle"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Renew
                  </button>

                  {/* Close Contract inside Ledger if active */}
                  {paymentLedgerDeal.status === 'active' && (
                    <button
                      onClick={() => {
                        const d = paymentLedgerDeal;
                        setPaymentLedgerDeal(null);
                        handleOpenCloseModal(d);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 shadow-2xs transition-colors"
                      title="Close contract (Client does not renew membership)"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Close
                    </button>
                  )}

                  {/* Mark Lost inside Ledger */}
                  {paymentLedgerDeal.status === 'active' && paymentLedgerDeal.pending_amount > 0 && (
                    <button
                      onClick={() => {
                        const d = paymentLedgerDeal;
                        setPaymentLedgerDeal(null);
                        handleOpenMarkLost(d);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                      title="Mark as lost uncollectible"
                    >
                      <FileX2 className="w-3.5 h-3.5" />
                      Mark Lost
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Total Deal</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(paymentLedgerDeal.total_deal_amount)}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Received So Far</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paymentLedgerDeal.received_amount)}</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className={`text-[11px] font-semibold ${paymentLedgerDeal.status === 'lost' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {paymentLedgerDeal.status === 'lost' ? 'Lost Balance' : 'Remaining Balance'}
                  </span>
                  <div className={`text-sm font-bold ${paymentLedgerDeal.status === 'lost' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formatCurrency(paymentLedgerDeal.pending_amount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Record New Payment Form if balance remains and not lost */}
            {paymentLedgerDeal.pending_amount > 0 && paymentLedgerDeal.status !== 'lost' ? (
              <form onSubmit={handleRecordPayment} className="bg-white dark:bg-slate-900 rounded-2xl p-4 space-y-3 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Record New Payment Received
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        step="any"
                        required
                        max={paymentLedgerDeal.pending_amount}
                        placeholder="Amount"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mode
                    </label>
                    <select
                      value={paymentForm.payment_mode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 font-medium"
                    >
                      <option value="GPay">GPay</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ref / Transaction ID (optional)"
                    value={paymentForm.reference_no}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Note e.g. Milestone 2 payment"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all"
                  >
                    + Add Payment Entry
                  </button>
                </div>
              </form>
            ) : paymentLedgerDeal.status === 'lost' ? (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>This deal has been marked as Lost (Bad Debt Default).</span>
                </div>
                <button
                  onClick={() => {
                    const d = paymentLedgerDeal;
                    setPaymentLedgerDeal(null);
                    handleRestoreDeal(d);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-rose-300 dark:border-rose-700 hover:bg-rose-100 shadow-2xs flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5 text-indigo-600" />
                  Restore to Active
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>This deal is Closed & Completed!</span>
                </div>
                <button
                  onClick={() => {
                    const d = paymentLedgerDeal;
                    setPaymentLedgerDeal(null);
                    handleOpenRenew(d);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Renew for Next Month
                </button>
              </div>
            )}

            {/* Payment History Timeline */}
            <div>
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Payment History Timeline
              </h5>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {paymentLedgerDeal.payments && paymentLedgerDeal.payments.length > 0 ? (
                  paymentLedgerDeal.payments.map((p) => (
                    <div 
                      key={p.id}
                      className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs border border-slate-200/80 dark:border-slate-700/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{formatDate(p.payment_date)}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-800 dark:text-slate-200 font-mono">
                            {p.payment_mode}
                          </span>
                          {p.reference_no && (
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">Ref: {p.reference_no}</span>
                          )}
                        </div>
                        {p.notes && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{p.notes}</p>}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(p.amount)}</span>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete Payment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-xs">
                    No payment records logged yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Proposal & Invoice Generator Modal */}
      <ProposalInvoiceModal
        isOpen={Boolean(proposalModalDeal)}
        onClose={() => setProposalModalDeal(null)}
        deal={proposalModalDeal}
        mode={proposalModalMode}
        services={services}
      />

    </div>
  );
}
