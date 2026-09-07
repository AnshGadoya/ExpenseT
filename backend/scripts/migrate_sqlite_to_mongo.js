import BetterSqlite from 'better-sqlite3';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import Service from '../models/Service.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Expense from '../models/Expense.js';
import ClientDeal from '../models/ClientDeal.js';
import ClientPayment from '../models/ClientPayment.js';
import Employee from '../models/Employee.js';
import SalaryPayment from '../models/SalaryPayment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbPath = path.join(__dirname, '../database.sqlite');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expenset';

async function migrate() {
  console.log('🚀 Starting Data Migration from SQLite to MongoDB Atlas...');

  try {
    const sqliteDb = new BetterSqlite(dbPath);
    console.log('📂 Opened local SQLite database:', dbPath);

    await mongoose.connect(MONGODB_URI);
    console.log('🍃 Connected to MongoDB Atlas:', MONGODB_URI);

    // Map SQLite IDs to MongoDB _ids for referential integrity
    const serviceIdMap = {};
    const categoryIdMap = {};
    const dealIdMap = {};
    const employeeIdMap = {};

    // 1. Services
    const services = sqliteDb.prepare('SELECT * FROM services').all();
    console.log(`📦 Migrating ${services.length} Services...`);
    for (const s of services) {
      let existing = await Service.findOne({ name: s.name });
      if (!existing) {
        existing = new Service({
          name: s.name,
          category: s.category,
          base_price: s.base_price,
          description: s.description,
          is_active: s.is_active,
          created_at: s.created_at ? new Date(s.created_at) : new Date()
        });
        await existing.save();
      }
      serviceIdMap[s.id] = existing._id;
    }

    // 2. Expense Categories
    const categories = sqliteDb.prepare('SELECT * FROM expense_categories').all();
    console.log(`🏷️ Migrating ${categories.length} Expense Categories...`);
    for (const c of categories) {
      let existing = await ExpenseCategory.findOne({ name: c.name });
      if (!existing) {
        existing = new ExpenseCategory({
          name: c.name,
          icon: c.icon,
          color: c.color,
          description: c.description,
          is_active: c.is_active,
          created_at: c.created_at ? new Date(c.created_at) : new Date()
        });
        await existing.save();
      }
      categoryIdMap[c.id] = existing._id;
    }

    // 3. Expenses
    const expenses = sqliteDb.prepare('SELECT * FROM expenses').all();
    console.log(`💸 Migrating ${expenses.length} Expenses...`);
    for (const e of expenses) {
      const mongoCatId = categoryIdMap[e.category_id];
      if (mongoCatId) {
        await Expense.create({
          category_id: mongoCatId,
          amount: e.amount,
          expense_date: e.expense_date,
          payment_mode: e.payment_mode || 'UPI',
          description: e.description,
          paid_to: e.paid_to,
          receipt_no: e.receipt_no,
          created_at: e.created_at ? new Date(e.created_at) : new Date()
        });
      }
    }

    // 4. Client Deals
    const deals = sqliteDb.prepare('SELECT * FROM client_deals').all();
    console.log(`💼 Migrating ${deals.length} Client Deals...`);
    for (const d of deals) {
      const dealServices = sqliteDb.prepare('SELECT * FROM deal_services WHERE deal_id = ?').all(d.id);
      const formattedServices = dealServices.map(ds => ({
        service_id: serviceIdMap[ds.service_id],
        service_name: ds.service_name,
        agreed_price: ds.agreed_price
      })).filter(ds => ds.service_id);

      const newDeal = new ClientDeal({
        client_name: d.client_name,
        client_phone: d.client_phone,
        client_email: d.client_email,
        company_name: d.company_name,
        insta_id: d.insta_id,
        deal_date: d.deal_date,
        duration_months: d.duration_months,
        expiry_date: d.expiry_date,
        total_deal_amount: d.total_deal_amount,
        received_amount: d.received_amount,
        pending_amount: d.pending_amount,
        status: d.status,
        notes: d.notes,
        services: formattedServices,
        created_at: d.created_at ? new Date(d.created_at) : new Date()
      });
      await newDeal.save();
      dealIdMap[d.id] = newDeal._id;
    }

    // 5. Client Payments
    const payments = sqliteDb.prepare('SELECT * FROM client_payments').all();
    console.log(`💳 Migrating ${payments.length} Client Payments...`);
    for (const p of payments) {
      const mongoDealId = dealIdMap[p.deal_id];
      if (mongoDealId) {
        await ClientPayment.create({
          deal_id: mongoDealId,
          amount: p.amount,
          payment_date: p.payment_date,
          payment_mode: p.payment_mode || 'UPI',
          reference_no: p.reference_no,
          notes: p.notes,
          created_at: p.created_at ? new Date(p.created_at) : new Date()
        });
      }
    }

    // 6. Employees
    const employees = sqliteDb.prepare('SELECT * FROM employees').all();
    console.log(`👥 Migrating ${employees.length} Employees...`);
    for (const emp of employees) {
      let existing = await Employee.findOne({ name: emp.name });
      if (!existing) {
        existing = new Employee({
          name: emp.name,
          job_role: emp.job_role,
          monthly_salary: emp.monthly_salary,
          status: emp.status,
          phone: emp.phone,
          email: emp.email,
          joining_date: emp.joining_date,
          notes: emp.notes,
          created_at: emp.created_at ? new Date(emp.created_at) : new Date()
        });
        await existing.save();
      }
      employeeIdMap[emp.id] = existing._id;
    }

    // 7. Salary Payments
    const salaryPayments = sqliteDb.prepare('SELECT * FROM salary_payments').all();
    console.log(`💰 Migrating ${salaryPayments.length} Salary Payments...`);
    for (const sp of salaryPayments) {
      const mongoEmpId = employeeIdMap[sp.employee_id];
      if (mongoEmpId) {
        await SalaryPayment.create({
          employee_id: mongoEmpId,
          month_year: sp.month_year,
          amount: sp.amount,
          payment_date: sp.payment_date,
          payment_mode: sp.payment_mode || 'GPay',
          reference_no: sp.reference_no,
          notes: sp.notes,
          created_at: sp.created_at ? new Date(sp.created_at) : new Date()
        });
      }
    }

    console.log('✅ Data Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
