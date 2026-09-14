import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  IndianRupee,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Check,
  AlertCircle,
  Clock,
  CreditCard,
  Grid,
  List,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';
import Modal from './Modal';

const JOB_ROLES = [
  'Graphics',
  'Video Shoot/Editor',
  'Meta Ads',
  'Sales',
  'Model Shoot',
  'Website Developer',
  'AI Video Create',
  'Content Writer',
  'Account Manager',
  'Other'
];

const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate years list: past years (2023+) up to future (2032+)
const generateYearList = () => {
  const currentYear = new Date().getFullYear();
  const start = Math.min(2023, currentYear - 3);
  const end = Math.max(2030, currentYear + 4);
  const years = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
};

export default function SalaryView({ darkMode }) {
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'list'
  const [mobileMatrixView, setMobileMatrixView] = useState('cards'); // 'cards' or 'table' on mobile

  // Standard Financial Year (April - March) State
  const currentFiscalYear = useMemo(() => {
    const now = new Date();
    return now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  }, []);

  const [selectedYear, setSelectedYear] = useState(currentFiscalYear);
  const selectedCycle = 'april'; // Standard Indian Financial Year (Apr - Mar)

  const [matrixData, setMatrixData] = useState({
    months: [],
    matrix: [],
    availableYears: []
  });
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'Active' or 'Leave'
  const [historyYearFilter, setHistoryYearFilter] = useState('all');

  // Modals state
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    job_role: 'Graphics',
    monthly_salary: '',
    status: 'Active',
    phone: '',
    email: '',
    notes: ''
  });

  // Active current month string (e.g. "September 2026")
  const currentActiveMonthYear = useMemo(() => {
    const now = new Date();
    return `${ALL_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }, []);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    employee_id: '',
    month_name: ALL_MONTHS[new Date().getMonth()],
    year_num: new Date().getFullYear(),
    month_year: currentActiveMonthYear,
    amount: '',
    leave_days: '',
    working_days: 30,
    payment_date: getTodayDateString(),
    payment_mode: 'GPay',
    reference_no: '',
    notes: ''
  });

  // Track expanded cards on mobile for payouts
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCardExpanded = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Selected employee for payment modal
  const selectedPayEmp = useMemo(() => {
    if (!payForm.employee_id) return null;
    return employees.find(e => String(e.id) === String(payForm.employee_id)) || null;
  }, [employees, payForm.employee_id]);

  // Handle leave deduction auto calculation
  const handleLeaveDaysChange = (days, empId, currentWorkingDays = payForm.working_days) => {
    const leaveDaysNum = Math.max(0, Number(days) || 0);
    const targetEmpId = empId !== undefined ? empId : payForm.employee_id;
    const selectedEmp = employees.find(e => String(e.id) === String(targetEmpId));
    const baseSalary = Number(selectedEmp?.monthly_salary || 0);
    const totalDays = Math.max(1, Number(currentWorkingDays || 30));
    
    if (baseSalary > 0) {
      const perDayRate = baseSalary / totalDays;
      const deduction = Math.round(perDayRate * leaveDaysNum);
      const netSalary = Math.max(0, Math.round(baseSalary - deduction));

      let autoRemark = `Salary payout for ${selectedEmp?.name || ''} (${payForm.month_year})`;
      if (leaveDaysNum > 0) {
        autoRemark += ` (${leaveDaysNum} days unpaid leave: -₹${deduction.toLocaleString('en-IN')})`;
      }

      setPayForm(prev => ({
        ...prev,
        leave_days: days,
        amount: netSalary,
        notes: autoRemark
      }));
    } else {
      setPayForm(prev => ({
        ...prev,
        leave_days: days
      }));
    }
  };

  // Load all data for selected Year and Cycle
  const loadData = async (year = selectedYear, cycle = selectedCycle) => {
    setLoading(true);
    try {
      const [matrixRes, empRes, salRes] = await Promise.all([
        api.getSalaryMatrix({ year, cycle }).catch(() => ({ months: [], matrix: [], availableYears: [] })),
        api.getEmployees().catch(() => []),
        api.getSalaries().catch(() => [])
      ]);

      setMatrixData(matrixRes && Array.isArray(matrixRes.matrix) ? matrixRes : { months: [], matrix: [], availableYears: [] });
      setEmployees(Array.isArray(empRes) ? empRes : []);
      setSalaries(Array.isArray(salRes) ? salRes : []);
    } catch (err) {
      console.error('Failed to load salary data:', err);
      setEmployees([]);
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    loadData(selectedYear, selectedCycle);
  }, [selectedYear, selectedCycle]);

  // Year switcher handlers
  const handlePrevYear = () => {
    setSelectedYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setSelectedYear(prev => prev + 1);
  };

  const handleResetToCurrentYear = () => {
    const currentY = new Date().getFullYear();
    setSelectedYear(currentY);
  };

  // Quick toggle status between Active and Leave directly
  const handleToggleStatus = async (emp, newStatus) => {
    try {
      await api.updateEmployee(emp.id, {
        ...emp,
        status: newStatus
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add or Edit Employee Submit
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    if (!empForm.name.trim()) return;

    try {
      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, empForm);
      } else {
        await api.createEmployee(empForm);
      }
      setIsAddEmpOpen(false);
      setEditingEmp(null);
      setEmpForm({
        name: '',
        job_role: 'Graphics',
        monthly_salary: '',
        status: 'Active',
        phone: '',
        email: '',
        notes: ''
      });
      loadData();
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditEmp = (emp) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      job_role: emp.job_role || 'Graphics',
      monthly_salary: emp.monthly_salary || '',
      status: emp.status || 'Active',
      phone: emp.phone || '',
      email: emp.email || '',
      notes: emp.notes || ''
    });
    setIsAddEmpOpen(true);
  };

  const handleDeleteEmp = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove team member "${name}"?`)) return;
    try {
      await api.deleteEmployee(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Check if selected employee already received salary for selected month_year
  const existingPaidEntry = useMemo(() => {
    if (!payForm.employee_id || !payForm.month_year) return null;
    return (salaries || []).find(
      s => String(s.employee_id) === String(payForm.employee_id) && s.month_year === payForm.month_year
    );
  }, [payForm.employee_id, payForm.month_year, salaries]);

  // Update Pay Modal Month or Year
  const updatePayModalMonthYear = (newMonth, newYear) => {
    const updatedMonth = newMonth !== undefined ? newMonth : payForm.month_name;
    const updatedYear = newYear !== undefined ? Number(newYear) : payForm.year_num;
    const combinedMonthYear = `${updatedMonth} ${updatedYear}`;

    setPayForm(prev => {
      const emp = employees.find(e => String(e.id) === String(prev.employee_id));
      const leaveDays = Math.max(0, Number(prev.leave_days || 0));
      const baseSalary = Number(emp?.monthly_salary || 0);
      const totalDays = Math.max(1, Number(prev.working_days || 30));
      const deduction = Math.round((baseSalary / totalDays) * leaveDays);

      return {
        ...prev,
        month_name: updatedMonth,
        year_num: updatedYear,
        month_year: combinedMonthYear,
        notes: leaveDays > 0
          ? `Salary payout for ${emp?.name || ''} (${combinedMonthYear}) (${leaveDays} days unpaid leave: -₹${deduction.toLocaleString('en-IN')})`
          : `Salary payout for ${emp?.name || ''} (${combinedMonthYear})`
      };
    });
  };

  // Set Pay Modal to quick preset (Previous Month, Current Month, Next Month)
  const setQuickPresetMonth = (preset) => {
    const now = new Date();
    let targetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (preset === 'prev') {
      targetDate.setMonth(targetDate.getMonth() - 1);
    } else if (preset === 'next') {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    const m = ALL_MONTHS[targetDate.getMonth()];
    const y = targetDate.getFullYear();
    updatePayModalMonthYear(m, y);
  };

  // Pay Salary Submit
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payForm.employee_id || !payForm.amount || !payForm.month_year) return;

    if (existingPaidEntry) {
      const empName = selectedPayEmp?.name || 'this employee';
      alert(`⚠️ Validation Error: Salary for ${empName} for ${payForm.month_year} has ALREADY been paid (₹${Number(existingPaidEntry.amount).toLocaleString('en-IN')}).\n\nDouble payments for the same month are not allowed.`);
      return;
    }

    try {
      await api.recordSalaryPayment(payForm);
      setIsPayModalOpen(false);
      setPayForm({
        employee_id: '',
        month_name: ALL_MONTHS[new Date().getMonth()],
        year_num: new Date().getFullYear(),
        month_year: currentActiveMonthYear,
        amount: '',
        leave_days: '',
        working_days: 30,
        payment_date: getTodayDateString(),
        payment_mode: 'GPay',
        reference_no: '',
        notes: ''
      });
      loadData();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Quick Pay Modal prefilled with employee and specific month
  const handleOpenQuickPay = (empId, targetMonthYear, defaultAmount) => {
    const selectedEmp = employees.find(e => String(e.id) === String(empId));
    
    // Parse target month & year
    let mName = ALL_MONTHS[new Date().getMonth()];
    let yNum = new Date().getFullYear();
    if (targetMonthYear) {
      const parts = targetMonthYear.trim().split(' ');
      if (parts.length >= 2) {
        mName = parts[0];
        yNum = Number(parts[1]) || yNum;
      }
    }

    const combined = `${mName} ${yNum}`;

    setPayForm({
      employee_id: String(empId),
      month_name: mName,
      year_num: yNum,
      month_year: combined,
      amount: defaultAmount !== undefined ? defaultAmount : (selectedEmp?.monthly_salary || ''),
      leave_days: '',
      working_days: 30,
      payment_date: getTodayDateString(),
      payment_mode: 'GPay',
      reference_no: '',
      notes: `Salary payout for ${selectedEmp?.name || ''} (${combined})`
    });
    setIsPayModalOpen(true);
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary payment record?')) return;
    try {
      await api.deleteSalaryPayment(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter matrix rows
  const filteredMatrix = useMemo(() => {
    return (matrixData.matrix || []).filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.job_role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter ? row.job_role === roleFilter : true;
      const matchesStatus = statusFilter ? row.status === statusFilter : true;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [matrixData.matrix, searchTerm, roleFilter, statusFilter]);

  // Filter salary payment history
  const filteredHistory = useMemo(() => {
    return (salaries || []).filter((sal) => {
      if (historyYearFilter !== 'all') {
        if (!sal.month_year.includes(String(historyYearFilter))) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const empName = (sal.employee_name || '').toLowerCase();
        const role = (sal.job_role || '').toLowerCase();
        const ref = (sal.reference_no || '').toLowerCase();
        return empName.includes(term) || role.includes(term) || ref.includes(term);
      }
      return true;
    });
  }, [salaries, historyYearFilter, searchTerm]);

  // Calculate totals
  const totalMembers = employees.length;
  const activeMembers = employees.filter(e => e.status === 'Active').length;
  const leaveMembers = employees.filter(e => e.status === 'Leave').length;

  // Monthly active commitment
  const totalMonthlyBudget = useMemo(() => {
    return employees
      .filter(e => e.status === 'Active')
      .reduce((sum, e) => sum + (Number(e.monthly_salary) || 0), 0);
  }, [employees]);

  // Total paid in the currently selected 12-month period
  const totalSelectedYearPaid = useMemo(() => {
    const months = matrixData.months || [];
    return (salaries || [])
      .filter(s => months.includes(s.month_year))
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [salaries, matrixData.months]);

  // Total all-time paid across all years
  const totalAllTimePaid = useMemo(() => {
    return salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [salaries]);

  // Monthly totals for table footer
  const monthSums = useMemo(() => {
    const months = matrixData.months || [];
    const sums = {};
    months.forEach(m => {
      sums[m] = (matrixData.matrix || []).reduce((acc, row) => {
        const amt = row.monthly_payouts?.[m]?.amount || 0;
        return acc + Number(amt);
      }, 0);
    });
    return sums;
  }, [matrixData]);

  // Available years list for selectors
  const yearsList = useMemo(() => {
    const generated = generateYearList();
    if (matrixData.availableYears && matrixData.availableYears.length > 0) {
      const dbYears = matrixData.availableYears.map(y => y.year);
      return Array.from(new Set([...generated, ...dbYears])).sort((a, b) => a - b);
    }
    return generated;
  }, [matrixData.availableYears]);

  // Format short label for year cycle (e.g. "FY 2026-27" or "2026")
  // Format short label for Indian Financial Year (April – March)
  const periodDisplayLabel = useMemo(() => {
    return `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)} (Apr '` + String(selectedYear).slice(-2) + ` – Mar '` + String(selectedYear + 1).slice(-2) + `)`;
  }, [selectedYear]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Team & Salary
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Payroll Matrix
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1 sm:line-clamp-none">
              Unlimited Historical & Future Payroll Sheets, Leave Deduction & Status Matrix
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => {
              setEditingEmp(null);
              setEmpForm({
                name: '',
                job_role: 'Graphics',
                monthly_salary: '',
                status: 'Active',
                phone: '',
                email: '',
                notes: ''
              });
              setIsAddEmpOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>

          <button
            onClick={() => {
              const firstEmp = employees[0];
              const now = new Date();
              const mName = ALL_MONTHS[now.getMonth()];
              const yNum = now.getFullYear();
              const comb = `${mName} ${yNum}`;

              setPayForm({
                employee_id: firstEmp?.id ? String(firstEmp.id) : '',
                month_name: mName,
                year_num: yNum,
                month_year: comb,
                amount: firstEmp?.monthly_salary || '',
                leave_days: '',
                working_days: 30,
                payment_date: getTodayDateString(),
                payment_mode: 'GPay',
                reference_no: '',
                notes: firstEmp ? `Salary payout for ${firstEmp.name} (${comb})` : ''
              });
              setIsPayModalOpen(true);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl shadow-sm shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
          >
            <IndianRupee className="w-4 h-4" />
            <span>Pay Salary</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Total Team Members */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Team
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {totalMembers}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {activeMembers} Active
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {leaveMembers > 0 ? `${leaveMembers} Left Company` : 'All members active'}
            </p>
          </div>
        </div>

        {/* Monthly Active Commitment */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Budget
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyBudget)}
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Active monthly payroll liability
            </p>
          </div>
        </div>

        {/* Total Disbursed in Selected Year */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Year Payouts ({selectedYear})
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSelectedYearPaid)}
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Disbursed in {periodDisplayLabel}
            </p>
          </div>
        </div>

        {/* All-Time Disbursed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              All-Time Paid
            </span>
            <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(totalAllTimePaid)}
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {salaries.length} total payout transactions
            </p>
          </div>
        </div>

      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        {/* ========================================================================= */}
        {/* FINANCIAL YEAR (APR - MAR) SELECTOR TOOLBAR                               */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Financial Year Navigator */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                onClick={handlePrevYear}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Previous Financial Year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer pr-1"
                >
                  {yearsList.map((y) => (
                    <option key={y} value={y} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                      FY {y}-{String(y + 1).slice(-2)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextYear}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Next Financial Year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Jump to Current Year Pill */}
            {selectedYear !== currentFiscalYear && (
              <button
                onClick={() => setSelectedYear(currentFiscalYear)}
                className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Jump to Current (FY {currentFiscalYear}-{String(currentFiscalYear + 1).slice(-2)})</span>
              </button>
            )}

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
              • {matrixData.months.length} Months (Apr '{(String(selectedYear)).slice(-2)} – Mar '{(String(selectedYear + 1)).slice(-2)})
            </span>
          </div>

          {/* Right: Permanent Standard Financial Year Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Financial Year: April – March</span>
            </div>
          </div>

        </div>

        {/* View Toggle Bar (Matrix vs History & Filters) */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          
          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Matrix Sheet</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>History & Team ({salaries.length})</span>
              </button>
            </div>

            {/* Mobile View Toggle (Cards vs Table) for Matrix view */}
            {viewMode === 'matrix' && (
              <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setMobileMatrixView('cards')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    mobileMatrixView === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setMobileMatrixView('table')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    mobileMatrixView === 'table'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Sheet
                </button>
              </div>
            )}
          </div>

          {/* Search & Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial min-w-[140px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-medium transition-colors cursor-pointer"
            >
              <option value="">All Roles</option>
              {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-medium transition-colors cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Leave">Left Company</option>
            </select>
          </div>

        </div>

        {/* View Content */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading Team & Salary Sheet for {periodDisplayLabel}...</p>
          </div>
        ) : viewMode === 'matrix' ? (
          <div>
            
            {/* ========================================================================= */}
            {/* MOBILE CARDS VIEW (Clean, Responsive, Touch-Friendly for <768px)          */}
            {/* ========================================================================= */}
            <div className={`${mobileMatrixView === 'cards' ? 'block md:hidden' : 'hidden'} p-3 space-y-3`}>
              {filteredMatrix.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  No team members match the search filters.
                </div>
              ) : (
                filteredMatrix.map((emp) => {
                  const isLeave = emp.status === 'Leave';
                  const isExpanded = Boolean(expandedCards[emp.id]);
                  const monthsList = matrixData.months || [];
                  
                  // Count how many months paid in this year
                  const paidMonthsCount = monthsList.filter(m => (emp.monthly_payouts?.[m]?.amount || 0) > 0).length;

                  return (
                    <div
                      key={emp.id}
                      className={`bg-white dark:bg-slate-900/90 border rounded-2xl p-3.5 transition-all shadow-2xs ${
                        isLeave
                          ? 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Card Header: Avatar, Name, Status Pill & Quick Actions */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isLeave
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                {emp.name}
                              </h3>
                              <select
                                value={emp.status}
                                onChange={(e) => handleToggleStatus(emp, e.target.value)}
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border outline-none cursor-pointer ${
                                  isLeave
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                <option value="Active">Active</option>
                                <option value="Leave">Left Co.</option>
                              </select>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {emp.job_role}
                            </p>
                          </div>
                        </div>

                        {/* Edit & Delete quick buttons */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => handleOpenEditEmp(emp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmp(emp.id, emp.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Salary & Payouts Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Monthly Salary
                          </span>
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {emp.monthly_salary > 0 ? formatCurrency(emp.monthly_salary) : '—'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              // Default to current month or first unpaid month in the year
                              const unpaidMonth = monthsList.find(m => !(emp.monthly_payouts?.[m]?.amount > 0)) || monthsList[0] || currentActiveMonthYear;
                              handleOpenQuickPay(emp.id, unpaidMonth, emp.monthly_salary);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <IndianRupee className="w-3 h-3" />
                            <span>Pay Salary</span>
                          </button>

                          <button
                            onClick={() => toggleCardExpanded(emp.id)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <span>{paidMonthsCount}/{monthsList.length}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable 12-Month Payroll Grid */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              {selectedYear} Payout Status
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Tap month to pay or view
                            </span>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                            {monthsList.map((monthName) => {
                              const payout = emp.monthly_payouts?.[monthName];
                              const paidAmount = payout?.amount || 0;
                              const isPaid = paidAmount > 0;
                              
                              const [mPart, yPart] = monthName.split(' ');
                              const shortMonth = `${mPart.slice(0, 3)} '${(yPart || '').slice(-2)}`;

                              return (
                                <button
                                  key={monthName}
                                  onClick={() => handleOpenQuickPay(emp.id, monthName, emp.monthly_salary)}
                                  className={`p-1.5 rounded-lg text-left transition-all border cursor-pointer ${
                                    isPaid
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-indigo-300'
                                  }`}
                                >
                                  <div className="text-[10px] font-extrabold truncate">{shortMonth}</div>
                                  <div className="text-[11px] font-black truncate flex items-center gap-0.5">
                                    {isPaid ? (
                                      <>
                                        <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                        <span>₹{paidAmount >= 1000 ? `${(paidAmount / 1000).toFixed(paidAmount % 1000 === 0 ? 0 : 1)}k` : paidAmount}</span>
                                      </>
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-400">+ Pay</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ========================================================================= */}
            {/* FULL SPREADSHEET MATRIX TABLE (Desktop default + mobile toggle option)      */}
            {/* ========================================================================= */}
            <div className={`${mobileMatrixView === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto relative max-h-[650px] scrollbar-thin`}>
              <table className="w-full text-left border-collapse text-xs">
                
                {/* Sticky Table Header */}
                <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 sticky top-0 z-20 shadow-xs backdrop-blur-md">
                  <tr>
                    <th className="p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold w-12 text-center sticky left-0 bg-slate-100 dark:bg-slate-800 z-30">
                      No.
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold min-w-[170px] sticky left-12 bg-slate-100 dark:bg-slate-800 z-30 shadow-r">
                      Name
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold min-w-[140px]">
                      Job Role
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold min-w-[110px] text-right">
                      Monthly Salary
                    </th>
                    <th className="p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold min-w-[100px] text-center">
                      Status
                    </th>

                    {/* Dynamic Month Columns for selected period */}
                    {(matrixData.months || []).map((month) => {
                      const isCurrent = month === currentActiveMonthYear;
                      const [mPart, yPart] = month.split(' ');
                      const shortMonth = `${mPart.slice(0, 3)} '${(yPart || '').slice(-2)}`;

                      return (
                        <th
                          key={month}
                          className={`p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold text-center min-w-[110px] whitespace-nowrap ${
                            isCurrent
                              ? 'bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{shortMonth}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                                Active
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {filteredMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={5 + (matrixData.months || []).length} className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">
                        No team members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrix.map((emp, idx) => {
                      const isLeave = emp.status === 'Leave';
                      return (
                        <tr
                          key={emp.id}
                          className={`group transition-colors ${
                            isLeave
                              ? 'bg-slate-50/80 dark:bg-slate-900/40 opacity-75'
                              : 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20'
                          }`}
                        >
                          {/* Sr No */}
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center font-bold text-slate-400 sticky left-0 bg-white dark:bg-slate-900 z-10">
                            {idx + 1}
                          </td>

                          {/* Name */}
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white sticky left-12 bg-white dark:bg-slate-900 z-10 shadow-r flex items-center justify-between gap-1">
                            <span className="truncate">{emp.name}</span>
                            <button
                              onClick={() => handleOpenEditEmp(emp)}
                              title="Edit Employee details"
                              className="opacity-0 group-hover:opacity-100 hover:text-indigo-600 text-slate-400 p-1 transition-opacity cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </td>

                          {/* Job Role */}
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                              {emp.job_role}
                            </span>
                          </td>

                          {/* Monthly Base Remuneration */}
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-bold text-slate-900 dark:text-slate-100">
                            {emp.monthly_salary > 0 ? formatCurrency(emp.monthly_salary) : '—'}
                          </td>

                          {/* Interactive Status Dropdown (Active vs Leave) */}
                          <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-center">
                            <select
                              value={emp.status}
                              onChange={(e) => handleToggleStatus(emp, e.target.value)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold outline-none cursor-pointer border ${
                                isLeave
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Leave">Left Company</option>
                            </select>
                          </td>

                          {/* Monthly Salary Cells */}
                          {(matrixData.months || []).map((monthName) => {
                            const payout = emp.monthly_payouts?.[monthName];
                            const paidAmount = payout?.amount || 0;
                            const isPaid = paidAmount > 0;

                            return (
                              <td
                                key={monthName}
                                className="p-2 border-r border-slate-200 dark:border-slate-800 text-center align-middle"
                              >
                                {isPaid ? (
                                  <button
                                    onClick={() => handleOpenQuickPay(emp.id, monthName, emp.monthly_salary)}
                                    title={`Paid ₹${paidAmount} for ${monthName}. Tap to view or edit details.`}
                                    className="w-full px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-[11px] hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>₹{paidAmount >= 1000 ? `${(paidAmount / 1000).toFixed(paidAmount % 1000 === 0 ? 0 : 1)}k` : paidAmount}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenQuickPay(emp.id, monthName, emp.monthly_salary)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer"
                                  >
                                    + Pay
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer with Monthly Totals */}
                <tfoot className="bg-slate-100/90 dark:bg-slate-800/90 font-extrabold border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-20 backdrop-blur-md">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-black text-slate-800 dark:text-slate-200 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 shadow-r">
                      Total Disbursed
                    </td>
                    <td className="p-3 text-right font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(totalMonthlyBudget)}
                    </td>
                    <td className="p-3 text-center text-slate-400">—</td>
                    {(matrixData.months || []).map((m) => {
                      const totalM = monthSums[m] || 0;
                      return (
                        <td key={m} className="p-3 text-center font-black text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-700/70">
                          {totalM > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ₹{totalM >= 1000 ? `${(totalM / 1000).toFixed(totalM % 1000 === 0 ? 0 : 1)}k` : totalM}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">₹0</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        ) : (
          
          /* ========================================================================= */
          /* LIST VIEW: Directory & Complete Payment Logs                              */
          /* ========================================================================= */
          <div className="p-3.5 sm:p-6 space-y-6">
            
            {/* Team Directory List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  GI Team Directory ({employees.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 flex flex-col justify-between gap-3 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          emp.status === 'Leave'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}>
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{emp.name}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                              emp.status === 'Leave'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            }`}>
                              {emp.status === 'Leave' ? 'Left' : 'Active'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            {emp.job_role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditEmp(emp)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmp(emp.id, emp.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Pay</span>
                        <span className="font-black text-xs text-slate-900 dark:text-white">{formatCurrency(emp.monthly_salary)}</span>
                      </div>
                      <button
                        onClick={() => handleOpenQuickPay(emp.id, currentActiveMonthYear, emp.monthly_salary)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition-colors cursor-pointer"
                      >
                        + Pay Salary
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary Payment History Log */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Salary Payout Logs ({filteredHistory.length})
                </h3>

                {/* Filter by Year */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Filter Year:</span>
                  <select
                    value={historyYearFilter}
                    onChange={(e) => setHistoryYearFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="all">All Years</option>
                    {yearsList.map(y => (
                      <option key={y} value={String(y)}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Cards for Payment Logs (< 768px) */}
              <div className="block md:hidden space-y-2.5">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">No salary payment logs recorded for this selection.</div>
                ) : (
                  filteredHistory.map((sal) => (
                    <div
                      key={sal.id}
                      className="p-3 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {sal.employee_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[9px] font-extrabold border border-indigo-200 dark:border-indigo-800">
                            {sal.month_year}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{formatDate(sal.payment_date)}</span>
                          <span>•</span>
                          <span>{sal.payment_mode}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(sal.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteSalary(sal.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table for Payment Logs (>= 768px) */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Team Member</th>
                      <th className="p-3">Month / Period</th>
                      <th className="p-3">Payment Mode</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-500">No salary payment logs recorded for this selection.</td>
                      </tr>
                    ) : (
                      filteredHistory.map((sal) => (
                        <tr key={sal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 text-slate-600 dark:text-slate-400">{formatDate(sal.payment_date)}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">
                            {sal.employee_name} <span className="text-[10px] font-normal text-slate-500">({sal.job_role})</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                              {sal.month_year}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {sal.payment_mode} {sal.reference_no ? `(${sal.reference_no})` : ''}
                          </td>
                          <td className="p-3 text-right font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(sal.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteSalary(sal.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT TEAM MEMBER              */}
      {/* ========================================== */}
      <Modal
        isOpen={isAddEmpOpen}
        onClose={() => setIsAddEmpOpen(false)}
        title={editingEmp ? "Edit Team Member" : "Add New GI Team Member"}
      >
        <form onSubmit={handleEmpSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ayan Shaikh"
              value={empForm.name}
              onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Job Role / Designation
              </label>
              <select
                value={empForm.job_role}
                onChange={(e) => setEmpForm({ ...empForm, job_role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium cursor-pointer"
              >
                {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Salary (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 25000"
                value={empForm.monthly_salary}
                onChange={(e) => setEmpForm({ ...empForm, monthly_salary: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={empForm.phone}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employment Status
              </label>
              <select
                value={empForm.status}
                onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium cursor-pointer"
              >
                <option value="Active">Active Team Member</option>
                <option value="Leave">Left Company</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes & Special Terms
            </label>
            <textarea
              rows="2"
              placeholder="Leave policies, emergency contact, joining notes..."
              value={empForm.notes}
              onChange={(e) => setEmpForm({ ...empForm, notes: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEmpOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {editingEmp ? 'Update Member' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: PAY SALARY WITH UNLIMITED HISTORICAL & FUTURE MONTH/YEAR ENGINE     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Salary Payout"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          
          {/* Employee Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Team Member <span className="text-rose-600">*</span>
            </label>
            <select
              required
              value={payForm.employee_id}
              onChange={(e) => {
                const empId = e.target.value;
                const selectedEmp = employees.find(emp => String(emp.id) === String(empId));
                setPayForm(prev => ({
                  ...prev,
                  employee_id: empId,
                  amount: selectedEmp?.monthly_salary || '',
                  leave_days: '',
                  notes: selectedEmp ? `Salary payout for ${selectedEmp.name} (${prev.month_year})` : ''
                }));
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-bold cursor-pointer"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.job_role}) — {formatCurrency(e.monthly_salary)}
                </option>
              ))}
            </select>
          </div>

          {/* DYNAMIC MONTH & YEAR SELECTOR (Full Historical & Future Support) */}
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Salary Period: {payForm.month_year}</span>
              </label>

              {/* Quick Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickPresetMonth('prev')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                >
                  Prev Mo.
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPresetMonth('current')}
                  className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shadow-2xs hover:bg-indigo-700 cursor-pointer"
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPresetMonth('next')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-indigo-400 cursor-pointer"
                >
                  Next Mo.
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Month Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Month
                </label>
                <select
                  required
                  value={payForm.month_name}
                  onChange={(e) => updatePayModalMonthYear(e.target.value, payForm.year_num)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-black focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {ALL_MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector (Supports all historical and future years) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Year
                </label>
                <select
                  required
                  value={payForm.year_num}
                  onChange={(e) => updatePayModalMonthYear(payForm.month_name, Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs font-black focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {yearsList.map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DUPLICATE SALARY PAYMENT WARNING */}
          {existingPaidEntry && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 font-bold animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-extrabold text-rose-900 dark:text-rose-100">
                  Salary ALREADY Paid for {existingPaidEntry.employee_name || selectedPayEmp?.name} ({payForm.month_year})
                </p>
                <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300 mt-0.5">
                  Amount paid: <strong>{formatCurrency(existingPaidEntry.amount)}</strong> on {formatDate(existingPaidEntry.payment_date)}. Duplicate salary entries for the same month are blocked.
                </p>
              </div>
            </div>
          )}

          {/* LEAVE DEDUCTION CALCULATOR PANEL */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Leave Deduction Calculator
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Base: <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedPayEmp?.monthly_salary || 0)}/mo</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Unpaid Leave Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  placeholder="0 days"
                  value={payForm.leave_days}
                  onChange={(e) => handleLeaveDaysChange(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs font-extrabold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Month Days Count
                </label>
                <select
                  value={payForm.working_days}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setPayForm(prev => ({ ...prev, working_days: days }));
                    handleLeaveDaysChange(payForm.leave_days, payForm.employee_id, days);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value={30}>30 Days (Standard)</option>
                  <option value={31}>31 Days</option>
                  <option value={28}>28 Days (Feb)</option>
                  <option value={29}>29 Days (Leap Feb)</option>
                </select>
              </div>
            </div>

            {/* Calculated Deduction Info Badge */}
            {Number(payForm.leave_days) > 0 && selectedPayEmp && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-between">
                <span>
                  Deduction ({payForm.leave_days} days @ ₹{Math.round((Number(selectedPayEmp.monthly_salary || 0)) / (Number(payForm.working_days) || 30))}/day):
                </span>
                <strong className="text-rose-600 dark:text-rose-400 font-black">
                  -₹{(Math.round(((Number(selectedPayEmp.monthly_salary || 0)) / (Number(payForm.working_days) || 30)) * Number(payForm.leave_days)) || 0).toLocaleString('en-IN')}
                </strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Net Payable Amount (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="Amount"
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-indigo-600 dark:text-indigo-400 text-base font-black focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={payForm.payment_mode}
                onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium cursor-pointer"
              >
                <option value="GPay">GPay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                UPI Ref / Txn ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/394820194820"
                value={payForm.reference_no}
                onChange={(e) => setPayForm({ ...payForm, reference_no: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
              />
            </div>
          </div>

          {/* REMARKS & NOTES TEXTAREA */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Payout Notes / Leave Reason
            </label>
            <textarea
              rows="2"
              placeholder="Add any remarks, leave deduction notes, bonus or payment details..."
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(existingPaidEntry)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                existingPaidEntry
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95'
              }`}
            >
              {existingPaidEntry ? 'Already Paid for this Month' : 'Record Salary Payout'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
