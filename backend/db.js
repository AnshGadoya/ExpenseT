import { createClient } from '@libsql/client';
import BetterSqlite from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

const dbPath = path.join(__dirname, 'database.sqlite');
const rawUrl = process.env.TURSO_DATABASE_URL;
const rawToken = process.env.TURSO_AUTH_TOKEN;

const tursoUrl = rawUrl ? rawUrl.trim().replace(/^["']|["']$/g, '') : '';
const tursoToken = rawToken ? rawToken.trim().replace(/^["']|["']$/g, '') : '';

let client = null;
let localDb = null;
let isTurso = false;

if (tursoUrl) {
  try {
    console.log('⚡ Connecting to Turso Remote Database:', tursoUrl);
    client = createClient({ url: tursoUrl, authToken: tursoToken });
    isTurso = true;
    console.log('✅ Successfully connected to Turso Remote Database via @libsql/client!');
  } catch (e) {
    console.error('❌ Failed to connect to Turso remote DB, falling back to local SQLite:', e.message);
    localDb = new BetterSqlite(dbPath);
  }
} else {
  console.warn('⚠️ TURSO_DATABASE_URL is missing. Using local SQLite (Data will reset on redeploy)!');
  localDb = new BetterSqlite(dbPath);
}

export async function dbAll(sql, params = []) {
  if (isTurso && client) {
    const res = await client.execute({ sql, args: params });
    return res.rows ? Array.from(res.rows) : [];
  } else {
    return localDb.prepare(sql).all(...params);
  }
}

export async function dbGet(sql, params = []) {
  if (isTurso && client) {
    const res = await client.execute({ sql, args: params });
    return (res.rows && res.rows[0]) ? res.rows[0] : null;
  } else {
    return localDb.prepare(sql).get(...params) || null;
  }
}

export async function dbRun(sql, params = []) {
  if (isTurso && client) {
    const res = await client.execute({ sql, args: params });
    return { lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : null, changes: Number(res.rowsAffected) };
  } else {
    const info = localDb.prepare(sql).run(...params);
    return { lastInsertRowid: info.lastInsertRowid, changes: info.changes };
  }
}

export async function dbExec(sql) {
  if (isTurso && client) {
    await client.executeMultiple(sql);
  } else {
    localDb.exec(sql);
  }
}

// Universal database export object for compatibility
const db = {
  prepare: (sql) => ({
    all: (...params) => dbAll(sql, params),
    get: (...params) => dbGet(sql, params),
    run: (...params) => dbRun(sql, params),
  }),
  exec: (sql) => dbExec(sql),
};

export default db;

// Initialize database schema
export async function initDB() {
  await dbExec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT DEFAULT 'Digital Marketing',
      base_price REAL DEFAULT 0,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'tag',
      color TEXT DEFAULT '#3b82f6',
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      client_email TEXT,
      company_name TEXT,
      insta_id TEXT,
      deal_date DATE NOT NULL,
      duration_months INTEGER DEFAULT 1,
      expiry_date DATE,
      total_deal_amount REAL NOT NULL,
      received_amount REAL DEFAULT 0,
      pending_amount REAL NOT NULL,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deal_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      service_name TEXT,
      agreed_price REAL DEFAULT 0,
      FOREIGN KEY (deal_id) REFERENCES client_deals(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS client_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode TEXT NOT NULL DEFAULT 'UPI',
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (deal_id) REFERENCES client_deals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      payment_mode TEXT NOT NULL DEFAULT 'GPay',
      description TEXT NOT NULL,
      paid_to TEXT,
      receipt_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      job_role TEXT NOT NULL DEFAULT 'Graphics',
      monthly_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      phone TEXT,
      email TEXT,
      joining_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month_year TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode TEXT NOT NULL DEFAULT 'GPay',
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);

  // Seed default Services if missing
  const officialServices = [
    ['Professional Logo Design', 'Specialized Creative Solutions', 799, 'Custom vector logo design & high-res branding assets'],
    ['Visiting Card Design', 'Specialized Creative Solutions', 399, 'Print-ready double-sided business card layout'],
    ['Smart NFC Business Card', 'Specialized Creative Solutions', 349, 'Digital NFC tap business card setup & link profile'],
    ['Label Design Front', 'Specialized Creative Solutions', 499, 'Front product label packaging design'],
    ['Label Design Front & Back', 'Specialized Creative Solutions', 799, 'Complete front & back product label packaging design'],
    ['Website Development', 'Digital & Production', 9999, 'Starting @ ₹9,999 - Responsive business website / landing page'],
    ['Video Shoot Creation', 'Digital & Production', 1499, '₹1,499 / Per Reel - Professional 4K video shoot & Reel creation'],
    ['Quick Impact Marketing', 'Digital & Production', 499, '₹499 / 1 Day - 1-Day quick impact turnaround marketing campaign'],
    ['Meta Ads Service', 'Meta Ads & Performance', 6000, '₹6,000 / Month - Facebook & Instagram ad campaign setup, targeting & ROAS management (Ad spend extra)'],
  ];

  for (const s of officialServices) {
    await dbRun(`
      INSERT OR IGNORE INTO services (name, category, base_price, description)
      VALUES (?, ?, ?, ?)
    `, [s[0], s[1], s[2], s[3]]);
  }

  // Seed default Expense Categories if missing
  const defaultCategories = [
    ['Food & Refreshments', 'utensils', '#f97316', 'Team snacks, client dinners, shoot day lunches & coffee'],
    ['Travel & Commute', 'navigation', '#06b6d4', 'Auto, cab, metro, and local commute for shoots'],
    ['Salesman Travel', 'briefcase', '#3b82f6', 'Client pitch travel, on-site sales meetings & client visits'],
    ['Office Rent', 'building', '#8b5cf6', 'Monthly studio and office space rental'],
    ['Fuel & Petrol', 'fuel', '#eab308', 'Vehicle fuel for field shoots and equipment transport'],
    ['Party & Celebrations', 'party-popper', '#ec4899', 'Team milestones, festive parties, birthdays & agency outings'],
    ['Software & Subscriptions', 'laptop', '#6366f1', 'Canva Pro, Adobe Premiere / After Effects, ChatGPT Plus, Midjourney, Hosting'],
    ['Freelancers & Crew Payouts', 'users', '#10b981', 'Freelance cameramen, voiceover artists, scriptwriters, extra editors'],
    ['Equipment & Studio Rental', 'camera', '#14b8a6', 'Lens rentals, studio lighting, gimbal, mic & tripod rentals'],
    ['Office Utilities & Internet', 'wifi', '#64748b', 'High-speed broadband, electricity, drinking water, supplies'],
    ['Meta Ads Ad-Spend', 'trending-up', '#f43f5e', 'Pre-funded client ad spend balance / agency testing budget']
  ];

  for (const c of defaultCategories) {
    await dbRun(`
      INSERT OR IGNORE INTO expense_categories (name, icon, color, description)
      VALUES (?, ?, ?, ?)
    `, [c[0], c[1], c[2], c[3]]);
  }
}
