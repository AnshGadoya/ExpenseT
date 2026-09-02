import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import db, { initDB } from './db.js';

const app = express();
const PORT = process.env.PORT || 5050;


// Initialize DB schema & seeds
initDB();

function getLastInsertId(info, tableName = '') {
  if (info && info.lastInsertRowid !== undefined && info.lastInsertRowid !== null) {
    return info.lastInsertRowid;
  }
  if (info && info.lastID !== undefined && info.lastID !== null) {
    return info.lastID;
  }
  if (tableName) {
    const row = db.prepare(`SELECT id FROM ${tableName} ORDER BY id DESC LIMIT 1`).get();
    if (row && row.id) return row.id;
  }
  const lastRow = db.prepare('SELECT last_insert_rowid() as id').get();
  return lastRow ? lastRow.id : null;
}

async function safeAll(stmt, ...params) {
  try {
    const res = params.length > 0 ? await stmt.all(...params) : await stmt.all();
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.rows)) return Array.from(res.rows);
    return [];
  } catch (e) {
    console.error('safeAll error:', e);
    return [];
  }
}

async function safeGet(stmt, ...params) {
  try {
    const res = params.length > 0 ? await stmt.get(...params) : await stmt.get();
    if (res && res.rows && Array.isArray(res.rows)) return res.rows[0] || null;
    return res || null;
  } catch (e) {
    console.error('safeGet error:', e);
    return null;
  }
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder']
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Gandhi Infosol Finance API', timestamp: new Date() });
});

// ==========================================
// 1. SERVICES MASTER APIS
// ==========================================
app.get('/api/services', async (req, res) => {
  try {
    const services = await safeAll(db.prepare('SELECT * FROM services ORDER BY name ASC'));
    res.json(services);
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
    const stmt = db.prepare(`
      INSERT INTO services (name, category, base_price, description, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const info = await stmt.run(name.trim(), category || 'Digital Marketing', Number(base_price) || 0, description || '');
    const insertedId = getLastInsertId(info, 'services');
    const newService = await safeGet(db.prepare('SELECT * FROM services WHERE id = ?'), insertedId);
    res.status(201).json(newService);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A service with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, base_price, description, is_active } = req.body;
    const stmt = db.prepare(`
      UPDATE services 
      SET name = ?, category = ?, base_price = ?, description = ?, is_active = ?
      WHERE id = ?
    `);
    await stmt.run(name.trim(), category || 'Digital Marketing', Number(base_price) || 0, description || '', is_active === undefined ? 1 : is_active ? 1 : 0, id);
    const updated = await safeGet(db.prepare('SELECT * FROM services WHERE id = ?'), id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await safeGet(db.prepare('SELECT COUNT(*) as count FROM deal_services WHERE service_id = ?'), id);
    if (inUse && inUse.count > 0) {
      await db.prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(id);
      return res.json({ message: 'Service marked as inactive because it is linked to existing client deals', softDeleted: true });
    }
    await db.prepare('DELETE FROM services WHERE id = ?').run(id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. EXPENSE CATEGORIES MASTER APIS
// ==========================================
app.get('/api/categories', (req, res) => {
  try {
    const categories = safeAll(db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM expenses e WHERE e.category_id = c.id) as expense_count,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses e WHERE e.category_id = c.id) as total_spent
      FROM expense_categories c
      ORDER BY c.name ASC
    `));
    res.json(categories);
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
    const stmt = db.prepare(`
      INSERT INTO expense_categories (name, icon, color, description, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const info = await stmt.run(name.trim(), icon || 'tag', color || '#3b82f6', description || '');
    const insertedId = getLastInsertId(info, 'expense_categories');
    const newCat = await safeGet(db.prepare('SELECT * FROM expense_categories WHERE id = ?'), insertedId);
    res.status(201).json(newCat);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A category with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, description, is_active } = req.body;
    const stmt = db.prepare(`
      UPDATE expense_categories 
      SET name = ?, icon = ?, color = ?, description = ?, is_active = ?
      WHERE id = ?
    `);
    await stmt.run(name.trim(), icon || 'tag', color || '#3b82f6', description || '', is_active === undefined ? 1 : is_active ? 1 : 0, id);
    const updated = await safeGet(db.prepare('SELECT * FROM expense_categories WHERE id = ?'), id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inUse = await safeGet(db.prepare('SELECT COUNT(*) as count FROM expenses WHERE category_id = ?'), id);
    if (inUse && inUse.count > 0) {
      await db.prepare('UPDATE expense_categories SET is_active = 0 WHERE id = ?').run(id);
      return res.json({ message: 'Category deactivated as it contains logged expenses', softDeleted: true });
    }
    await db.prepare('DELETE FROM expense_categories WHERE id = ?').run(id);
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
    let query = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ' AND e.category_id = ?';
      params.push(category_id);
    }
    if (payment_mode) {
      query += ' AND e.payment_mode = ?';
      params.push(payment_mode);
    }
    if (start_date) {
      query += ' AND e.expense_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND e.expense_date <= ?';
      params.push(end_date);
    }
    if (search) {
      query += ' AND (e.description LIKE ? OR e.paid_to LIKE ? OR c.name LIKE ? OR e.receipt_no LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY e.expense_date DESC, e.id DESC';
    const expenses = await safeAll(db.prepare(query), ...params);
    res.json(expenses);
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
    const stmt = db.prepare(`
      INSERT INTO expenses (category_id, amount, expense_date, payment_mode, description, paid_to, receipt_no)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = await stmt.run(
      category_id,
      Number(amount),
      expense_date,
      payment_mode || 'UPI',
      description.trim(),
      paid_to ? paid_to.trim() : null,
      receipt_no ? receipt_no.trim() : null
    );

    const insertedId = getLastInsertId(info, 'expenses');
    const created = await safeGet(db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = ?
    `), insertedId);

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, expense_date, payment_mode, description, paid_to, receipt_no } = req.body;
    const stmt = db.prepare(`
      UPDATE expenses 
      SET category_id = ?, amount = ?, expense_date = ?, payment_mode = ?, description = ?, paid_to = ?, receipt_no = ?
      WHERE id = ?
    `);
    await stmt.run(
      category_id,
      Number(amount),
      expense_date,
      payment_mode || 'UPI',
      description.trim(),
      paid_to ? paid_to.trim() : null,
      receipt_no ? receipt_no.trim() : null,
      id
    );

    const updated = await safeGet(db.prepare(`
      SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      WHERE e.id = ?
    `), id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
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
    let query = `
      SELECT d.* 
      FROM client_deals d
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND d.status = ?';
      params.push(status);
    }
    if (start_date) {
      query += ' AND d.deal_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND d.deal_date <= ?';
      params.push(end_date);
    }
    if (search) {
      query += ' AND (d.client_name LIKE ? OR d.company_name LIKE ? OR d.client_phone LIKE ? OR d.insta_id LIKE ? OR d.notes LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY d.deal_date DESC, d.id DESC';
    const deals = await safeAll(db.prepare(query), ...params);

    const getServices = db.prepare(`
      SELECT ds.*, s.name as service_name, s.category as service_category
      FROM deal_services ds
      JOIN services s ON ds.service_id = s.id
      WHERE ds.deal_id = ?
    `);

    const getPayments = db.prepare(`
      SELECT * FROM client_payments WHERE deal_id = ? ORDER BY payment_date DESC, id DESC
    `);

    const fullDeals = await Promise.all(deals.map(async (deal) => ({
      ...deal,
      services: await safeAll(getServices, deal.id),
      payments: await safeAll(getPayments, deal.id)
    })));

    res.json(fullDeals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const services = await safeAll(db.prepare(`
      SELECT ds.*, s.name as service_name, s.category as service_category
      FROM deal_services ds
      JOIN services s ON ds.service_id = s.id
      WHERE ds.deal_id = ?
    `), id);

    const payments = await safeAll(db.prepare(`
      SELECT * FROM client_payments WHERE deal_id = ? ORDER BY payment_date DESC, id DESC
    `), id);

    res.json({ ...deal, services, payments });
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

    const dealStmt = db.prepare(`
      INSERT INTO client_deals (client_name, client_phone, client_email, company_name, insta_id, deal_date, duration_months, expiry_date, total_deal_amount, received_amount, pending_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const dealInfo = await dealStmt.run(
      client_name.trim(),
      client_phone ? client_phone.trim() : null,
      client_email ? client_email.trim() : null,
      company_name ? company_name.trim() : null,
      insta_id ? insta_id.trim() : null,
      deal_date,
      durMonths,
      computedExpiry,
      totalAmount,
      initialPaid,
      pendingAmount,
      status,
      notes ? notes.trim() : null
    );

    const dealId = getLastInsertId(dealInfo, 'client_deals');

    if (Array.isArray(services) && services.length > 0) {
      const dsStmt = db.prepare(`
        INSERT INTO deal_services (deal_id, service_id, service_name, agreed_price)
        VALUES (?, ?, ?, ?)
      `);
      for (const s of services) {
        const serviceId = typeof s === 'object' ? s.service_id : s;
        const agreedPrice = typeof s === 'object' && s.agreed_price ? Number(s.agreed_price) : 0;
        const serviceData = await safeGet(db.prepare('SELECT name FROM services WHERE id = ?'), serviceId);
        await dsStmt.run(dealId, serviceId, serviceData ? serviceData.name : 'Custom Service', agreedPrice);
      }
    }

    if (initialPaid > 0) {
      const payStmt = db.prepare(`
        INSERT INTO client_payments (deal_id, amount, payment_date, payment_mode, reference_no, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      await payStmt.run(
        dealId,
        initialPaid,
        deal_date,
        payment_mode || 'UPI',
        payment_reference || null,
        'Initial advance payment'
      );
    }

    const createdDeal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), dealId);
    const linkedServices = await safeAll(db.prepare(`
      SELECT ds.*, s.name as service_name FROM deal_services ds JOIN services s ON ds.service_id = s.id WHERE ds.deal_id = ?
    `), dealId);
    const payments = await safeAll(db.prepare('SELECT * FROM client_payments WHERE deal_id = ?'), dealId);

    res.status(201).json({ ...createdDeal, services: linkedServices, payments });
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

    const currentDeal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
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

    await db.prepare(`
      UPDATE client_deals
      SET client_name = ?, client_phone = ?, client_email = ?, company_name = ?, insta_id = ?, deal_date = ?, duration_months = ?, expiry_date = ?, total_deal_amount = ?, pending_amount = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(
      client_name ? client_name.trim() : currentDeal.client_name,
      client_phone !== undefined ? client_phone : currentDeal.client_phone,
      client_email !== undefined ? client_email : currentDeal.client_email,
      company_name !== undefined ? company_name : currentDeal.company_name,
      insta_id !== undefined ? (insta_id ? insta_id.trim() : null) : currentDeal.insta_id,
      activeDealDate,
      durMonths,
      computedExpiry,
      totalAmount,
      pendingAmount,
      updatedStatus,
      notes !== undefined ? notes : currentDeal.notes,
      id
    );

    if (Array.isArray(services)) {
      await db.prepare('DELETE FROM deal_services WHERE deal_id = ?').run(id);
      const dsStmt = db.prepare(`
        INSERT INTO deal_services (deal_id, service_id, service_name, agreed_price)
        VALUES (?, ?, ?, ?)
      `);
      for (const s of services) {
        const serviceId = typeof s === 'object' ? s.service_id : s;
        const agreedPrice = typeof s === 'object' && s.agreed_price ? Number(s.agreed_price) : 0;
        const serviceData = await safeGet(db.prepare('SELECT name FROM services WHERE id = ?'), serviceId);
        await dsStmt.run(id, serviceId, serviceData ? serviceData.name : 'Custom Service', agreedPrice);
      }
    }

    const updatedDeal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    const linkedServices = await safeAll(db.prepare(`
      SELECT ds.*, s.name as service_name FROM deal_services ds JOIN services s ON ds.service_id = s.id WHERE ds.deal_id = ?
    `), id);
    const payments = await safeAll(db.prepare('SELECT * FROM client_payments WHERE deal_id = ?'), id);

    res.json({ ...updatedDeal, services: linkedServices, payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/deals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM client_deals WHERE id = ?').run(id);
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
    const deal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    await db.prepare(`
      INSERT INTO client_payments (deal_id, amount, payment_date, payment_mode, reference_no, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, payAmount, payment_date, payment_mode || 'UPI', reference_no || null, notes ? notes.trim() : null);

    const totalRecRow = await safeGet(db.prepare('SELECT SUM(amount) as total FROM client_payments WHERE deal_id = ?'), id);
    const totalRec = totalRecRow?.total || 0;
    const newPending = Math.max(0, deal.total_deal_amount - totalRec);
    const newStatus = newPending === 0 ? 'completed' : 'active';

    await db.prepare(`
      UPDATE client_deals
      SET received_amount = ?, pending_amount = ?, status = ?
      WHERE id = ?
    `).run(totalRec, newPending, newStatus, id);

    const updatedDeal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    const payments = await safeAll(db.prepare('SELECT * FROM client_payments WHERE deal_id = ? ORDER BY payment_date DESC, id DESC'), id);

    res.status(201).json({
      message: 'Payment recorded successfully',
      deal: updatedDeal,
      payments,
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
    const payment = await safeGet(db.prepare('SELECT * FROM client_payments WHERE id = ?'), paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const dealId = payment.deal_id;
    await db.prepare('DELETE FROM client_payments WHERE id = ?').run(paymentId);

    const totalRecRow = await safeGet(db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM client_payments WHERE deal_id = ?'), dealId);
    const totalRec = totalRecRow?.total || 0;
    const deal = await safeGet(db.prepare('SELECT total_deal_amount FROM client_deals WHERE id = ?'), dealId);
    const newPending = Math.max(0, deal.total_deal_amount - totalRec);
    const newStatus = newPending === 0 ? 'completed' : 'active';

    await db.prepare(`
      UPDATE client_deals
      SET received_amount = ?, pending_amount = ?, status = ?
      WHERE id = ?
    `).run(totalRec, newPending, newStatus, dealId);

    res.json({ message: 'Payment record deleted and deal balance recalculated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id/lost', async (req, res) => {
  try {
    const { id } = req.params;
    const { loss_reason } = req.body;
    const deal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const reasonText = loss_reason ? loss_reason.trim() : 'Client refused payment / default';
    const updatedNotes = deal.notes 
      ? `[LOST DEAL / BAD DEBT - ${new Date().toLocaleDateString('en-IN')}: ${reasonText}] \n${deal.notes}`
      : `[LOST DEAL / BAD DEBT - ${new Date().toLocaleDateString('en-IN')}: ${reasonText}]`;

    await db.prepare(`
      UPDATE client_deals
      SET status = 'lost', notes = ?
      WHERE id = ?
    `).run(updatedNotes, id);

    const updated = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const newStatus = deal.pending_amount <= 0 ? 'completed' : 'active';
    const updatedNotes = deal.notes 
      ? `[RESTORED ACTIVE DEAL - ${new Date().toLocaleDateString('en-IN')}] \n${deal.notes}`
      : `[RESTORED ACTIVE DEAL - ${new Date().toLocaleDateString('en-IN')}]`;

    await db.prepare(`
      UPDATE client_deals
      SET status = ?, notes = ?
      WHERE id = ?
    `).run(newStatus, updatedNotes, id);

    const updated = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const { close_reason } = req.body || {};
    const deal = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
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

    await db.prepare(`
      UPDATE client_deals
      SET status = 'completed', notes = ?
      WHERE id = ?
    `).run(updatedNotes, id);

    const updated = await safeGet(db.prepare('SELECT * FROM client_deals WHERE id = ?'), id);
    res.json(updated);
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
    
    let expDateFilter = 'WHERE 1=1';
    let payDateFilter = 'WHERE 1=1';
    let dealDateFilter = 'WHERE 1=1';
    const expParams = [];
    const payParams = [];
    const dealParams = [];

    if (startDate) {
      expDateFilter += ' AND e.expense_date >= ?';
      expParams.push(startDate);
      payDateFilter += ' AND p.payment_date >= ?';
      payParams.push(startDate);
      dealDateFilter += ' AND d.deal_date >= ?';
      dealParams.push(startDate);
    }
    if (endDate) {
      expDateFilter += ' AND e.expense_date <= ?';
      expParams.push(endDate);
      payDateFilter += ' AND p.payment_date <= ?';
      payParams.push(endDate);
      dealDateFilter += ' AND d.deal_date <= ?';
      dealParams.push(endDate);
    }

    const totalRegularExpensesRow = await safeGet(db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses e ${expDateFilter}
    `), ...expParams);
    const salDateFilter = expDateFilter.replace(/e\.expense_date/g, 'sp.payment_date');
    const totalSalaryExpensesRow = await safeGet(db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM salary_payments sp WHERE 1=1 ${salDateFilter.replace('WHERE', 'AND')}
    `), ...expParams);

    const totalExpenses = (totalRegularExpensesRow ? totalRegularExpensesRow.total : 0) + (totalSalaryExpensesRow ? totalSalaryExpensesRow.total : 0);

    const totalRevenueRow = await safeGet(db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM client_payments p ${payDateFilter}
    `), ...payParams);
    const totalRevenue = totalRevenueRow ? totalRevenueRow.total : 0;

    const totalDealsRow = await safeGet(db.prepare(`
      SELECT COALESCE(SUM(total_deal_amount), 0) as total, COUNT(*) as count FROM client_deals d ${dealDateFilter}
    `), ...dealParams);
    const totalDealVolume = totalDealsRow ? totalDealsRow.total : 0;
    const totalDealsCount = totalDealsRow ? totalDealsRow.count : 0;

    const receivablesRow = await safeGet(db.prepare(`
      SELECT COALESCE(SUM(pending_amount), 0) as total, COUNT(*) as count 
      FROM client_deals 
      WHERE pending_amount > 0 AND status = 'active'
    `));
    const totalReceivables = receivablesRow ? receivablesRow.total : 0;
    const pendingDealsCount = receivablesRow ? receivablesRow.count : 0;

    const lostRow = await safeGet(db.prepare(`
      SELECT COALESCE(SUM(pending_amount), 0) as total_lost, COUNT(*) as count 
      FROM client_deals 
      WHERE status = 'lost'
    `));
    const totalLostAmount = lostRow ? lostRow.total_lost : 0;
    const lostDealsCount = lostRow ? lostRow.count : 0;

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    const categoryStats = await safeAll(db.prepare(`
      SELECT c.id, c.name, c.color, c.icon, COALESCE(SUM(e.amount), 0) as total_amount, COUNT(e.id) as count
      FROM expense_categories c
      JOIN expenses e ON e.category_id = c.id
      ${expDateFilter}
      GROUP BY c.id, c.name, c.color, c.icon
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `), ...expParams);

    const categoryBreakdown = categoryStats.map(c => ({
      ...c,
      percentage: totalExpenses > 0 ? ((c.total_amount / totalExpenses) * 100).toFixed(1) : 0
    }));

    const serviceStats = await safeAll(db.prepare(`
      SELECT s.id, s.name, s.category, COUNT(ds.id) as deal_count,
        COALESCE(SUM(CASE WHEN ds.agreed_price > 0 THEN ds.agreed_price ELSE s.base_price END), 0) as estimated_revenue
      FROM services s
      JOIN deal_services ds ON ds.service_id = s.id
      JOIN client_deals d ON ds.deal_id = d.id
      ${dealDateFilter}
      GROUP BY s.id, s.name, s.category
      ORDER BY estimated_revenue DESC
    `), ...dealParams);

    const monthlyExpenses = await safeAll(db.prepare(`
      SELECT strftime('%Y-%m', expense_date) as month, SUM(amount) as total_expense
      FROM expenses
      GROUP BY strftime('%Y-%m', expense_date)
      ORDER BY month DESC
      LIMIT 12
    `));

    const monthlyIncome = await safeAll(db.prepare(`
      SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as total_income
      FROM client_payments
      GROUP BY strftime('%Y-%m', payment_date)
      ORDER BY month DESC
      LIMIT 12
    `));

    const monthMap = {};
    monthlyIncome.forEach(i => {
      monthMap[i.month] = { month: i.month, income: i.total_income, expense: 0, profit: i.total_income };
    });
    monthlyExpenses.forEach(e => {
      if (!monthMap[e.month]) {
        monthMap[e.month] = { month: e.month, income: 0, expense: e.total_expense, profit: -e.total_expense };
      } else {
        monthMap[e.month].expense = e.total_expense;
        monthMap[e.month].profit = monthMap[e.month].income - e.total_expense;
      }
    });

    const monthlyTrends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    const paymentModeBreakdown = await safeAll(db.prepare(`
      SELECT payment_mode, SUM(amount) as total, COUNT(*) as count
      FROM expenses e
      ${expDateFilter}
      GROUP BY payment_mode
      ORDER BY total DESC
    `), ...expParams);

    const topPendingClients = await safeAll(db.prepare(`
      SELECT id, client_name, company_name, client_phone, total_deal_amount, received_amount, pending_amount, deal_date
      FROM client_deals
      WHERE pending_amount > 0 AND status = 'active'
      ORDER BY pending_amount DESC
      LIMIT 5
    `));

    const recentExpenses = await safeAll(db.prepare(`
      SELECT e.id, 'expense' as type, e.amount, e.expense_date as date, e.payment_mode, e.description as title, c.name as subtitle, c.color as badge_color
      FROM expenses e
      JOIN expense_categories c ON e.category_id = c.id
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT 10
    `));

    const recentPayments = await safeAll(db.prepare(`
      SELECT p.id, 'income' as type, p.amount, p.payment_date as date, p.payment_mode, d.client_name as title, COALESCE(d.company_name, 'Client Payment') as subtitle, '#10b981' as badge_color
      FROM client_payments p
      JOIN client_deals d ON p.deal_id = d.id
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT 10
    `));

    const recentTransactions = [...recentExpenses, ...recentPayments]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
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

app.get('/api/employees', async (req, res) => {
  try {
    const employees = await safeAll(db.prepare(`
      SELECT 
        e.*,
        COALESCE(SUM(sp.amount), 0) as total_paid_to_date,
        COUNT(sp.id) as payment_count
      FROM employees e
      LEFT JOIN salary_payments sp ON e.id = sp.employee_id
      GROUP BY e.id
      ORDER BY e.status ASC, e.name ASC
    `));
    res.json(employees);
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
    const stmt = db.prepare(`
      INSERT INTO employees (name, job_role, monthly_salary, status, phone, email, joining_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = await stmt.run(
      name.trim(),
      job_role || 'Graphics',
      Number(monthly_salary) || 0,
      status || 'Active',
      phone || '',
      email || '',
      joining_date || new Date().toISOString().split('T')[0],
      notes || ''
    );
    const insertedId = getLastInsertId(info, 'employees');
    const newEmp = await safeGet(db.prepare('SELECT * FROM employees WHERE id = ?'), insertedId);
    res.status(201).json(newEmp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, job_role, monthly_salary, status, phone, email, joining_date, notes } = req.body;
    const stmt = db.prepare(`
      UPDATE employees
      SET name = ?, job_role = ?, monthly_salary = ?, status = ?, phone = ?, email = ?, joining_date = ?, notes = ?
      WHERE id = ?
    `);
    await stmt.run(
      name.trim(),
      job_role || 'Graphics',
      Number(monthly_salary) || 0,
      status || 'Active',
      phone || '',
      email || '',
      joining_date || '',
      notes || '',
      id
    );
    const updated = await safeGet(db.prepare('SELECT * FROM employees WHERE id = ?'), id);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/salaries', async (req, res) => {
  try {
    const { employee_id, month_year } = req.query;
    let query = `
      SELECT sp.*, e.name as employee_name, e.job_role, e.status as employee_status
      FROM salary_payments sp
      JOIN employees e ON sp.employee_id = e.id
    `;
    const conditions = [];
    const params = [];

    if (employee_id) {
      conditions.push('sp.employee_id = ?');
      params.push(employee_id);
    }
    if (month_year) {
      conditions.push('sp.month_year = ?');
      params.push(month_year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY sp.payment_date DESC, sp.id DESC';

    const payments = await safeAll(db.prepare(query), ...params);
    res.json(payments);
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

    const existing = await safeGet(db.prepare(`
      SELECT sp.*, e.name as employee_name 
      FROM salary_payments sp 
      JOIN employees e ON sp.employee_id = e.id 
      WHERE sp.employee_id = ? AND sp.month_year = ?
    `), employee_id, month_year);

    if (existing) {
      return res.status(400).json({ 
        error: `Salary for ${existing.employee_name} for ${month_year} has already been paid (₹${Number(existing.amount).toLocaleString('en-IN')}). Duplicate payments for the same month are not allowed.` 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO salary_payments (employee_id, month_year, amount, payment_date, payment_mode, reference_no, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = await stmt.run(
      employee_id,
      month_year,
      Number(amount),
      payment_date || new Date().toISOString().split('T')[0],
      payment_mode || 'GPay',
      reference_no || '',
      notes || ''
    );
    const insertedId = getLastInsertId(info, 'salary_payments');
    const newSal = await safeGet(db.prepare(`
      SELECT sp.*, e.name as employee_name, e.job_role 
      FROM salary_payments sp JOIN employees e ON sp.employee_id = e.id 
      WHERE sp.id = ?
    `), insertedId);
    res.status(201).json(newSal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/salaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM salary_payments WHERE id = ?').run(id);
    res.json({ success: true, id: Number(id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/salaries/matrix', async (req, res) => {
  try {
    const employees = await safeAll(db.prepare('SELECT * FROM employees ORDER BY id ASC'));
    const payments = await safeAll(db.prepare(`
      SELECT sp.*, e.name as employee_name
      FROM salary_payments sp
      JOIN employees e ON sp.employee_id = e.id
    `));

    const months = [
      'March 2026', 'April 2026', 'May 2026', 'June 2026',
      'July 2026', 'August 2026', 'September 2026', 'October 2026',
      'November 2026', 'December 2026', 'January 2027', 'February 2027'
    ];

    const matrix = employees.map(emp => {
      const row = {
        id: emp.id,
        name: emp.name,
        job_role: emp.job_role,
        monthly_salary: emp.monthly_salary,
        status: emp.status,
        phone: emp.phone,
        monthly_payouts: {}
      };

      months.forEach(m => {
        const empPaymentsForMonth = payments.filter(p => p.employee_id === emp.id && p.month_year === m);
        const totalPaid = empPaymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
        row.monthly_payouts[m] = {
          amount: totalPaid,
          payments: empPaymentsForMonth
        };
      });

      return row;
    });

    res.json({ months, matrix });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import path from 'path';
import { fileURLToPath } from 'url';

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
  console.log(`Gandhi Infosol Finance Server running on http://localhost:${PORT}`);
});

