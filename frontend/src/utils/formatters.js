import * as XLSX from 'xlsx';

// Format number to Indian Rupee (₹)
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date into human readable string
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Today formatted as YYYY-MM-DD for date inputs
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to calculate auto column widths for XLSX sheets
function calculateColWidths(data, headers) {
  const colWidths = headers.map(h => ({ wch: Math.max(h.length + 4, 12) }));
  
  data.forEach(row => {
    headers.forEach((h, idx) => {
      const val = row[h] ? String(row[h]) : '';
      if (val.length + 4 > colWidths[idx].wch) {
        colWidths[idx].wch = Math.min(val.length + 4, 45); // cap max width at 45
      }
    });
  });

  return colWidths;
}

// Professional Multi-Sheet Excel Workbook Generator for Gandhi Infosol
export function exportProfessionalFinancialWorkbook({
  summary,
  expenses = [],
  deals = [],
  salaries = [],
  periodName = 'All Time',
  fileName = 'Gandhi_Infosol_Financial_Report'
}) {
  const workbook = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: EXECUTIVE SUMMARY & P&L
  // ==========================================
  const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDealVal = deals.reduce((sum, d) => sum + Number(d.total_deal_amount || 0), 0);
  const totalRec = deals.reduce((sum, d) => sum + Number(d.received_amount || 0), 0);
  const totalPend = deals.reduce((sum, d) => sum + Number(d.pending_amount || 0), 0);
  const netProf = (summary?.totalRevenue ?? totalRec) - (summary?.totalExpenses ?? totalExp);
  const margin = (summary?.totalRevenue ?? totalRec) > 0 
    ? (((netProf) / (summary?.totalRevenue ?? totalRec)) * 100).toFixed(1) + '%' 
    : '0%';

  const summaryRows = [
    { 'FINANCIAL OVERVIEW': 'COMPANY NAME', 'VALUE': 'GANDHI INFOSOL' },
    { 'FINANCIAL OVERVIEW': 'BUSINESS TYPE', 'VALUE': 'Digital Marketing & Media Solutions' },
    { 'FINANCIAL OVERVIEW': 'STATEMENT PERIOD', 'VALUE': periodName },
    { 'FINANCIAL OVERVIEW': 'REPORT GENERATED ON', 'VALUE': new Date().toLocaleString('en-IN') },
    { 'FINANCIAL OVERVIEW': '', 'VALUE': '' },
    { 'FINANCIAL OVERVIEW': '--- EXECUTIVE P&L SUMMARY ---', 'VALUE': '---' },
    { 'FINANCIAL OVERVIEW': 'Total Revenue Collected (Income)', 'VALUE': `₹${(summary?.totalRevenue ?? totalRec).toLocaleString('en-IN')}` },
    { 'FINANCIAL OVERVIEW': 'Total Operational Expenses', 'VALUE': `₹${(summary?.totalExpenses ?? totalExp).toLocaleString('en-IN')}` },
    { 'FINANCIAL OVERVIEW': 'Net Profit / (Loss)', 'VALUE': `₹${netProf.toLocaleString('en-IN')}` },
    { 'FINANCIAL OVERVIEW': 'Net Profit Margin', 'VALUE': margin },
    { 'FINANCIAL OVERVIEW': '', 'VALUE': '' },
    { 'FINANCIAL OVERVIEW': '--- DEALS & MARKET RECEIVABLES ---', 'VALUE': '---' },
    { 'FINANCIAL OVERVIEW': 'Total Closed Deal Value', 'VALUE': `₹${totalDealVal.toLocaleString('en-IN')}` },
    { 'FINANCIAL OVERVIEW': 'Total Collections Received', 'VALUE': `₹${totalRec.toLocaleString('en-IN')}` },
    { 'FINANCIAL OVERVIEW': 'Total Outstanding Pending Balance', 'VALUE': `₹${totalPend.toLocaleString('en-IN')}` },
    { 'FINANCIAL OVERVIEW': 'Total Deals Closed Count', 'VALUE': deals.length },
    { 'FINANCIAL OVERVIEW': 'Total Expense Entries Count', 'VALUE': expenses.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 38 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary & P&L');

  // ==========================================
  // SHEET 2: DAILY EXPENSES LOG
  // ==========================================
  const expenseHeaders = [
    'Date',
    'Category',
    'Description / Nature of Expense',
    'Paid To / Vendor',
    'Payment Mode',
    'Amount (₹)',
    'Receipt / Ref No.'
  ];

  const expenseData = expenses.map(e => ({
    'Date': e.expense_date,
    'Category': e.category_name || 'General',
    'Description / Nature of Expense': e.description,
    'Paid To / Vendor': e.paid_to || '-',
    'Payment Mode': e.payment_mode || 'UPI',
    'Amount (₹)': Number(e.amount || 0),
    'Receipt / Ref No.': e.receipt_no || '-',
  }));

  // Add a bold total summary row
  if (expenseData.length > 0) {
    expenseData.push({
      'Date': 'TOTAL',
      'Category': '---',
      'Description / Nature of Expense': `Total of ${expenses.length} expense entries`,
      'Paid To / Vendor': '---',
      'Payment Mode': '---',
      'Amount (₹)': totalExp,
      'Receipt / Ref No.': '---',
    });
  }

  const expensesSheet = XLSX.utils.json_to_sheet(expenseData, { header: expenseHeaders });
  expensesSheet['!cols'] = calculateColWidths(expenseData, expenseHeaders);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Daily Expenses');

  // ==========================================
  // SHEET 3: CLIENT DEALS & RECEIVABLES
  // ==========================================
  const dealHeaders = [
    'Deal Date',
    'Client Name',
    'Company / Brand',
    'Phone / WhatsApp',
    'Instagram Handle',
    'Services Included',
    'Total Deal Value (₹)',
    'Amount Received (₹)',
    'Pending Balance (₹)',
    'Status',
    'Deliverables / Remarks'
  ];

  const dealData = deals.map(d => ({
    'Deal Date': d.deal_date,
    'Client Name': d.client_name,
    'Company / Brand': d.company_name || '-',
    'Phone / WhatsApp': d.client_phone || '-',
    'Instagram Handle': d.insta_id || '-',
    'Services Included': d.services && d.services.length > 0 
      ? d.services.map(s => s.service_name).join(', ') 
      : '-',
    'Total Deal Value (₹)': Number(d.total_deal_amount || 0),
    'Amount Received (₹)': Number(d.received_amount || 0),
    'Pending Balance (₹)': Number(d.pending_amount || 0),
    'Status': d.status === 'completed' || d.pending_amount <= 0 ? 'Fully Paid' : 'Pending Balance',
    'Deliverables / Remarks': d.notes || '-',
  }));

  // Add total summary row
  if (dealData.length > 0) {
    dealData.push({
      'Deal Date': 'TOTALS',
      'Client Name': '---',
      'Company / Brand': '---',
      'Phone / WhatsApp': '---',
      'Instagram Handle': '---',
      'Services Included': `Total of ${deals.length} client deals`,
      'Total Deal Value (₹)': totalDealVal,
      'Amount Received (₹)': totalRec,
      'Pending Balance (₹)': totalPend,
      'Status': `${deals.filter(d => d.pending_amount <= 0).length} Paid / ${deals.filter(d => d.pending_amount > 0).length} Pending`,
      'Deliverables / Remarks': '---',
    });
  }

  const dealsSheet = XLSX.utils.json_to_sheet(dealData, { header: dealHeaders });
  dealsSheet['!cols'] = calculateColWidths(dealData, dealHeaders);
  XLSX.utils.book_append_sheet(workbook, dealsSheet, 'Client Deals & Receivables');

  // ==========================================
  // SHEET 4: GI TEAM SALARY PAYROLL
  // ==========================================
  if (salaries && salaries.length > 0) {
    const salaryHeaders = [
      'Payment Date',
      'Team Member',
      'Job Role',
      'Month / Period',
      'Payment Mode',
      'Amount (₹)',
      'Reference / Notes'
    ];

    const totalSalPaid = salaries.reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const salaryData = salaries.map(s => ({
      'Payment Date': s.payment_date,
      'Team Member': s.employee_name,
      'Job Role': s.job_role || '-',
      'Month / Period': s.month_year,
      'Payment Mode': s.payment_mode || 'GPay',
      'Amount (₹)': Number(s.amount || 0),
      'Reference / Notes': s.reference_no || s.notes || '-'
    }));

    salaryData.push({
      'Payment Date': 'TOTAL',
      'Team Member': '---',
      'Job Role': '---',
      'Month / Period': '---',
      'Payment Mode': '---',
      'Amount (₹)': totalSalPaid,
      'Reference / Notes': `Total of ${salaries.length} salary payments`
    });

    const salarySheet = XLSX.utils.json_to_sheet(salaryData, { header: salaryHeaders });
    salarySheet['!cols'] = calculateColWidths(salaryData, salaryHeaders);
    XLSX.utils.book_append_sheet(workbook, salarySheet, 'GI Team Payroll');
  }

  // ==========================================
  // WRITE FILE
  // ==========================================
  XLSX.writeFile(workbook, `${fileName}_${getTodayDateString()}.xlsx`);
}

// Simple single-sheet export helper if needed
export function exportToCSV(data, fileName = 'export') {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}_${getTodayDateString()}.xlsx`);
}
