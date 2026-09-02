import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  IndianRupee,
  Briefcase,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Grid,
  List,
  Filter,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
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

const DEFAULT_MONTHS = [
  'March 2026', 'April 2026', 'May 2026', 'June 2026',
  'July 2026', 'August 2026', 'September 2026', 'October 2026',
  'November 2026', 'December 2026', 'January 2027', 'February 2027'
];

export default function SalaryView({ darkMode }) {
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'list'
  const [matrixData, setMatrixData] = useState({ months: DEFAULT_MONTHS, matrix: [] });
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'Active' or 'Leave'

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

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    employee_id: '',
    month_year: 'August 2026',
    amount: '',
    leave_days: '',
    working_days: 30,
    payment_date: getTodayDateString(),
    payment_mode: 'GPay',
    reference_no: '',
    notes: ''
  });

  const handleLeaveDaysChange = (days, empId, currentWorkingDays = payForm.working_days) => {
    const leaveDaysNum = Math.max(0, Number(days) || 0);
    const targetEmpId = empId !== undefined ? empId : payForm.employee_id;
    const selectedEmp = employees.find(e => e.id === Number(targetEmpId));
    const baseSalary = Number(selectedEmp?.monthly_salary || 0);
    const totalDays = Number(currentWorkingDays || 30);
    
    if (baseSalary > 0 && totalDays > 0) {
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

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [matrixRes, empRes, salRes] = await Promise.all([
        api.getSalaryMatrix().catch(() => ({ months: DEFAULT_MONTHS, matrix: [] })),
        api.getEmployees().catch(() => []),
        api.getSalaries().catch(() => [])
      ]);
      setMatrixData(matrixRes && Array.isArray(matrixRes.matrix) ? matrixRes : { months: DEFAULT_MONTHS, matrix: [] });
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
    loadData();
  }, []);

  // Quick toggle status between Active and Leave directly in the table
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
  const existingPaidEntry = React.useMemo(() => {
    if (!payForm.employee_id || !payForm.month_year) return null;
    return (salaries || []).find(
      s => Number(s.employee_id) === Number(payForm.employee_id) && s.month_year === payForm.month_year
    );
  }, [payForm.employee_id, payForm.month_year, salaries]);

  // Pay Salary Submit
  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payForm.employee_id || !payForm.amount || !payForm.month_year) return;

    if (existingPaidEntry) {
      const empName = employees.find(e => e.id === Number(payForm.employee_id))?.name || 'this employee';
      alert(`⚠️ Validation Error: Salary for ${empName} for ${payForm.month_year} has ALREADY been paid (₹${Number(existingPaidEntry.amount).toLocaleString('en-IN')}).\n\nDouble payments for the same month are not allowed.`);
      return;
    }

    try {
      await api.recordSalaryPayment(payForm);
      setIsPayModalOpen(false);
      setPayForm({
        employee_id: '',
        month_year: 'August 2026',
        amount: '',
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

  const handleOpenQuickPay = (empId, monthName, defaultAmount) => {
    const selectedEmp = employees.find(e => e.id === empId);
    setPayForm({
      employee_id: empId,
      month_year: monthName,
      amount: defaultAmount || selectedEmp?.monthly_salary || '',
      leave_days: '',
      working_days: 30,
      payment_date: getTodayDateString(),
      payment_mode: 'GPay',
      reference_no: '',
      notes: `Salary payout for ${selectedEmp?.name || ''} (${monthName})`
    });
    setIsPayModalOpen(true);
  };

  const handleDeleteSalary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary payment log?')) return;
    try {
      await api.deleteSalaryPayment(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter matrix rows
  const filteredMatrix = (matrixData.matrix || []).filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.job_role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? row.job_role === roleFilter : true;
    const matchesStatus = statusFilter ? row.status === statusFilter : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate totals
  const totalMembers = employees.length;
  const activeMembers = employees.filter(e => e.status === 'Active').length;
  const leaveMembers = employees.filter(e => e.status === 'Leave').length;

  const totalMonthlyBudget = employees
    .filter(e => e.status === 'Active')
    .reduce((sum, e) => sum + (Number(e.monthly_salary) || 0), 0);

  const currentMonthPaid = salaries
    .filter(s => s.month_year === 'August 2026')
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const totalAllTimePaid = salaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Team & Salary Expenses
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                GI Team Remuneration, Monthly Payroll Matrix & Member Status (Active / Left Company)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-all shadow-2xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Team Member</span>
          </button>

          <button
            onClick={() => {
              setPayForm({
                employee_id: employees[0]?.id || '',
                month_year: 'August 2026',
                amount: '',
                payment_date: getTodayDateString(),
                payment_mode: 'GPay',
                reference_no: '',
                notes: ''
              });
              setIsPayModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
          >
            <IndianRupee className="w-4 h-4" />
            <span>+ Pay Salary</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Team Members */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Team</span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalMembers}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {activeMembers} Active • {leaveMembers} Left Company
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Graphics, Editors, Ads & Sales team</p>
        </div>

        {/* Active Monthly Salary Budget */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Budget</span>
            <span className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
              <Briefcase className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalMonthlyBudget)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Base monthly payroll commitment</p>
        </div>

        {/* August Paid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paid (Aug 2026)</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(currentMonthPaid)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Disbursed salary payments this month</p>
        </div>

        {/* All Time Total Payroll Paid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Salary Paid</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalAllTimePaid)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Cumulative payroll payouts recorded</p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        {/* Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          
          {/* View Toggle Tabs */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>GI Team Matrix (Spreadsheet)</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Payment History & Directory</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 sm:w-56 font-medium"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">All Job Roles</option>
              {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Leave">Left Company (Past Members)</option>
            </select>
          </div>
        </div>

        {/* View Content */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading GI Team Salary Sheet...</p>
          </div>
        ) : viewMode === 'matrix' ? (
          
          /* ========================================================================= */
          /* SPREADSHEET MATRIX VIEW (Matches Google Sheet GI Team Screenshot Exactly!) */
          /* ========================================================================= */
          <div className="overflow-x-auto relative max-h-[650px] scrollbar-thin">
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

                  {/* Month Columns */}
                  {(matrixData.months || DEFAULT_MONTHS).map((month) => (
                    <th
                      key={month}
                      className="p-3 border-b border-r border-slate-200 dark:border-slate-700/70 font-extrabold text-center min-w-[110px] whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {month.replace(' 2026', '').replace(' 2027', "'27")}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={5 + DEFAULT_MONTHS.length} className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">
                      No team members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((emp, idx) => {
                    const isLeave = emp.status === 'Leave';
                    return (
                      <tr
                        key={emp.id}
                        className={`transition-colors ${
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
                            className="opacity-0 group-hover:opacity-100 hover:text-indigo-600 text-slate-400 p-1"
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
                        {(matrixData.months || DEFAULT_MONTHS).map((monthName) => {
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
                                  title={`Paid ₹${paidAmount}. Click to add/edit payment.`}
                                  className="w-full px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-[11px] hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>{paidAmount >= 1000 ? `${(paidAmount / 1000).toFixed(paidAmount % 1000 === 0 ? 0 : 1)}k` : paidAmount}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenQuickPay(emp.id, monthName, emp.monthly_salary)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
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
            </table>
          </div>
        ) : (
          
          /* ========================================================================= */
          /* LIST VIEW: Directory & Complete Payment Logs */
          /* ========================================================================= */
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Team Directory List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  GI Team Directory ({employees.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        emp.status === 'Leave'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{emp.name}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                            emp.status === 'Leave'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          }`}>
                            {emp.status === 'Leave' ? 'Left Company' : 'Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {emp.job_role} • <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(emp.monthly_salary)}/mo</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditEmp(emp)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmp(emp.id, emp.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary Payment History Log */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Salary Payout Logs ({salaries.length})
                </h3>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
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
                    {salaries.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-500">No salary payment logs recorded yet.</td>
                      </tr>
                    ) : (
                      salaries.map((sal) => (
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
                              className="text-slate-400 hover:text-rose-600 p-1"
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
              placeholder="e.g. Aryan Mithani, Dvishti Patel..."
              value={empForm.name}
              onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Job Role <span className="text-rose-600">*</span>
              </label>
              <select
                value={empForm.job_role}
                onChange={(e) => setEmpForm({ ...empForm, job_role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
              >
                {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Remuneration (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 20000"
                value={empForm.monthly_salary}
                onChange={(e) => setEmpForm({ ...empForm, monthly_salary: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={empForm.status}
                onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
              >
                <option value="Active">Active (Working)</option>
                <option value="Leave">Left Company (Resigned)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={empForm.phone}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddEmpOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              {editingEmp ? "Save Changes" : "Add Team Member"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL: RECORD SALARY PAYOUT                */}
      {/* ========================================== */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Record Salary Payout"
      >
        <form onSubmit={handlePaySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Team Member <span className="text-rose-600">*</span>
            </label>
            <select
              required
              value={payForm.employee_id}
              onChange={(e) => {
                const empId = Number(e.target.value);
                const selectedEmp = employees.find(emp => emp.id === empId);
                setPayForm({
                  ...payForm,
                  employee_id: empId,
                  amount: selectedEmp?.monthly_salary || payForm.amount
                });
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-600"
            >
              <option value="" disabled>Select Team Member</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.job_role}) — {formatCurrency(e.monthly_salary)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Month / Period <span className="text-rose-600">*</span>
            </label>
            <select
              required
              value={payForm.month_year}
              onChange={(e) => setPayForm({ ...payForm, month_year: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 font-medium"
            >
              {DEFAULT_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* DUPLICATE SALARY PAYMENT WARNING */}
          {existingPaidEntry && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200 font-bold animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-extrabold text-rose-900 dark:text-rose-100">
                  Salary ALREADY Paid for {existingPaidEntry.employee_name || employees.find(e => e.id === Number(payForm.employee_id))?.name} ({payForm.month_year})
                </p>
                <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300 mt-0.5">
                  Amount paid: <strong>{formatCurrency(existingPaidEntry.amount)}</strong> on {formatDate(existingPaidEntry.payment_date)}. Duplicate salary entries for the same month are blocked.
                </p>
              </div>
            </div>
          )}

          {/* LEAVE DEDUCTION CALCULATOR PANEL */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Leave Deduction Calculator
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Base: {formatCurrency(employees.find(e => e.id === Number(payForm.employee_id))?.monthly_salary || 0)}/mo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Unpaid Leave Days (e.g. 4)
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
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value={30}>30 Days (Standard)</option>
                  <option value={31}>31 Days</option>
                  <option value={28}>28 Days (Feb)</option>
                </select>
              </div>
            </div>

            {/* Calculated Deduction Info Badge */}
            {Number(payForm.leave_days) > 0 && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-between">
                <span>
                  Deduction ({payForm.leave_days} days @ ₹{Math.round((employees.find(e => e.id === Number(payForm.employee_id))?.monthly_salary || 0) / (Number(payForm.working_days) || 30))}/day):
                </span>
                <strong className="text-rose-600 dark:text-rose-400 font-black">
                  -₹{(Math.round(((employees.find(e => e.id === Number(payForm.employee_id))?.monthly_salary || 0) / (Number(payForm.working_days) || 30)) * Number(payForm.leave_days)) || 0).toLocaleString('en-IN')}
                </strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Net Payable Amount (₹) <span className="text-rose-600">*</span> (Editable)
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Mode
              </label>
              <select
                value={payForm.payment_mode}
                onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })}
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
                UPI Ref / Txn ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/394820194820"
                value={payForm.reference_no}
                onChange={(e) => setPayForm({ ...payForm, reference_no: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600"
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
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-600 placeholder-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(existingPaidEntry)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                existingPaidEntry
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
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
