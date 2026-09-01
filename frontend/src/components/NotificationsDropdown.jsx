import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function NotificationsDropdown({ 
  deals = [], 
  onRenewDeal, 
  onSelectDealForPayment,
  darkMode 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Close on outside click
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

  const handleDismiss = (notifId, e) => {
    e.stopPropagation();
    const updated = [...dismissedIds, notifId];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    const allIds = activeNotifications.map(n => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allIds]));
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
  };

  // Generate smart notifications from deals
  const generateNotifications = () => {
    const notifs = [];
    const now = new Date();

    deals.forEach((deal) => {
      if (!deal.deal_date) return;
      const startDate = new Date(deal.deal_date);
      const diffTime = Math.abs(now - startDate);
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const standardTermDays = 30; // standard 1-month retainer period
      const daysRemaining = standardTermDays - daysElapsed;

      // 1. Plan Expiring Soon (Between 24 and 30 days)
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        const notifId = `expiring_${deal.id}_${deal.deal_date}`;
        if (!dismissedIds.includes(notifId)) {
          notifs.push({
            id: notifId,
            deal,
            type: 'expiring_soon',
            priority: daysRemaining <= 2 ? 'high' : 'medium',
            title: daysRemaining === 0 ? 'Plan Ends Today!' : `Plan Expiring in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`,
            subtitle: `${deal.client_name} ${deal.company_name ? `(${deal.company_name})` : ''}`,
            description: `1-month digital marketing retainer is ending. Ask client to renew plan or upgrade service package.`,
            actionType: 'renew',
            dealDate: deal.deal_date,
          });
        }
      }

      // 2. Plan Expired / Retainer Overdue for Renewal (> 30 days)
      else if (daysElapsed > standardTermDays) {
        const notifId = `expired_${deal.id}_${deal.deal_date}`;
        if (!dismissedIds.includes(notifId)) {
          notifs.push({
            id: notifId,
            deal,
            type: 'expired',
            priority: 'high',
            title: `Retainer Renewal Due (${daysElapsed - standardTermDays}d ago)`,
            subtitle: `${deal.client_name} ${deal.company_name ? `(${deal.company_name})` : ''}`,
            description: `Contract completed on ${formatDate(new Date(startDate.getTime() + standardTermDays * 86400000).toISOString())}. Ready for next month continuation.`,
            actionType: 'renew',
            dealDate: deal.deal_date,
          });
        }
      }

      // 3. Significant Pending Receivables Balance Alert
      if (deal.pending_amount > 0 && daysElapsed >= 7) {
        const notifId = `payment_${deal.id}_${deal.pending_amount}`;
        if (!dismissedIds.includes(notifId)) {
          notifs.push({
            id: notifId,
            deal,
            type: 'pending_payment',
            priority: 'medium',
            title: `Pending Collection: ${formatCurrency(deal.pending_amount)}`,
            subtitle: `${deal.client_name} ${deal.company_name ? `(${deal.company_name})` : ''}`,
            description: `Out of ${formatCurrency(deal.total_deal_amount)} deal, balance ${formatCurrency(deal.pending_amount)} is still pending to collect.`,
            actionType: 'payment',
            dealDate: deal.deal_date,
          });
        }
      }
    });

    return notifs;
  };

  const activeNotifications = generateNotifications();
  const unreadCount = activeNotifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications & Plan Renewal Alerts"
        aria-label="Notifications"
        className={`relative p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Bell className="w-4 h-4" />
        
        {/* Animated Badge Count */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-black text-white items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          </>
        )}
      </button>

      {/* Flyout Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Plan Expiry & Renewal Alerts
              </h3>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {activeNotifications.length > 0 ? (
              activeNotifications.map((notif) => {
                const isExpiring = notif.type === 'expiring_soon';
                const isExpired = notif.type === 'expired';
                const isPayment = notif.type === 'pending_payment';

                return (
                  <div
                    key={notif.id}
                    className="p-3.5 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors flex flex-col gap-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isExpired 
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : isExpiring 
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          {notif.title}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(notif.id, e)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {notif.subtitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {notif.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> {formatDate(notif.dealDate)}
                      </span>

                      {notif.actionType === 'renew' ? (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onRenewDeal(notif.deal);
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Renew Plan Now
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onSelectDealForPayment(notif.deal);
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all active:scale-95"
                        >
                          <CreditCard className="w-3 h-3" />
                          Collect Balance
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 p-4">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All Plans & Retainers Up to Date!</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  No expiring plans or pending renewal follow-ups right now.
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Auto-tracks 30-day digital marketing client cycles
          </div>

        </div>
      )}

    </div>
  );
}
