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
  Receipt,
  TrendingUp,
  TrendingDown,
  Layers,
  User,
  X
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

  // Filters & View Mode
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('current'); // 'current' (latest active contract per client) | 'all' (all cycles)

  // Modals state
  const [editingDeal, setEditingDeal] = useState(null);
  const [paymentLedgerDeal, setPaymentLedgerDeal] = useState(null);

  // Client History & Renewal Timeline Modal State
  const [historyModalDeal, setHistoryModalDeal] = useState(null);
  const [clientHistoryData, setClientHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
    service_quantities: {},
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
    service_quantities: {},
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
      if (viewMode === 'current') params.current_only = 'true';

      const data = await api.getDeals(params);
      const validDeals = Array.isArray(data) ? data : [];
      setDeals(validDeals);

      if (paymentLedgerDeal) {
        const refreshed = validDeals.find(d => d.id === paymentLedgerDeal.id);
        if (refreshed) setPaymentLedgerDeal(refreshed);
      }
    } catch (err) {
      console.error('Failed to load client deals:', err);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClientHistory = async (deal) => {
    setHistoryModalDeal(deal);
    setLoadingHistory(true);
    setClientHistoryData(null);
    try {
      const data = await api.getDealHistory(deal.id);
      setClientHistoryData(data);
    } catch (err) {
      console.error('Failed to load client history:', err);
      alert('Failed to load client history: ' + err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    loadDeals();
  }, [search, statusFilter, viewMode]);

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

  useEffect(() => {
    if (isAddOpen && !editingDeal && (!formData.selected_service_ids || formData.selected_service_ids.length === 0)) {
      const initialServices = (services && services.length > 0) ? [services[0].id] : [];
      const initialPrice = (services && services.length > 0 && services[0].base_price) ? Number(services[0].base_price) : '';
      const initialQuantities = (services && services.length > 0) ? { [services[0].id]: 1 } : {};

      setFormData(prev => ({
        ...prev,
        total_deal_amount: prev.total_deal_amount || initialPrice,
        selected_service_ids: prev.selected_service_ids?.length ? prev.selected_service_ids : initialServices,
        service_quantities: prev.service_quantities && Object.keys(prev.service_quantities).length ? prev.service_quantities : initialQuantities
      }));
    }
  }, [isAddOpen, services]);

  const handleOpenAdd = () => {
    setEditingDeal(null);
    const initialServices = services.length > 0 ? [services[0].id] : [];
    const initialPrice = services.length > 0 && services[0].base_price ? Number(services[0].base_price) : '';
    const initialQuantities = services.length > 0 ? { [services[0].id]: 1 } : {};

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
      service_quantities: initialQuantities,
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (deal) => {
    setEditingDeal(deal);
    const serviceIds = deal.services ? deal.services.map(s => s.service_id) : [];
    const quantities = {};
    if (deal.services) {
      deal.services.forEach(s => {
        quantities[s.service_id] = s.quantity || 1;
      });
    }
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
      selected_service_ids: serviceIds,
      service_quantities: quantities,
      notes: deal.notes || '',
    });
    setIsAddOpen(true);
  };

  // Open Renewal Modal
  const handleOpenRenew = (deal) => {
    setRenewSourceDeal(deal);
    const existingServiceIds = deal.services ? deal.services.map(s => s.service_id) : [];
    const quantities = {};
    if (deal.services) {
      deal.services.forEach(s => {
        quantities[s.service_id] = s.quantity || 1;
      });
    }

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
      service_quantities: quantities,
      plan_cycle: '1 Month Retainer Extension',
      notes: `Service Renewal for ${deal.client_name} (${deal.company_name || 'Client'}) • 1 Month Extension`,
    });
    setIsRenewModalOpen(true);
  };

  // Check if selected services contain Video Shoot / Reel quantity service
  const isReelServiceSelected = (serviceIds = []) => {
    const safeIds = Array.isArray(serviceIds) ? serviceIds : [];
    return safeIds.some(id => {
      const s = (services || []).find(srv => srv.id === id);
      if (!s) return false;
      const name = (s.name || '').toLowerCase();
      return name.includes('video shoot') || name.includes('reel');
    });
  };

  // Calculate 1-Month Base Sum of selected services
  const calculateOneMonthSum = (serviceIds = [], quantities = {}) => {
    const safeIds = Array.isArray(serviceIds) ? serviceIds : [];
    const safeQtys = quantities || {};
    return safeIds.reduce((total, id) => {
      const s = (services || []).find(srv => srv.id === id);
      if (!s) return total;
      const isQtyWise = (s.pricing_type || 'month_wise') === 'qty_wise';
      const qty = isQtyWise ? Math.max(1, Number(safeQtys[id]) || 1) : 1;
      return total + (Number(s.base_price || 0) * qty);
    }, 0);
  };

  // Calculate Total Deal Price based on Service Pricing Mode (Month-wise scales with duration; Qty-wise scales with quantity)
  const calculateDealPrice = (serviceIds = [], durationMonths = 1, quantities = {}) => {
    const safeIds = Array.isArray(serviceIds) ? serviceIds : [];
    const safeQtys = quantities || {};
    const dur = Number(durationMonths) || 1;
    let totalSum = 0;

    safeIds.forEach(id => {
      const s = (services || []).find(srv => srv.id === id);
      if (!s) return;
      
      const isQtyWise = (s.pricing_type || 'month_wise') === 'qty_wise';

      if (isQtyWise) {
        // Qty-wise: Fixed unit deliverable - Billed per quantity
        const qty = Math.max(1, Number(safeQtys[id]) || 1);
        totalSum += Number(s.base_price || 0) * qty;
      } else {
        // Month-wise: Retainer service - Billed per month across contract duration (Qty is 1)
        if (s.name && s.name.includes('Meta Ads') && dur === 3) {
          totalSum += 12000;
        } else {
          totalSum += Number(s.base_price || 0) * dur;
        }
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

      const newQtys = { ...prev.service_quantities };
      if (!exists && !newQtys[serviceId]) {
        newQtys[serviceId] = 1;
      }

      const sum = calculateDealPrice(updated, prev.duration_months, newQtys);

      return { 
        ...prev, 
        selected_service_ids: updated, 
        service_quantities: newQtys,
        total_deal_amount: sum > 0 ? sum : '' 
      };
    });
  };

  const updateServiceQuantity = (serviceId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setFormData(prev => {
      const newQtys = { ...prev.service_quantities, [serviceId]: qty };
      const updatedIds = prev.selected_service_ids.includes(serviceId)
        ? prev.selected_service_ids
        : [...prev.selected_service_ids, serviceId];

      const sum = calculateDealPrice(updatedIds, prev.duration_months, newQtys);

      return {
        ...prev,
        selected_service_ids: updatedIds,
        service_quantities: newQtys,
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

      const newQtys = { ...prev.service_quantities };
      if (!exists && !newQtys[serviceId]) {
        newQtys[serviceId] = 1;
      }

      const sum = calculateDealPrice(updated, prev.duration_months || 1, newQtys);

      return { 
        ...prev, 
        selected_service_ids: updated, 
        service_quantities: newQtys,
        total_deal_amount: sum > 0 ? sum : prev.total_deal_amount 
      };
    });
  };

  const updateRenewServiceQuantity = (serviceId, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setRenewFormData(prev => {
      const newQtys = { ...prev.service_quantities, [serviceId]: qty };
      const updatedIds = prev.selected_service_ids.includes(serviceId)
        ? prev.selected_service_ids
        : [...prev.selected_service_ids, serviceId];

      const sum = calculateDealPrice(updatedIds, prev.duration_months || 1, newQtys);

      return {
        ...prev,
        selected_service_ids: updatedIds,
        service_quantities: newQtys,
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
        services: formData.selected_service_ids.map(id => {
          const s = services.find(srv => srv.id === id);
          const qty = Math.max(1, Number(formData.service_quantities?.[id]) || 1);
          return {
            service_id: id,
            agreed_price: s ? Number(s.base_price) * qty : 0,
            quantity: qty
          };
        }),
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
        previous_deal_id: renewSourceDeal?.id,
        services: renewFormData.selected_service_ids.map(id => {
          const s = services.find(srv => srv.id === id);
          const qty = Math.max(1, Number(renewFormData.service_quantities?.[id]) || 1);
          return {
            service_id: id,
            agreed_price: s ? Number(s.base_price) * qty : 0,
            quantity: qty
          };
        }),
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
      if (historyModalDeal) {
        handleOpenClientHistory(historyModalDeal);
      }
    } catch (err) {
      alert('Failed to process deal renewal: ' + err.message);
    }
  };

  // Helper to compute live comparison between previous deal and renewal form
  const getRenewalComparison = () => {
    if (!renewSourceDeal) return null;
    const prevServices = renewSourceDeal.services || [];
    const prevQtys = {};
    prevServices.forEach(s => {
      prevQtys[s.service_id] = s.quantity || 1;
    });

    const diffs = [];
    (renewFormData.selected_service_ids || []).forEach(servId => {
      const s = (services || []).find(srv => srv.id === servId);
      const name = s ? s.name : 'Service';
      const newQty = Math.max(1, Number(renewFormData.service_quantities?.[servId]) || 1);
      const prevQty = prevQtys[servId];

      if (prevQty !== undefined) {
        const diff = newQty - prevQty;
        if (diff > 0) {
          diffs.push({ type: 'upgrade', text: `⬆️ ${name}: upgraded from ${prevQty} ➔ ${newQty} (+${diff})` });
        } else if (diff < 0) {
          diffs.push({ type: 'downgrade', text: `⬇️ ${name}: reduced from ${prevQty} ➔ ${newQty} (${diff})` });
        }
      } else {
        diffs.push({ type: 'added', text: `➕ Added new: ${name} (x${newQty})` });
      }
    });

    prevServices.forEach(ps => {
      if (!renewFormData.selected_service_ids.includes(ps.service_id)) {
        diffs.push({ type: 'removed', text: `❌ Removed: ${ps.service_name || 'Service'}` });
      }
    });

    const prevPrice = Number(renewSourceDeal.total_deal_amount || 0);
    const newPrice = Number(renewFormData.total_deal_amount || 0);
    const priceDiff = newPrice - prevPrice;

    return { diffs, priceDiff, prevPrice, newPrice };
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
    if (!closeModalDeal) return;

    if (closeModalDeal.pending_amount > 0) {
      alert(`Cannot close deal! Outstanding balance of ₹${(Number(closeModalDeal.pending_amount) || 0).toLocaleString('en-IN')} remains unpaid. Full payment is required before closing a client.`);
      return;
    }

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
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Handshake className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Client Deals & Receivables
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                GI CRM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 sm:line-clamp-none">
              Client Packages, Advance Tokens, Collections & Renewals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Export</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Deal</span>
          </button>
        </div>
      </div>

      {/* Overview Cards (4 Responsive Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Deals Value */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Total Deals Value
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <Handshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(totalDealValue)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {deals.length} total closed clients
            </p>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Total Received
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {totalDealValue > 0 ? ((totalCollected / totalDealValue) * 100).toFixed(0) : 0}% collected
            </p>
          </div>
        </div>

        {/* Active Collectibles */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Active Collectibles
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 truncate">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {activeCount} active retainers
            </p>
          </div>
        </div>

        {/* Lost / Bad Debt */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Lost / Bad Debt
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 truncate">
              {formatCurrency(totalLost)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {lostCount > 0 ? `${lostCount} default write-offs` : 'Zero bad debt'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client, company, phone, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('current')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'current'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show current active/latest contract per client"
            >
              <User className="w-3.5 h-3.5" />
              <span>Current Clients</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Show all contract cycles ever created"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Cycles</span>
            </button>
          </div>
        </div>

        {/* Horizontally Scrollable Status Chips (Zero Clipping on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1">
          {[
            { id: 'all', label: 'All Deals', count: deals.length },
            { id: 'active', label: 'Pending Active', count: activeCount },
            { id: 'completed', label: 'Closed & Paid', count: closedCount },
            { id: 'lost', label: 'Lost / Bad Debt', count: lostCount, isDanger: true },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                statusFilter === s.id
                  ? s.isDanger
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : s.isDanger && s.count > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === s.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}>
                {s.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Deals Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {loading ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading client deals & receivables...</p>
          </div>
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
                className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between border shadow-2xs transition-all ${
                  isLost
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : isClosed
                    ? 'bg-slate-50/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Bar: Client Avatar, Name & Status Badges */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                        isLost
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : isClosed
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {deal.client_name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                            {deal.client_name}
                          </h3>
                          {deal.company_name && (
                            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 truncate max-w-[140px]">
                              {deal.company_name}
                            </span>
                          )}

                          {/* Renewal Number / Cycle Badge */}
                          {deal.renewal_number > 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              Cycle {deal.renewal_number + 1}
                            </span>
                          ) : deal.client_total_cycles > 1 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              🌱 Initial
                            </span>
                          ) : null}

                          {deal.renewal_status === 'renewed' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Renewed
                            </span>
                          )}
                        </div>

                        {/* Contact & Date Details */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(deal.deal_date)}</span>
                          </span>
                          {deal.client_phone && (
                            <>
                              <span>•</span>
                              <a
                                href={`tel:${deal.client_phone}`}
                                className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                              >
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{deal.client_phone}</span>
                              </a>
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
                                className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:underline font-semibold"
                                title="Open Instagram Profile"
                              >
                                <AtSign className="w-3 h-3 text-pink-500 shrink-0" />
                                <span>{deal.insta_id.startsWith('@') || deal.insta_id.includes('/') ? deal.insta_id : `@${deal.insta_id}`}</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Duration Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shrink-0 flex items-center gap-1 ${
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
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Lost</span>
                          </>
                        ) : isClosed && isPaidInFull ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Fully Paid</span>
                          </>
                        ) : isClosed ? (
                          <>
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Closed</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Active</span>
                          </>
                        )}
                      </span>

                      {/* Contract Duration & Expiry Status */}
                      <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${
                        isExpiredPlan
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          : isExpiringSoon
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {durMonths} Mo • {daysRemaining > 0 ? `${daysRemaining}d left` : `Expired ${Math.abs(daysRemaining)}d ago`}
                      </span>
                    </div>
                  </div>

                  {/* Services Availed Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {deal.services && deal.services.length > 0 ? (
                      deal.services.map((s, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80 rounded-lg flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          <span>{s.service_name}</span>
                          {s.quantity > 1 && (
                            <span className="font-extrabold text-indigo-900 dark:text-indigo-100 bg-indigo-200/60 dark:bg-indigo-800/60 px-1 rounded text-[9px]">
                              x{s.quantity}
                            </span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">No specific service attached</span>
                    )}
                  </div>

                  {/* Financial Breakdown Progress Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/60 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase block">Deal Value</span>
                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{formatCurrency(deal.total_deal_amount)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase block">Received</span>
                        <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(deal.received_amount)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] uppercase block">
                          {isLost ? 'Lost Amount' : isClosed ? 'Final Balance' : 'Pending'}
                        </span>
                        <div className={`text-xs sm:text-sm font-black ${isLost ? 'text-rose-600 dark:text-rose-400' : isClosed && isPaidInFull ? 'text-slate-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {formatCurrency(deal.pending_amount)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
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
                    <p className={`text-xs p-2.5 rounded-xl border mb-3 whitespace-pre-line leading-relaxed ${
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

                {/* Structured Two-Tier Bottom Actions Bar */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  {/* Tier 1: Primary Lifecycle & Financial Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPaymentLedger(deal)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Payments ({deal.payments?.length || 0})</span>
                    </button>

                    {!isLost && (
                      <button
                        onClick={() => handleOpenRenew(deal)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                        title="Renew services or upgrade contract for next month"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Renew</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenClientHistory(deal)}
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all shadow-2xs group shrink-0"
                      title="View complete client lifecycle and history"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-[-30deg] transition-transform" />
                      <span className="hidden sm:inline">History</span>
                      {deal.client_total_cycles > 1 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 text-[10px] font-extrabold">
                          {deal.client_total_cycles}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tier 2: Documents & Record Actions */}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Proposal / Quote */}
                      <button
                        onClick={() => {
                          setProposalModalMode('proposal');
                          setProposalModalDeal(deal);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/80 text-[11px] font-bold transition-all shadow-2xs"
                        title="Generate Proposal & Quote PDF"
                      >
                        <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        <span>Quote</span>
                      </button>

                      {/* Invoice / Bill */}
                      <button
                        onClick={() => {
                          setProposalModalMode('invoice');
                          setProposalModalDeal(deal);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/80 text-[11px] font-bold transition-all shadow-2xs"
                        title="Generate Official Service Invoice PDF"
                      >
                        <Receipt className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        <span>Bill</span>
                      </button>

                      {/* Close Contract (When active) */}
                      {deal.status === 'active' && (
                        <button
                          onClick={() => handleOpenCloseModal(deal)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-all shadow-2xs"
                          title="Close contract (Client does not renew)"
                        >
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Close</span>
                        </button>
                      )}

                      {/* Restore (if lost) */}
                      {isLost && (
                        <button
                          onClick={() => handleRestoreDeal(deal)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold transition-all"
                          title="Restore this deal back to active receivables"
                        >
                          <Undo2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Mark as Lost Button (if pending amount exists & active) */}
                      {deal.pending_amount > 0 && deal.status === 'active' && (
                        <button
                          onClick={() => handleOpenMarkLost(deal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Mark as Lost / Defaulted Bad Debt"
                        >
                          <FileX2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEdit(deal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Deal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Delete Deal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                  const updatedSum = calculateDealPrice(formData.selected_service_ids, newDur, formData.service_quantities);
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
          {(formData.selected_service_ids || []).some(id => {
            const s = (services || []).find(srv => srv.id === id);
            return s && s.name && s.name.includes('Meta Ads');
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

          {/* Services Selector with Per-Service Quantity (Qty) Controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Services & Quantities (Select & set Qty per service)
              </label>
              <span className="text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                1 Mo Base Sum: {formatCurrency(calculateOneMonthSum(formData.selected_service_ids, formData.service_quantities))}
                {formData.duration_months > 1 && (
                  <span className="text-emerald-700 dark:text-emerald-300 ml-1.5">
                    × {formData.duration_months} Months = {formatCurrency(calculateDealPrice(formData.selected_service_ids, formData.duration_months, formData.service_quantities))}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {(services || []).map((serv) => {
                const isSelected = (formData.selected_service_ids || []).includes(serv.id);
                const currentQty = formData.service_quantities?.[serv.id] || 1;
                const servName = serv.name || '';
                const isQtyWise = (serv.pricing_type || 'month_wise') === 'qty_wise';

                return (
                  <div
                    key={serv.id}
                    onClick={() => toggleServiceSelection(serv.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-200 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleServiceSelection(serv.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                      />
                      <div className="truncate">
                        <p className="truncate font-semibold">{servName}</p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {formatCurrency(serv.base_price)} {isQtyWise ? '/ Unit' : '/ Mo'}
                        </p>
                      </div>
                    </div>

                    {isSelected && isQtyWise && (
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg p-0.5 shadow-2xs shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => updateServiceQuantity(serv.id, Math.max(1, currentQty - 1))}
                          className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Decrease Qty"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={currentQty}
                          onChange={(e) => updateServiceQuantity(serv.id, e.target.value)}
                          className="w-8 text-center text-xs font-black bg-transparent text-indigo-600 dark:text-indigo-400 focus:outline-none font-mono"
                          title="Service Quantity"
                        />
                        <button
                          type="button"
                          onClick={() => updateServiceQuantity(serv.id, currentQty + 1)}
                          className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Increase Qty"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {isSelected && !isQtyWise && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-md shrink-0">
                        📅 Month-wise
                      </span>
                    )}
                  </div>
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

            {closeModalDeal.pending_amount > 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs space-y-3">
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-extrabold text-sm text-amber-900 dark:text-amber-200">Full Payment Required to Close</p>
                    <p className="font-normal mt-1 text-amber-700 dark:text-amber-400">
                      This client contract cannot be closed because an outstanding balance of <strong className="font-bold text-amber-900 dark:text-amber-200">₹{(Number(closeModalDeal.pending_amount) || 0).toLocaleString('en-IN')}</strong> remains unpaid (Total Deal: ₹{(Number(closeModalDeal.total_deal_amount) || 0).toLocaleString('en-IN')}, Received: ₹{(Number(closeModalDeal.received_amount) || 0).toLocaleString('en-IN')}).
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = closeModalDeal;
                      setCloseModalDeal(null);
                      handleOpenPaymentLedger(d);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = closeModalDeal;
                      setCloseModalDeal(null);
                      handleOpenMarkLost(d);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1"
                  >
                    <FileX2 className="w-3.5 h-3.5" />
                    Mark as Lost / Bad Debt
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}

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
                disabled={closeModalDeal.pending_amount > 0}
                className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all ${
                  closeModalDeal.pending_amount > 0
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
                }`}
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

            {/* Previous Term Recap & Live Upgrade Comparison */}
            {(() => {
              const comp = getRenewalComparison();
              return (
                <div className="space-y-2">
                  {/* Previous Deliverables Recap */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      📦 Previous Term Services Availed:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {renewSourceDeal.services && renewSourceDeal.services.length > 0 ? (
                        renewSourceDeal.services.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                            {s.service_name} {s.quantity > 1 && `(x${s.quantity})`} • ₹{Number(s.agreed_price || 0).toLocaleString('en-IN')}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No previous service breakdown</span>
                      )}
                    </div>
                  </div>

                  {/* Live Comparison / Upgrade Alert */}
                  {comp && comp.diffs.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Scope & Upgrade Changes in this Renewal:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {comp.diffs.map((d, idx) => (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              d.type === 'upgrade' 
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' 
                                : d.type === 'added'
                                ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700'
                                : d.type === 'downgrade'
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {d.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Service & Plan Updation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Update Plan & Services for this New Term
                </label>
                <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Package Total: {formatCurrency(calculateDealPrice(renewFormData.selected_service_ids, renewFormData.duration_months || 1, renewFormData.service_quantities))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {services.map((serv) => {
                  const isSelected = renewFormData.selected_service_ids.includes(serv.id);
                  const currentQty = renewFormData.service_quantities?.[serv.id] || 1;
                  const isQtyWise = (serv.pricing_type || 'month_wise') === 'qty_wise';

                  return (
                    <div
                      key={serv.id}
                      onClick={() => toggleRenewServiceSelection(serv.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRenewServiceSelection(serv.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <div className="truncate">
                          <p className="truncate font-semibold">{serv.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {formatCurrency(serv.base_price)} {isQtyWise ? '/ Unit' : '/ Mo'}
                          </p>
                        </div>
                      </div>

                      {isSelected && isQtyWise && (
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg p-0.5 shadow-2xs shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => updateRenewServiceQuantity(serv.id, Math.max(1, currentQty - 1))}
                            className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Decrease Qty"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={currentQty}
                            onChange={(e) => updateRenewServiceQuantity(serv.id, e.target.value)}
                            className="w-8 text-center text-xs font-black bg-transparent text-emerald-600 dark:text-emerald-400 focus:outline-none font-mono"
                            title="Service Quantity"
                          />
                          <button
                            type="button"
                            onClick={() => updateRenewServiceQuantity(serv.id, currentQty + 1)}
                            className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Increase Qty"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {isSelected && !isQtyWise && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 rounded-md shrink-0">
                          📅 Month-wise
                        </span>
                      )}
                    </div>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{paymentLedgerDeal.client_name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
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
                <div className="flex flex-wrap items-center gap-1.5">
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

      {/* CLIENT LIFECYCLE & RENEWAL TIMELINE MODAL */}
      <Modal
        isOpen={Boolean(historyModalDeal)}
        onClose={() => {
          setHistoryModalDeal(null);
          setClientHistoryData(null);
        }}
        title="Client Lifecycle & Renewal History"
        maxWidth="max-w-4xl"
      >
        {historyModalDeal && (
          <div className="space-y-6">
            
            {/* Header: Client Identity & Lifetime Metrics */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center font-black text-xl text-white">
                    {historyModalDeal.client_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black">{historyModalDeal.client_name}</h3>
                      {historyModalDeal.company_name && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                          {historyModalDeal.company_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5 flex flex-wrap items-center gap-2">
                      {historyModalDeal.client_phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 opacity-80" /> {historyModalDeal.client_phone}
                        </span>
                      )}
                      {historyModalDeal.client_email && (
                        <span>• {historyModalDeal.client_email}</span>
                      )}
                      {historyModalDeal.insta_id && (
                        <>
                          <span>•</span>
                          <a
                            href={getInstaUrl(historyModalDeal.insta_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-300 hover:text-pink-200 underline font-semibold"
                          >
                            @{historyModalDeal.insta_id.replace(/^@/, '')}
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const d = historyModalDeal;
                    setHistoryModalDeal(null);
                    handleOpenRenew(d);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-sm transition-all active:scale-95 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  + Renew Next Cycle
                </button>
              </div>

              {/* Lifetime Metrics Strip */}
              {clientHistoryData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-2xs">
                    <span className="text-indigo-200 font-semibold block text-[11px]">Client Tenancy</span>
                    <div className="text-lg font-black mt-0.5">
                      {clientHistoryData.total_cycles} {clientHistoryData.total_cycles === 1 ? 'Cycle' : 'Cycles'}
                    </div>
                    <span className="text-[10px] text-indigo-300 font-medium">
                      {clientHistoryData.renewals_count} {clientHistoryData.renewals_count === 1 ? 'Renewal' : 'Renewals'} Completed
                    </span>
                  </div>

                  <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-2xs">
                    <span className="text-indigo-200 font-semibold block text-[11px]">Lifetime Value (LTV)</span>
                    <div className="text-lg font-black mt-0.5 text-indigo-100">
                      {formatCurrency(clientHistoryData.lifetime_deal_value)}
                    </div>
                    <span className="text-[10px] text-indigo-300 font-medium">Total Billed Across Terms</span>
                  </div>

                  <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-2xs">
                    <span className="text-emerald-200 font-semibold block text-[11px]">Total Paid (Collected)</span>
                    <div className="text-lg font-black mt-0.5 text-emerald-300">
                      {formatCurrency(clientHistoryData.lifetime_received)}
                    </div>
                    <span className="text-[10px] text-emerald-200/80 font-medium">Cash Inflow</span>
                  </div>

                  <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-2xs">
                    <span className="text-amber-200 font-semibold block text-[11px]">Pending Balance</span>
                    <div className={`text-lg font-black mt-0.5 ${clientHistoryData.lifetime_pending > 0 ? 'text-amber-300' : 'text-slate-300'}`}>
                      {formatCurrency(clientHistoryData.lifetime_pending)}
                    </div>
                    <span className="text-[10px] text-amber-200/80 font-medium">
                      {clientHistoryData.lifetime_pending > 0 ? 'Active Collectible' : 'All Settled'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Section */}
            {loadingHistory ? (
              <div className="py-16 text-center text-slate-400 font-medium">
                Loading complete client lifecycle and renewal records...
              </div>
            ) : clientHistoryData && clientHistoryData.timeline?.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Renewal & Deliverables Timeline ({clientHistoryData.timeline.length} Cycles)
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Chronological order (Earliest on top ➔ Latest active)
                  </span>
                </div>

                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900">
                  {clientHistoryData.timeline.map((term, idx) => {
                    const isLatest = idx === clientHistoryData.timeline.length - 1;
                    const isPaidFull = term.pending_amount <= 0;

                    return (
                      <div key={term.deal_id} className="relative group">
                        {/* Dot indicator on timeline */}
                        <div className={`absolute -left-6 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all ${
                          isLatest
                            ? 'bg-indigo-600 border-white dark:border-slate-900 text-white shadow-md scale-110 ring-4 ring-indigo-100 dark:ring-indigo-950'
                            : 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        }`}>
                          {term.cycle_number}
                        </div>

                        {/* Cycle Box */}
                        <div className={`rounded-2xl p-4 border transition-all ${
                          term.is_target
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-700 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}>
                          {/* Cycle Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                                term.is_initial 
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                {term.is_initial ? (
                                  <>🌱 Cycle 1: Initial Deal</>
                                ) : (
                                  <>🔁 Cycle {term.cycle_number}: Renewal #{term.renewal_number}</>
                                )}
                              </span>

                              {isLatest && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                  Current Term
                                </span>
                              )}

                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatDate(term.deal_date)} ({term.duration_months} Mo)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                term.status === 'lost'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : isPaidFull
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {term.status === 'lost' ? 'Lost Deal' : isPaidFull ? 'Paid in Full' : `Pending ₹${term.pending_amount.toLocaleString('en-IN')}`}
                              </span>
                              
                              {term.renewal_status === 'renewed' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  Renewed ➔
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Upgrades & Scope Adjustments Diff Pill Banner */}
                          {term.diffs && term.diffs.length > 0 && (
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                Upgrades & Scope Adjustments Compared to Cycle {term.cycle_number - 1}:
                              </span>
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {term.diffs.map((d, diffIdx) => (
                                  <span
                                    key={diffIdx}
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                                      d.type === 'upgrade'
                                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                                        : d.type === 'added'
                                        ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700'
                                        : d.type === 'downgrade'
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                                        : d.type === 'price_increase'
                                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {d.message}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Services in this cycle */}
                          <div className="mt-3">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                              Ordered Package & Deliverables:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {term.services && term.services.length > 0 ? (
                                term.services.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80 text-xs font-semibold flex items-center gap-1.5"
                                  >
                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                    <span>{s.service_name}</span>
                                    {s.quantity > 1 && (
                                      <span className="px-1.5 py-0.2 rounded bg-indigo-200/80 dark:bg-indigo-800/80 text-indigo-950 dark:text-indigo-100 font-black text-[10px]">
                                        x{s.quantity}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      (₹{Number(s.agreed_price || 0).toLocaleString('en-IN')})
                                    </span>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400 italic">No specific service items recorded</span>
                              )}
                            </div>
                          </div>

                          {/* Financials & Payments Strip */}
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400">Cycle Value:</span>
                              <div className="font-black text-slate-900 dark:text-white text-sm">
                                {formatCurrency(term.total_deal_amount)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400">Received:</span>
                              <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                {formatCurrency(term.received_amount)}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-400">Pending:</span>
                              <div className={`font-black text-sm ${term.pending_amount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                                {formatCurrency(term.pending_amount)}
                              </div>
                            </div>
                          </div>

                          {/* Payments breakdown in this cycle */}
                          {term.payments && term.payments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                              <span className="font-bold block text-slate-600 dark:text-slate-300">
                                💳 Payments Logged ({term.payments.length}):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {term.payments.map((p, pIdx) => (
                                  <span key={pIdx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                                    {formatDate(p.payment_date)}: <strong className="text-emerald-600">{formatCurrency(p.amount)}</strong> ({p.payment_mode})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cycle Notes */}
                          {term.notes && (
                            <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                              {term.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 font-medium">
                No past cycles found for this client.
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setHistoryModalDeal(null);
                  setClientHistoryData(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close History
              </button>
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
