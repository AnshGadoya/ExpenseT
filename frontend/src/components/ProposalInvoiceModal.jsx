import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  FileText, 
  Receipt, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  AtSign, 
  Sparkles,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Building2,
  Edit3
} from 'lucide-react';
import Modal from './Modal';
import { formatCurrency, formatDate } from '../utils/formatters';

const AGENCY_INFO = {
  name: 'Gandhi Infosol',
  subtitle: 'Digital Marketing | Branding | IT Solutions',
  tagline: 'Grow More, Grow Unique!',
  phone: '+91 70167 10141',
  email: 'gandhiinfosol@gmail.com',
  address: '318, Abhishek Arcade, Yogi Chawk, Surat - 395006',
  instagram: 'gandhi_infosol',
  instaUrl: 'https://instagram.com/gandhi_infosol'
};

const DEFAULT_TERMS = [
  'All content requires prior planning and approval to ensure brand alignment.',
  'Minimum Commitment: 1 Month.',
  'Payment Terms: 100% advance payment required prior to initiation of services.',
  'Advertising Expenditure: Meta Ads budget is separate and managed directly via client platform account.',
  'Production schedules for Reels/Shoots will be coordinated based on mutual convenience.'
];

export default function ProposalInvoiceModal({ isOpen, onClose, deal, mode = 'proposal', services = [] }) {
  const [docType, setDocType] = useState(mode); // 'proposal' or 'invoice'
  const [isEditingScope, setIsEditingScope] = useState(false);
  // Persist custom actual rates per deal ID in localStorage
  const [manualListPrices, setManualListPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('gandhi_deal_actual_rates');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const manualListPrice = deal && deal.id && manualListPrices[deal.id] !== undefined && manualListPrices[deal.id] !== '' 
    ? manualListPrices[deal.id] 
    : null;

  const setManualListPrice = (val) => {
    if (!deal || !deal.id) return;
    setManualListPrices(prev => {
      const updated = { ...prev, [deal.id]: val };
      try {
        localStorage.setItem('gandhi_deal_actual_rates', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Auto-calculate standard rate card total from selected services
  const autoStandardPrice = React.useMemo(() => {
    if (!deal) return 0;
    if (deal.services && deal.services.length > 0) {
      const dur = Number(deal.duration_months) || 1;
      let sum = 0;
      deal.services.forEach(s => {
        const master = services ? services.find(m => m.id === s.service_id) : null;
        const price = master ? Number(master.base_price || 0) : Number(s.agreed_price || s.base_price || 0);
        sum += price * dur;
      });
      return sum;
    }
    return Number(deal.total_deal_amount) || 0;
  }, [deal, services]);

  // Custom scope text overrides
  const [customIntroduction, setCustomIntroduction] = useState(
    'Gandhi Infosol specializes in elevating digital presence through high-performance marketing strategies. This proposal details a comprehensive framework designed to scale your brand authority and maximize ROI.'
  );

  const printRef = useRef(null);

  if (!deal) return null;

  const dealPrice = Number(deal.total_deal_amount) || 0;
  const listPrice = manualListPrice !== null ? Number(manualListPrice) : autoStandardPrice;
  const discountAmount = listPrice > dealPrice ? listPrice - dealPrice : 0;
  const discountPercent = listPrice > 0 ? Math.round((discountAmount / listPrice) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!deal.client_phone) {
      alert('Client phone number is not available.');
      return;
    }
    const cleanPhone = deal.client_phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    let message = '';
    if (docType === 'proposal') {
      const priceText = discountAmount > 0 
        ? `\n🏷️ *Standard List Rate:* ~${formatCurrency(listPrice)}~\n🔥 *Discounted Total Investment:* *${formatCurrency(dealPrice)}* (You Save ${formatCurrency(discountAmount)} - ${discountPercent}% OFF!)`
        : `\n💰 *Total Investment:* ${formatCurrency(dealPrice)}`;

      message = `Hello *${deal.client_name}* 👋,\n\nGreetings from *Gandhi Infosol*!\nHere is your *Digital Marketing Service Proposal & Quotation*:\n\n📌 *Client:* ${deal.client_name} ${deal.company_name ? `(${deal.company_name})` : ''}${priceText}\n📅 *Duration:* ${deal.duration_months || 1} Month(s)\n\nLooking forward to scaling your business digital presence!\n\nBest Regards,\n*Gandhi Infosol*\nSurat | ${AGENCY_INFO.phone}`;
    } else {
      message = `Hello *${deal.client_name}* 👋,\n\nHere is your official *Service Invoice & Bill* from *Gandhi Infosol*:\n\n🧾 *Invoice Date:* ${formatDate(deal.deal_date)}\n💰 *Total Amount:* ${formatCurrency(deal.total_deal_amount)}\n✅ *Received Amount:* ${formatCurrency(deal.received_amount)}\n⌛ *Pending Balance:* ${formatCurrency(deal.pending_amount)}\n\nThank you for choosing Gandhi Infosol!\n\nBest Regards,\n*Gandhi Infosol*\nPhone: ${AGENCY_INFO.phone}`;
    }
    
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Derive services list
  const servicesList = deal.services && deal.services.length > 0 ? deal.services : [
    { service_name: 'Digital Marketing & Social Media Management', agreed_price: deal.total_deal_amount }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={docType === 'proposal' ? '📄 Proposal & Quotation Generator' : '🧾 Service Invoice & Bill Generator'}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 print:hidden">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDocType('proposal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                docType === 'proposal'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Service Proposal / Quote
            </button>
            <button
              onClick={() => setDocType('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                docType === 'invoice'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Tax / Billing Invoice
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {docType === 'proposal' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Actual Rate Card (₹):</span>
                <input
                  type="number"
                  value={listPrice || ''}
                  onChange={(e) => setManualListPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="e.g. 7000"
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 font-mono"
                  title="Enter standard list rate before discount (e.g. Standard ₹7,000 vs Final ₹5,000)"
                />
                {discountAmount > 0 ? (
                  <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-in fade-in duration-200">
                    SAVE {formatCurrency(discountAmount)} ({discountPercent}% OFF)
                  </span>
                ) : listPrice > 0 && listPrice <= dealPrice ? (
                  <span className="text-[10px] font-medium text-slate-400 italic">
                    (Set &gt; {formatCurrency(dealPrice)} to show discount)
                  </span>
                ) : null}
              </div>
            )}

            <button
              onClick={() => setIsEditingScope(!isEditingScope)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingScope ? 'Done Editing' : 'Customize Intro'}
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all"
              title="Share document details via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div 
          ref={printRef}
          className="bg-white text-slate-900 p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-md printable-document max-w-3xl mx-auto space-y-6 font-sans"
        >
          
          {/* Document Header - Agency Banner */}
          <div className="border-b-2 border-indigo-600 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Gandhi Infosol Logo" className="w-12 h-12 rounded-xl object-cover shadow-xs border border-slate-200 shrink-0" />
              <div>
                <h1 className="text-2xl font-black tracking-tight text-indigo-950 uppercase">{AGENCY_INFO.name}</h1>
                <p className="text-xs font-bold text-indigo-600 tracking-wider uppercase">{AGENCY_INFO.subtitle}</p>
                <p className="text-[11px] italic text-slate-500 mt-0.5 font-medium">{AGENCY_INFO.tagline}</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-600 space-y-0.5">
              <p className="flex items-center justify-end gap-1 font-semibold text-slate-900">
                <Phone className="w-3 h-3 text-indigo-600" /> {AGENCY_INFO.phone}
              </p>
              <p className="flex items-center justify-end gap-1">
                <Mail className="w-3 h-3 text-indigo-600" /> {AGENCY_INFO.email}
              </p>
              <p className="flex items-center justify-end gap-1 text-[11px]">
                <MapPin className="w-3 h-3 text-indigo-600" /> {AGENCY_INFO.address}
              </p>
            </div>
          </div>

          {/* Document Title & Client Meta */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {docType === 'proposal' ? 'DIGITAL MARKETING PROPOSAL & QUOTATION' : 'OFFICIAL SERVICE INVOICE'}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Prepared For: <span className="text-indigo-950">{deal.client_name}</span>
                {deal.company_name && <span className="text-slate-600 text-sm font-normal"> ({deal.company_name})</span>}
              </h2>
              {deal.client_phone && (
                <p className="text-xs text-slate-600 font-mono mt-0.5">Phone: {deal.client_phone}</p>
              )}
            </div>

            <div className="text-right text-xs space-y-1">
              <p className="text-slate-500 font-medium">Date: <strong className="text-slate-900">{formatDate(deal.deal_date)}</strong></p>
              <p className="text-slate-500 font-medium">Contract Duration: <strong className="text-slate-900">{deal.duration_months || 1} Month(s)</strong></p>
              {deal.insta_id && (
                <p className="text-pink-600 font-semibold flex items-center justify-end gap-1">
                  <AtSign className="w-3 h-3" /> {deal.insta_id}
                </p>
              )}
            </div>
          </div>

          {/* SECTION I: INTRODUCTION (PROPOSAL MODE) */}
          {docType === 'proposal' && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-indigo-600 pl-2">
                I. INTRODUCTION
              </h3>
              {isEditingScope ? (
                <textarea
                  value={customIntroduction}
                  onChange={(e) => setCustomIntroduction(e.target.value)}
                  rows="3"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              ) : (
                <p className="text-xs leading-relaxed text-slate-700 font-normal">
                  {customIntroduction}
                </p>
              )}
            </div>
          )}

          {/* SECTION II: SERVICE PROPOSAL & SCOPE */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-indigo-600 pl-2">
              {docType === 'proposal' ? 'II. SERVICE PROPOSAL & DELIVERABLES' : 'SERVICE BILLING BREAKDOWN'}
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Service Deliverable</th>
                    <th className="py-2.5 px-3">Scope / Description</th>
                    <th className="py-2.5 px-3 text-right">Agreed Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {servicesList.map((srv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{srv.service_name || srv.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {srv.service_category || 'Comprehensive digital growth, content creation & social media management'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {srv.agreed_price ? formatCurrency(srv.agreed_price) : 'Included'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION III: INVESTMENT & BILLING SUMMARY */}
          {docType === 'proposal' ? (
            <div className={`rounded-xl p-4 border transition-all ${
              discountAmount > 0
                ? 'bg-gradient-to-r from-rose-50/80 via-slate-50 to-indigo-50/80 border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'
                : 'bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50 border-indigo-200 flex items-center justify-between'
            }`}>
              <div>
                {discountAmount > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                    <span>Standard Rate Card:</span>
                    <span className="line-through text-slate-400 font-bold font-mono">{formatCurrency(listPrice)}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                      SAVE {formatCurrency(discountAmount)} ({discountPercent}% OFF)
                    </span>
                  </div>
                )}
                <div>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${discountAmount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                    {discountAmount > 0 ? 'DISCOUNTED TOTAL INVESTMENT' : 'TOTAL INVESTMENT'}
                  </span>
                  <h4 className={`text-2xl sm:text-3xl font-black tracking-tight ${discountAmount > 0 ? 'text-rose-600' : 'text-indigo-950'}`}>
                    {formatCurrency(dealPrice)} <span className="text-xs font-semibold text-slate-600">/ month</span>
                  </h4>
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="text-right">
                  <span className="px-3 py-1 bg-rose-600 text-white font-black text-[11px] rounded-lg uppercase tracking-wider shadow-xs">
                    Exclusive Negotiated Deal
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Billing Overview Card */}
              <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-emerald-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Service Invoice Value
                  </p>
                  <h4 className="text-2xl font-black text-indigo-950 mt-0.5">
                    {formatCurrency(deal.total_deal_amount)}
                  </h4>
                </div>

                <div className="flex gap-4 text-right text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Advance Paid</span>
                    <p className="font-bold text-emerald-600 text-base">{formatCurrency(deal.received_amount || 0)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Remaining Due Balance</span>
                    <p className={`font-bold text-base ${deal.pending_amount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {formatCurrency(deal.pending_amount || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Advance Payment Receipts Breakdown Table */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-emerald-600 pl-2">
                  ADVANCE PAYMENT & RECEIPT BREAKDOWN
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-800">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Payment Mode</th>
                        <th className="py-2 px-3">Reference / Remarks</th>
                        <th className="py-2 px-3 text-right">Advance Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {deal.payments && deal.payments.length > 0 ? (
                        deal.payments.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold">{formatDate(p.payment_date)}</td>
                            <td className="py-2 px-3 font-mono">{p.payment_mode || 'UPI'}</td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">{p.reference_no || p.notes || 'Advance Payment'}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="py-2 px-3 font-semibold">{formatDate(deal.deal_date)}</td>
                          <td className="py-2 px-3 font-mono">UPI / Direct</td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">Advance token payment logged on booking</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600">{formatCurrency(deal.received_amount || 0)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan="3" className="py-2 px-3 text-slate-700">Total Advance Paid So Far:</td>
                        <td className="py-2 px-3 text-right text-emerald-600 text-sm">{formatCurrency(deal.received_amount || 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="py-2 px-3 text-slate-700">Remaining Balance Payable:</td>
                        <td className={`py-2 px-3 text-right text-sm ${deal.pending_amount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {formatCurrency(deal.pending_amount || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION IV: TERMS OF AGREEMENT */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-indigo-600 pl-2">
              {docType === 'proposal' ? 'III. TERMS OF AGREEMENT' : 'TERMS & CONDITIONS'}
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-700">
              {DEFAULT_TERMS.map((term, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION V: WHY PARTNER & CONTACT */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-900">Why Partner with Gandhi Infosol?</p>
              <p className="text-[11px] text-slate-500">Result-driven strategy • Integrated creative & performance marketing • Dedicated agency support.</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Authorized Signature</span>
              <p className="text-sm font-black text-slate-900 mt-1">Gandhi Infosol</p>
            </div>
          </div>

        </div>

      </div>

      {/* Embedded CSS for Print & PDF Page Layout */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-document, .printable-document * {
            visibility: visible !important;
          }
          .printable-document {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  );
}
