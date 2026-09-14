import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bell, 
  RotateCcw, 
  CreditCard, 
  Check, 
  X, 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  DollarSign,
  AlertCircle,
  Coins,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function NotificationsDropdown({ 
  deals = [], 
  onRenewDeal, 
  onSelectDealForPayment,
  darkMode 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'renewal'
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Close on outside click (desktop)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Prevent background scroll on mobile when open
  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDismiss = (notifId, e) => {
    e.stopPropagation();
    const updated = [...dismissedIds, notifId];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    const allIds = allNotifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  // Generate smart notifications:
  // 1. Advance Payment & Remaining Balance Alerts (Generated IMMEDIATELY when deal is created if pending_amount > 0)
  // 2. Subscription Retainer Renewals (Near end of 30-day term or overdue)
  const allNotifications = useMemo(() => {
    const notifs = [];
    const now = new Date();

    if (!Array.isArray(deals)) return notifs;

    deals.forEach((deal) => {
      if (!deal.deal_date) return;
      // Skip closed or lost deals
      if (deal.status === 'lost' || deal.status === 'completed') return;

      const startDate = new Date(deal.deal_date);
      const diffTime = Math.max(0, now.getTime() - startDate.getTime());
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const standardTermDays = 30; // standard 1-month retainer period
      const daysRemaining = standardTermDays - daysElapsed;

      const received = Number(deal.received_amount) || 0;
      const total = Number(deal.total_deal_amount) || 0;
      const pending = Number(deal.pending_amount) || 0;

      // 1. IMMEDIATE PENDING ADVANCE / REMAINING BALANCE ALERT (Day 0 onwards)
      // Our services use advance payment, but we start services even if client hasn't paid full upfront.
      if (pending > 0) {
        const notifId = `pending_deal_${deal.id}_${pending}`;
        if (!dismissedIds.includes(notifId)) {
          if (received === 0) {
            // Subcase A: Zero Advance Received (Services started without token)
            notifs.push({
              id: notifId,
              deal,
              category: 'pending',
              type: 'zero_advance',
              priority: 'high',
              badge: 'NO ADVANCE PAID',
              title: `Advance Due: ${formatCurrency(total)}`,
              clientName: deal.client_name,
              companyName: deal.company_name,
              description: `Services started on ${formatDate(deal.deal_date)} (${daysElapsed === 0 ? 'Today' : `${daysElapsed}d ago`}) with zero advance. Follow up to collect initial token/advance.`,
              amountPending: pending,
              amountReceived: received,
              totalAmount: total,
              dealDate: deal.deal_date,
              daysElapsed,
              actionType: 'payment',
            });
          } else {
            // Subcase B: Partial Advance Received, Remaining Balance Pending
            notifs.push({
              id: notifId,
              deal,
              category: 'pending',
              type: 'partial_advance',
              priority: daysElapsed >= 7 ? 'high' : 'medium',
              badge: 'BALANCE PENDING',
              title: `Pending Balance: ${formatCurrency(pending)}`,
              clientName: deal.client_name,
              companyName: deal.company_name,
              description: `${formatCurrency(received)} advance received out of ${formatCurrency(total)}. Services are active — follow up to collect remaining ${formatCurrency(pending)}.`,
              amountPending: pending,
              amountReceived: received,
              totalAmount: total,
              dealDate: deal.deal_date,
              daysElapsed,
              actionType: 'payment',
            });
          }
        }
      }

      // 2. PLAN EXPIRING SOON (Last 7 days of 30-day subscription retainer)
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        const notifId = `expiring_${deal.id}_${deal.deal_date}`;
        if (!dismissedIds.includes(notifId)) {
          notifs.push({
            id: notifId,
            deal,
            category: 'renewal',
            type: 'expiring_soon',
            priority: daysRemaining <= 2 ? 'high' : 'medium',
            badge: daysRemaining === 0 ? 'ENDS TODAY' : `EXPIRES IN ${daysRemaining}D`,
            title: daysRemaining === 0 ? 'Retainer Plan Ends Today!' : `Retainer Expiring in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`,
            clientName: deal.client_name,
            companyName: deal.company_name,
            description: `1-month digital marketing retainer is completing. Contact client to renew or upgrade retainer package.`,
            dealDate: deal.deal_date,
            daysRemaining,
            actionType: 'renew',
          });
        }
      }

      // 3. PLAN EXPIRED / OVERDUE FOR RENEWAL (> 30 days)
      else if (daysElapsed > standardTermDays) {
        const notifId = `expired_${deal.id}_${deal.deal_date}`;
        if (!dismissedIds.includes(notifId)) {
          const overdueDays = daysElapsed - standardTermDays;
          notifs.push({
            id: notifId,
            deal,
            category: 'renewal',
            type: 'expired',
            priority: 'high',
            badge: `OVERDUE (${overdueDays}D AGO)`,
            title: `Retainer Renewal Overdue (${overdueDays}d)`,
            clientName: deal.client_name,
            companyName: deal.company_name,
            description: `Contract completed on ${formatDate(new Date(startDate.getTime() + standardTermDays * 86400000).toISOString())}. Ready for next month continuation.`,
            dealDate: deal.deal_date,
            daysElapsed,
            actionType: 'renew',
          });
        }
      }
    });

    // Sort: Zero advance & high priority first, then larger pending amount, then renewals
    return notifs.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      if (a.type === 'zero_advance' && b.type !== 'zero_advance') return -1;
      if (b.type === 'zero_advance' && a.type !== 'zero_advance') return 1;
      return (b.amountPending || 0) - (a.amountPending || 0);
    });
  }, [deals, dismissedIds]);

  // Counts for tabs
  const pendingCount = allNotifications.filter(n => n.category === 'pending').length;
  const renewalCount = allNotifications.filter(n => n.category === 'renewal').length;
  const totalCount = allNotifications.length;

  // Filtered list based on active tab
  const displayedNotifications = useMemo(() => {
    if (activeFilter === 'pending') {
      return allNotifications.filter(n => n.category === 'pending');
    }
    if (activeFilter === 'renewal') {
      return allNotifications.filter(n => n.category === 'renewal');
    }
    return allNotifications;
  }, [allNotifications, activeFilter]);

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications: Advance Collection & Retainer Alerts"
        aria-label="Notifications"
        className={`relative p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Bell className="w-4 h-4" />
        
        {/* Animated Badge Count */}
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-black text-white items-center justify-center">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          </span>
        )}
      </button>

      {/* Mobile Backdrop Overlay (Guarantees safe tap-outside and no background clicks) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Flyout Menu Dropdown (Fully Responsive: Pinned within viewport on mobile, anchored on desktop) */}
      {isOpen && (
        <div className="
          fixed left-3 right-3 top-16 max-h-[82vh] 
          sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[420px] 
          bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 
          z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150
        ">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Financial & Renewal Alerts
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {totalCount} active follow-up{totalCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {totalCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}

              {/* Close Button on Mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 sm:hidden cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Pending Balance ({pendingCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('renewal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'renewal'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Renewals ({renewalCount})</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1 overscroll-contain">
            {displayedNotifications.length > 0 ? (
              displayedNotifications.map((notif) => {
                const isZeroAdvance = notif.type === 'zero_advance';
                const isPartialAdvance = notif.type === 'partial_advance';
                const isExpired = notif.type === 'expired';
                const isExpiring = notif.type === 'expiring_soon';

                return (
                  <div
                    key={notif.id}
                    className="p-3.5 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors flex flex-col gap-2 group relative"
                  >
                    {/* Top Row: Badge & Dismiss */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isZeroAdvance
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : isPartialAdvance
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : isExpired
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          {notif.badge}
                        </span>

                        {notif.category === 'pending' && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notif.daysElapsed === 0 ? 'Started Today' : `${notif.daysElapsed}d running`}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleDismiss(notif.id, e)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Dismiss alert"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300 shrink-0">
                          {notif.clientName.charAt(0).toUpperCase()}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.clientName}
                          {notif.companyName && (
                            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                              ({notif.companyName})
                            </span>
                          )}
                        </h4>
                      </div>

                      <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 pt-0.5">
                        {notif.title}
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> {formatDate(notif.dealDate)}
                      </span>

                      {notif.actionType === 'renew' ? (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onRenewDeal(notif.deal);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Renew Plan</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onSelectDealForPayment(notif.deal);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                            isZeroAdvance
                              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isZeroAdvance ? 'Collect Advance' : 'Collect Balance'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 p-4 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeFilter === 'pending'
                    ? 'No Pending Balances!'
                    : activeFilter === 'renewal'
                    ? 'All Retainers Up to Date!'
                    : 'All Collections & Plans Up to Date!'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                  {activeFilter === 'pending'
                    ? 'All active clients have completed their payments in full.'
                    : activeFilter === 'renewal'
                    ? 'No expiring retainers or pending renewals right now.'
                    : 'No pending advance collections or overdue subscription renewals.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
            Real-time advance payment tracking & 30-day client retainer cycle alerts
          </div>

        </div>
      )}

    </div>
  );
}

