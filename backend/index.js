import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

import connectDB from './db.js';
import Service from './models/Service.js';
import ExpenseCategory from './models/ExpenseCategory.js';
import Expense from './models/Expense.js';
import ClientDeal from './models/ClientDeal.js';
import ClientPayment from './models/ClientPayment.js';
import Employee from './models/Employee.js';
import SalaryPayment from './models/SalaryPayment.js';
import User from './models/User.js';

const app = express();
const PORT = process.env.PORT || 5050;
const JWT_SECRET = process.env.JWT_SECRET || 'expenset_jwt_secret_key_2026_gandhi_infosol';

// Initialize Database connection & seed defaults
connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));
app.use(express.json());
app.use(morgan('dev'));

// JWT Auth Middleware
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Gandhi Infosol Finance API (MongoDB)', timestamp: new Date() });
});

// ==========================================
// AUTHENTICATION APIS
// ==========================================

// POST /api/auth/register - Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long' });
    }

    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username.trim().toLowerCase(),
      password: hashedPassword,
      name: name ? name.trim() : username.trim(),
      role: role || 'admin'
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id.toString(), username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: newUser.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - User login Step 1 (Username & Password verification -> Triggers 2FA)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Password is valid. Generate temporary 2FA pre-auth token (valid 10 minutes)
    const tempToken = jwt.sign(
      { id: user._id.toString(), username: user.username, stage: '2fa_pending' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    // If 2FA is already enabled, prompt for 6-digit Authenticator code
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return res.json({
        requires2FA: true,
        isSetupNeeded: false,
        tempToken,
        username: user.username,
        message: 'Credentials valid. Please enter the 6-digit code from your Google Authenticator app.'
      });
    }

    // If 2FA is not setup yet, generate new secret and QR Code for easy scanning
    let secret = user.twoFactorSecret;
    if (!secret) {
      const generated = speakeasy.generateSecret({
        name: `Gandhi Infosol (${user.username})`,
        issuer: 'Gandhi Infosol Finance'
      });
      secret = generated.base32;
      user.twoFactorSecret = secret;
      await user.save();
    }

    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label: `Gandhi Infosol (${user.username})`,
      issuer: 'Gandhi Infosol Finance',
      encoding: 'base32'
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({
      requires2FA: true,
      isSetupNeeded: true,
      tempToken,
      username: user.username,
      secret,
      qrCode: qrCodeDataUrl,
      message: 'Scan the QR Code in Google Authenticator app and enter the 6-digit code to complete setup.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/verify-2fa - Verify Google Authenticator 6-digit code & issue full JWT token
app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ error: 'Pre-auth token and 6-digit code are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (decoded.stage !== '2fa_pending') {
        return res.status(400).json({ error: 'Invalid authentication session stage' });
      }
    } catch (err) {
      return res.status(401).json({ error: '2FA session expired. Please enter username & password again.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.twoFactorSecret) {
      return res.status(404).json({ error: 'User 2FA profile not found' });
    }

    const cleanCode = code.toString().replace(/\s+/g, '').trim();

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: cleanCode,
      window: 1 // Allows 30s clock skew window for high reliability
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid 6-digit Authenticator code. Please check your app and try again.' });
    }

    // Enable 2FA on first successful verification
    if (!user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await user.save();
    }

    // Generate full session JWT token
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '2FA Verification successful. Welcome!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Fetch currently logged in user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 1. SERVICES MASTER APIS
// ==========================================
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json(services.map(s => s.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, category, base_price, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    const newService = new Service({
      name: name.trim(),
      category: category || 'Digital Marketing',
      base_price: Number(base_price) || 0,
      description: description || '',
      is_active: 1
    });
    await newService.save();
    res.status(201).json(newService.toJSON());
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('duplicate key'))) {
      return res.status(400).json({ error: 'A service with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, base_price, description, is_active } = req.body;
    const updated = await Service.findByIdAndUpdate(
      id,
      {
        name: name ? name.trim() : undefined,
        category: category || 'Digital Marketing',
        base_price: Number(base_price) || 0,
        description: description || '',
        is_active: is_active === undefined ? 1 : is_active ? 1 : 0
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Service not found' });
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await ClientDeal.findOne({ 'services.service_id': id });
    if (inUse) {
      await Service.findByIdAndUpdate(id, { is_active: 0 });
      return res.json({ message: 'Service marked as inactive because it is linked to existing client deals', softDeleted: true });
    }
    await Service.findByIdAndDelete(id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. EXPENSE CATEGORIES MASTER APIS
// ==========================================
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ name: 1 });
    const result = await Promise.all(categories.map(async (cat) => {
      const expenseCount = await Expense.countDocuments({ category_id: cat._id });
      const totalSpentAgg = await Expense.aggregate([
        { $match: { category_id: cat._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalSpent = totalSpentAgg[0] ? totalSpentAgg[0].total : 0;
      return {
        ...cat.toJSON(),
        expense_count: expenseCount,
        total_spent: totalSpent
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, icon, color, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCat = new ExpenseCategory({
      name: name.trim(),
      icon: icon || 'tag',
      color: color || '#3b82f6',
      description: description || '',
      is_active: 1
    });
    await newCat.save();
    res.status(201).json(newCat.toJSON());
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('duplicate key'))) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, description, is_active } = req.body;
    const updated = await ExpenseCategory.findByIdAndUpdate(
      id,
      {
        name: name ? name.trim() : undefined,
        icon: icon || 'tag',
        color: color || '#3b82f6',
        description: description || '',
        is_active: is_active === undefined ? 1 : is_active ? 1 : 0
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await Expense.findOne({ category_id: id });
    if (inUse) {
      await ExpenseCategory.findByIdAndUpdate(id, { is_active: 0 });
      return res.json({ message: 'Category deactivated as it contains logged expenses', softDeleted: true });
    }
    await ExpenseCategory.findByIdAndDelete(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. DAILY EXPENSES APIS
// ==========================================
app.get('/api/expenses', async (req, res) => {
  try {
    const { search, category_id, payment_mode, start_date, end_date } = req.query;
    const query = {};

    if (category_id) {
      query.category_id = category_id;
    }
    if (payment_mode) {
      query.payment_mode = payment_mode;
    }
    if (start_date || end_date) {
      query.expense_date = {};
      if (start_date) query.expense_date.$gte = start_date;
      if (end_date) query.expense_date.$lte = end_date;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { description: regex },
        { paid_to: regex },
        { receipt_no: regex }
      ];
    }

    const expenses = await Expense.find(query).populate('category_id').sort({ expense_date: -1, _id: -1 });

    const formatted = expenses.map(e => e.toJSON());
    if (search) {
      const regex = new RegExp(search, 'i');
      // Also filter by category_name if specified search matches
      return res.json(formatted.filter(e => 
        regex.test(e.description) || 
        regex.test(e.paid_to || '') || 
        regex.test(e.receipt_no || '') || 
        regex.test(e.category_name || '')
      ));
    }
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { category_id, amount, expense_date, payment_mode, description, paid_to, receipt_no } = req.body;
    if (!category_id || !amount || !expense_date || !description) {
      return res.status(400).json({ error: 'Category, amount, date, and description are required' });
    }
    const newExpense = new Expense({
      category_id,
      amount: Number(amount),
      expense_date,
      payment_mode: payment_mode || 'UPI',
      description: description.trim(),
      paid_to: paid_to ? paid_to.trim() : null,
      receipt_no: receipt_no ? receipt_no.trim() : null
    });
    await newExpense.save();
    const populated = await Expense.findById(newExpense._id).populate('category_id');
    res.status(201).json(populated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, expense_date, payment_mode, description, paid_to, receipt_no } = req.body;
    const updated = await Expense.findByIdAndUpdate(
      id,
      {
        category_id,
        amount: Number(amount),
        expense_date,
        payment_mode: payment_mode || 'UPI',
        description: description ? description.trim() : undefined,
        paid_to: paid_to ? paid_to.trim() : null,
        receipt_no: receipt_no ? receipt_no.trim() : null
      },
      { new: true }
    ).populate('category_id');
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. CLIENT DEALS & RECEIVABLES APIS
// ==========================================
app.get('/api/deals', async (req, res) => {
  try {
    const { search, status, start_date, end_date } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (start_date || end_date) {
      query.deal_date = {};
      if (start_date) query.deal_date.$gte = start_date;
      if (end_date) query.deal_date.$lte = end_date;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { client_name: regex },
        { company_name: regex },
        { client_phone: regex },
        { insta_id: regex },
        { notes: regex }
      ];
    }

    const deals = await ClientDeal.find(query).sort({ deal_date: -1, _id: -1 });

    const fullDeals = await Promise.all(deals.map(async (deal) => {
      const payments = await ClientPayment.find({ deal_id: deal._id }).sort({ payment_date: -1, _id: -1 });
      return {
        ...deal.toJSON(),
        payments: payments.map(p => p.toJSON())
      };
    }));

    res.json(fullDeals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await ClientDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const payments = await ClientPayment.find({ deal_id: deal._id }).sort({ payment_date: -1, _id: -1 });
    res.json({
      ...deal.toJSON(),
      payments: payments.map(p => p.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deals', async (req, res) => {
  try {
    const {
      client_name,
      client_phone,
      client_email,
      company_name,
      insta_id,
      deal_date,
      duration_months,
      expiry_date,
      total_deal_amount,
      advance_amount,
      payment_mode,
      payment_reference,
      services,
      notes
    } = req.body;

    if (!client_name?.trim() || !company_name?.trim() || !client_phone?.trim() || !deal_date || !total_deal_amount) {
      return res.status(400).json({ error: 'Client name, brand/company name, phone number, deal date, and total deal amount are required' });
    }

    const totalAmount = Number(total_deal_amount);
    const initialPaid = Number(advance_amount) || 0;
    const pendingAmount = Math.max(0, totalAmount - initialPaid);
    const status = pendingAmount === 0 ? 'completed' : 'active';
    const durMonths = Number(duration_months) || 1;

    let computedExpiry = expiry_date;
    if (!computedExpiry && deal_date) {
      const d = new Date(deal_date);
      d.setMonth(d.getMonth() + durMonths);
      computedExpiry = d.toISOString().split('T')[0];
    }

    const formattedServices = [];
    if (Array.isArray(services) && services.length > 0) {
      for (const s of services) {
        const serviceId = typeof s === 'object' ? s.service_id : s;
        const agreedPrice = typeof s === 'object' && s.agreed_price ? Number(s.agreed_price) : 0;
        const serviceData = await Service.findById(serviceId);
        formattedServices.push({
          service_id: serviceId,
          service_name: serviceData ? serviceData.name : 'Custom Service',
          agreed_price: agreedPrice
        });
      }
    }

    const newDeal = new ClientDeal({
      client_name: client_name.trim(),
      client_phone: client_phone ? client_phone.trim() : null,
      client_email: client_email ? client_email.trim() : null,
      company_name: company_name ? company_name.trim() : null,
      insta_id: insta_id ? insta_id.trim() : null,
      deal_date,
      duration_months: durMonths,
      expiry_date: computedExpiry,
      total_deal_amount: totalAmount,
      received_amount: initialPaid,
      pending_amount: pendingAmount,
      status,
      notes: notes ? notes.trim() : null,
      services: formattedServices
    });
    await newDeal.save();

    if (initialPaid > 0) {
      const payRecord = new ClientPayment({
        deal_id: newDeal._id,
        amount: initialPaid,
        payment_date: deal_date,
        payment_mode: payment_mode || 'UPI',
        reference_no: payment_reference || null,
        notes: 'Initial advance payment'
      });
      await payRecord.save();
    }

    const payments = await ClientPayment.find({ deal_id: newDeal._id });

    res.status(201).json({
      ...newDeal.toJSON(),
      payments: payments.map(p => p.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name,
      client_phone,
      client_email,
      company_name,
      insta_id,
      deal_date,
      duration_months,
      expiry_date,
      total_deal_amount,
      status,
      notes,
      services
    } = req.body;

    const currentDeal = await ClientDeal.findById(id);
    if (!currentDeal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const totalAmount = total_deal_amount !== undefined ? Number(total_deal_amount) : currentDeal.total_deal_amount;
    const receivedAmount = currentDeal.received_amount;
    const pendingAmount = Math.max(0, totalAmount - receivedAmount);
    let updatedStatus = status || (pendingAmount === 0 ? 'completed' : 'active');
    if (updatedStatus === 'completed' && pendingAmount > 0) {
      updatedStatus = 'active';
    }
    const durMonths = duration_months !== undefined ? Number(duration_months) : (currentDeal.duration_months || 1);

    const activeDealDate = deal_date || currentDeal.deal_date;
    let computedExpiry = expiry_date;
    if (!computedExpiry && activeDealDate) {
      const d = new Date(activeDealDate);
      d.setMonth(d.getMonth() + durMonths);
      computedExpiry = d.toISOString().split('T')[0];
    }

    let formattedServices = currentDeal.services;
    if (Array.isArray(services)) {
      formattedServices = [];
      for (const s of services) {
        const serviceId = typeof s === 'object' ? s.service_id : s;
        const agreedPrice = typeof s === 'object' && s.agreed_price ? Number(s.agreed_price) : 0;
        const serviceData = await Service.findById(serviceId);
        formattedServices.push({
          service_id: serviceId,
          service_name: serviceData ? serviceData.name : 'Custom Service',
          agreed_price: agreedPrice
        });
      }
    }

    currentDeal.client_name = client_name ? client_name.trim() : currentDeal.client_name;
    currentDeal.client_phone = client_phone !== undefined ? client_phone : currentDeal.client_phone;
    currentDeal.client_email = client_email !== undefined ? client_email : currentDeal.client_email;
    currentDeal.company_name = company_name !== undefined ? company_name : currentDeal.company_name;
    currentDeal.insta_id = insta_id !== undefined ? (insta_id ? insta_id.trim() : null) : currentDeal.insta_id;
    currentDeal.deal_date = activeDealDate;
    currentDeal.duration_months = durMonths;
    currentDeal.expiry_date = computedExpiry;
    currentDeal.total_deal_amount = totalAmount;
    currentDeal.pending_amount = pendingAmount;
    currentDeal.status = updatedStatus;
    currentDeal.notes = notes !== undefined ? notes : currentDeal.notes;
    currentDeal.services = formattedServices;

    await currentDeal.save();

    const payments = await ClientPayment.find({ deal_id: currentDeal._id });

    res.json({
      ...currentDeal.toJSON(),
      payments: payments.map(p => p.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ClientDeal.findByIdAndDelete(id);
    await ClientPayment.deleteMany({ deal_id: id });
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record a new payment installment towards a deal
app.post('/api/deals/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_date, payment_mode, reference_no, notes } = req.body;

    if (!amount || Number(amount) <= 0 || !payment_date) {
      return res.status(400).json({ error: 'Valid payment amount and payment date are required' });
    }

    const payAmount = Number(amount);
    const deal = await ClientDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const newPayment = new ClientPayment({
      deal_id: id,
      amount: payAmount,
      payment_date,
      payment_mode: payment_mode || 'UPI',
      reference_no: reference_no || null,
      notes: notes ? notes.trim() : null
    });
    await newPayment.save();

    const paymentsAgg = await ClientPayment.aggregate([
      { $match: { deal_id: deal._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRec = paymentsAgg[0] ? paymentsAgg[0].total : 0;
    const newPending = Math.max(0, deal.total_deal_amount - totalRec);
    const newStatus = newPending === 0 ? 'completed' : 'active';

    deal.received_amount = totalRec;
    deal.pending_amount = newPending;
    deal.status = newStatus;
    await deal.save();

    const payments = await ClientPayment.find({ deal_id: id }).sort({ payment_date: -1, _id: -1 });

    res.status(201).json({
      message: 'Payment recorded successfully',
      deal: deal.toJSON(),
      payments: payments.map(p => p.toJSON()),
      totalRec,
      newPending,
      newStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/deals/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await ClientPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const dealId = payment.deal_id;
    await ClientPayment.findByIdAndDelete(paymentId);

    const paymentsAgg = await ClientPayment.aggregate([
      { $match: { deal_id: dealId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRec = paymentsAgg[0] ? paymentsAgg[0].total : 0;
    const deal = await ClientDeal.findById(dealId);
    if (deal) {
      const newPending = Math.max(0, deal.total_deal_amount - totalRec);
      const newStatus = newPending === 0 ? 'completed' : 'active';
      deal.received_amount = totalRec;
      deal.pending_amount = newPending;
      deal.status = newStatus;
      await deal.save();
    }

    res.json({ message: 'Payment record deleted and deal balance recalculated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id/lost', async (req, res) => {
  try {
    const { id } = req.params;
    const { loss_reason } = req.body;
    const deal = await ClientDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const reasonText = loss_reason ? loss_reason.trim() : 'Client refused payment / default';
    const updatedNotes = deal.notes 
      ? `[LOST DEAL / BAD DEBT - ${new Date().toLocaleDateString('en-IN')}: ${reasonText}] \n${deal.notes}`
      : `[LOST DEAL / BAD DEBT - ${new Date().toLocaleDateString('en-IN')}: ${reasonText}]`;

    deal.status = 'lost';
    deal.notes = updatedNotes;
    await deal.save();

    res.json(deal.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await ClientDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const newStatus = deal.pending_amount <= 0 ? 'completed' : 'active';
    const updatedNotes = deal.notes 
      ? `[RESTORED ACTIVE DEAL - ${new Date().toLocaleDateString('en-IN')}] \n${deal.notes}`
      : `[RESTORED ACTIVE DEAL - ${new Date().toLocaleDateString('en-IN')}]`;

    deal.status = newStatus;
    deal.notes = updatedNotes;
    await deal.save();

    res.json(deal.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const { close_reason } = req.body || {};
    const deal = await ClientDeal.findById(id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.pending_amount > 0) {
      return res.status(400).json({ 
        error: `Cannot close client deal. Full payment of ₹${deal.total_deal_amount.toLocaleString('en-IN')} has not been completed. Outstanding balance: ₹${deal.pending_amount.toLocaleString('en-IN')}. Please collect full payment or mark as lost.` 
      });
    }

    const reasonText = close_reason ? close_reason.trim() : 'Contract period completed / Non-renewed';
    const updatedNotes = deal.notes 
      ? `[CONTRACT CLOSED - ${new Date().toLocaleDateString('en-IN')}: ${reasonText}] \n${deal.notes}`
      : `[CONTRACT CLOSED - ${new Date().toLocaleDateString('en-IN')}: ${reasonText}]`;

    deal.status = 'completed';
    deal.notes = updatedNotes;
    await deal.save();

    res.json(deal.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. DASHBOARD & FINANCIAL ANALYTICS
// ==========================================
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const expQuery = {};
    const payQuery = {};
    const dealQuery = {};
    const salQuery = {};

    if (startDate || endDate) {
      expQuery.expense_date = {};
      payQuery.payment_date = {};
      dealQuery.deal_date = {};
      salQuery.payment_date = {};

      if (startDate) {
        expQuery.expense_date.$gte = startDate;
        payQuery.payment_date.$gte = startDate;
        dealQuery.deal_date.$gte = startDate;
        salQuery.payment_date.$gte = startDate;
      }
      if (endDate) {
        expQuery.expense_date.$lte = endDate;
        payQuery.payment_date.$lte = endDate;
        dealQuery.deal_date.$lte = endDate;
        salQuery.payment_date.$lte = endDate;
      }
    }

    const totalRegularExpensesAgg = await Expense.aggregate([
      { $match: expQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRegularExpenses = totalRegularExpensesAgg[0] ? totalRegularExpensesAgg[0].total : 0;

    const totalSalaryExpensesAgg = await SalaryPayment.aggregate([
      { $match: salQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSalaryExpenses = totalSalaryExpensesAgg[0] ? totalSalaryExpensesAgg[0].total : 0;

    const totalExpenses = totalRegularExpenses + totalSalaryExpenses;

    const totalRevenueAgg = await ClientPayment.aggregate([
      { $match: payQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = totalRevenueAgg[0] ? totalRevenueAgg[0].total : 0;

    const totalDealsAgg = await ClientDeal.aggregate([
      { $match: dealQuery },
      { $group: { _id: null, total: { $sum: '$total_deal_amount' }, count: { $sum: 1 } } }
    ]);
    const totalDealVolume = totalDealsAgg[0] ? totalDealsAgg[0].total : 0;
    const totalDealsCount = totalDealsAgg[0] ? totalDealsAgg[0].count : 0;

    const receivablesAgg = await ClientDeal.aggregate([
      { $match: { pending_amount: { $gt: 0 }, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$pending_amount' }, count: { $sum: 1 } } }
    ]);
    const totalReceivables = receivablesAgg[0] ? receivablesAgg[0].total : 0;
    const pendingDealsCount = receivablesAgg[0] ? receivablesAgg[0].count : 0;

    const lostAgg = await ClientDeal.aggregate([
      { $match: { status: 'lost' } },
      { $group: { _id: null, total: { $sum: '$pending_amount' }, count: { $sum: 1 } } }
    ]);
    const totalLostAmount = lostAgg[0] ? lostAgg[0].total : 0;
    const lostDealsCount = lostAgg[0] ? lostAgg[0].count : 0;

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    const categoryStatsAgg = await Expense.aggregate([
      { $match: expQuery },
      { $group: { _id: '$category_id', total_amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total_amount: -1 } }
    ]);

    const categoryBreakdown = await Promise.all(categoryStatsAgg.map(async (stat) => {
      const cat = await ExpenseCategory.findById(stat._id);
      return {
        id: stat._id ? stat._id.toString() : '',
        name: cat ? cat.name : 'Unknown Category',
        color: cat ? cat.color : '#3b82f6',
        icon: cat ? cat.icon : 'tag',
        total_amount: stat.total_amount,
        count: stat.count,
        percentage: totalExpenses > 0 ? ((stat.total_amount / totalExpenses) * 100).toFixed(1) : 0
      };
    }));

    // Service stats
    const serviceStatsAgg = await ClientDeal.aggregate([
      { $match: dealQuery },
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.service_id',
          service_name: { $first: '$services.service_name' },
          deal_count: { $sum: 1 },
          estimated_revenue: { $sum: '$services.agreed_price' }
        }
      },
      { $sort: { estimated_revenue: -1 } }
    ]);

    const serviceStats = await Promise.all(serviceStatsAgg.map(async (stat) => {
      const s = await Service.findById(stat._id);
      return {
        id: stat._id ? stat._id.toString() : '',
        name: stat.service_name || (s ? s.name : 'Custom Service'),
        category: s ? s.category : 'Digital Marketing',
        deal_count: stat.deal_count,
        estimated_revenue: stat.estimated_revenue
      };
    }));

    // Monthly trends
    const monthlyExpensesAgg = await Expense.aggregate([
      {
        $group: {
          _id: { $substr: ['$expense_date', 0, 7] },
          total_expense: { $sum: '$amount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    const monthlyIncomeAgg = await ClientPayment.aggregate([
      {
        $group: {
          _id: { $substr: ['$payment_date', 0, 7] },
          total_income: { $sum: '$amount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    const monthMap = {};
    monthlyIncomeAgg.forEach(i => {
      if (i._id) monthMap[i._id] = { month: i._id, income: i.total_income, expense: 0, profit: i.total_income };
    });
    monthlyExpensesAgg.forEach(e => {
      if (e._id) {
        if (!monthMap[e._id]) {
          monthMap[e._id] = { month: e._id, income: 0, expense: e.total_expense, profit: -e.total_expense };
        } else {
          monthMap[e._id].expense = e.total_expense;
          monthMap[e._id].profit = monthMap[e._id].income - e.total_expense;
        }
      }
    });

    const monthlyTrends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    const paymentModeBreakdownAgg = await Expense.aggregate([
      { $match: expQuery },
      { $group: { _id: '$payment_mode', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    const paymentModeBreakdown = paymentModeBreakdownAgg.map(p => ({
      payment_mode: p._id || 'UPI',
      total: p.total,
      count: p.count
    }));

    const topPendingDeals = await ClientDeal.find({ pending_amount: { $gt: 0 }, status: 'active' })
      .sort({ pending_amount: -1 })
      .limit(5);

    const topPendingClients = topPendingDeals.map(d => d.toJSON());

    const recentExpensesDocs = await Expense.find().populate('category_id').sort({ expense_date: -1, _id: -1 }).limit(10);
    const recentExpenses = recentExpensesDocs.map(e => {
      const json = e.toJSON();
      return {
        id: json.id,
        type: 'expense',
        amount: json.amount,
        date: json.expense_date,
        payment_mode: json.payment_mode,
        title: json.description,
        subtitle: json.category_name,
        badge_color: json.category_color
      };
    });

    const recentPaymentsDocs = await ClientPayment.find().populate('deal_id').sort({ payment_date: -1, _id: -1 }).limit(10);
    const recentPayments = recentPaymentsDocs.map(p => {
      const json = p.toJSON();
      const deal = p.deal_id;
      return {
        id: json.id,
        type: 'income',
        amount: json.amount,
        date: json.payment_date,
        payment_mode: json.payment_mode,
        title: deal ? deal.client_name : 'Client Payment',
        subtitle: deal && deal.company_name ? deal.company_name : 'Client Payment',
        badge_color: '#10b981'
      };
    });

    const recentTransactions = [...recentExpenses, ...recentPayments]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 10);

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalDealVolume,
      totalDealsCount,
      totalReceivables,
      pendingDealsCount,
      categoryBreakdown,
      serviceStats,
      monthlyTrends,
      paymentModeBreakdown,
      topPendingClients,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. EMPLOYEES & SALARIES APIS
// ==========================================
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ status: 1, name: 1 });
    const result = await Promise.all(employees.map(async (emp) => {
      const salAgg = await SalaryPayment.aggregate([
        { $match: { employee_id: emp._id } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);
      const totalPaid = salAgg[0] ? salAgg[0].total : 0;
      const count = salAgg[0] ? salAgg[0].count : 0;
      return {
        ...emp.toJSON(),
        total_paid_to_date: totalPaid,
        payment_count: count
      };
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, job_role, monthly_salary, status, phone, email, joining_date, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Team member name is required' });
    }
    const newEmp = new Employee({
      name: name.trim(),
      job_role: job_role || 'Graphics',
      monthly_salary: Number(monthly_salary) || 0,
      status: status || 'Active',
      phone: phone || '',
      email: email || '',
      joining_date: joining_date || new Date().toISOString().split('T')[0],
      notes: notes || ''
    });
    await newEmp.save();
    res.status(201).json(newEmp.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, job_role, monthly_salary, status, phone, email, joining_date, notes } = req.body;
    const updated = await Employee.findByIdAndUpdate(
      id,
      {
        name: name ? name.trim() : undefined,
        job_role: job_role || 'Graphics',
        monthly_salary: Number(monthly_salary) || 0,
        status: status || 'Active',
        phone: phone || '',
        email: email || '',
        joining_date: joining_date || '',
        notes: notes || ''
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Employee not found' });
    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.findByIdAndDelete(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/salaries', async (req, res) => {
  try {
    const { employee_id, month_year } = req.query;
    const query = {};

    if (employee_id) query.employee_id = employee_id;
    if (month_year) query.month_year = month_year;

    const payments = await SalaryPayment.find(query).populate('employee_id').sort({ payment_date: -1, _id: -1 });
    res.json(payments.map(p => p.toJSON()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/salaries', async (req, res) => {
  try {
    const { employee_id, month_year, amount, payment_date, payment_mode, reference_no, notes } = req.body;
    if (!employee_id || !amount || !month_year) {
      return res.status(400).json({ error: 'Employee, amount, and month/year are required' });
    }

    const existing = await SalaryPayment.findOne({ employee_id, month_year }).populate('employee_id');
    if (existing) {
      const empName = existing.employee_id ? existing.employee_id.name : 'Employee';
      return res.status(400).json({ 
        error: `Salary for ${empName} for ${month_year} has already been paid (₹${Number(existing.amount).toLocaleString('en-IN')}). Duplicate payments for the same month are not allowed.` 
      });
    }

    const newSal = new SalaryPayment({
      employee_id,
      month_year,
      amount: Number(amount),
      payment_date: payment_date || new Date().toISOString().split('T')[0],
      payment_mode: payment_mode || 'GPay',
      reference_no: reference_no || '',
      notes: notes || ''
    });
    await newSal.save();

    const populated = await SalaryPayment.findById(newSal._id).populate('employee_id');
    res.status(201).json(populated.toJSON());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/salaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await SalaryPayment.findByIdAndDelete(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/salaries/matrix', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ _id: 1 });
    const payments = await SalaryPayment.find().populate('employee_id');

    const months = [
      'March 2026', 'April 2026', 'May 2026', 'June 2026',
      'July 2026', 'August 2026', 'September 2026', 'October 2026',
      'November 2026', 'December 2026', 'January 2027', 'February 2027'
    ];

    const matrix = employees.map(emp => {
      const empIdStr = emp._id.toString();
      const row = {
        id: empIdStr,
        name: emp.name,
        job_role: emp.job_role,
        monthly_salary: emp.monthly_salary,
        status: emp.status,
        phone: emp.phone,
        monthly_payouts: {}
      };

      months.forEach(m => {
        const empPaymentsForMonth = payments.filter(p => p.employee_id && p.employee_id._id.toString() === empIdStr && p.month_year === m);
        const totalPaid = empPaymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
        row.monthly_payouts[m] = {
          amount: totalPaid,
          payments: empPaymentsForMonth.map(p => p.toJSON())
        };
      });

      return row;
    });

    res.json({ months, matrix });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve production frontend build if available
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Gandhi Infosol Finance Server (MongoDB) running on http://localhost:${PORT}`);
});
