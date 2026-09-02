import BetterSqlite from 'better-sqlite3';
import LibSqlite from '@libsql/sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });
const dbPath = path.join(__dirname, 'database.sqlite');

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let db;
try {
  if (tursoUrl && tursoUrl.trim()) {
    let fullUrl = tursoUrl.trim();
    if (tursoToken && tursoToken.trim() && !fullUrl.includes('authToken=')) {
      const separator = fullUrl.includes('?') ? '&' : '?';
      fullUrl = `${fullUrl}${separator}authToken=${tursoToken.trim()}`;
    }
    console.log('⚡ Connecting to Turso Remote Database:', tursoUrl.trim());
    db = new LibSqlite.Database(fullUrl);
    console.log('✅ Successfully connected to Turso Remote Database!');
  } else {
    console.warn('⚠️ TURSO_DATABASE_URL is missing. Using local SQLite (Data will reset on redeploy)!');
    db = new BetterSqlite(dbPath);
  }
} catch (e) {
  console.error('❌ Failed to connect to Turso remote DB, falling back to local SQLite:', e.message);
  db = new BetterSqlite(dbPath);
}

try {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (e) {
  // Ignore pragma unsupported on remote connection
}




// Initialize database schema
export function initDB() {
  db.exec(`
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
      status TEXT DEFAULT 'active', -- active, completed, cancelled, lost
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
      payment_mode TEXT NOT NULL DEFAULT 'UPI', -- UPI, Cash, Bank Transfer, Cheque, Card
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
      status TEXT DEFAULT 'Active', -- Active, Leave
      phone TEXT,
      email TEXT,
      joining_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month_year TEXT NOT NULL, -- e.g. 'August 2026' or '2026-08'
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode TEXT NOT NULL DEFAULT 'GPay', -- GPay, PhonePe, Paytm, Cash
      reference_no TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `);
  // Seed default Services if empty
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  if (serviceCount === 0) {
    const officialServices = [
      // 1. Specialized Creative Solutions (Branding & Identity & Product Labels)
      ['Professional Logo Design', 'Specialized Creative Solutions', 799, 'Custom vector logo design & high-res branding assets'],
      ['Visiting Card Design', 'Specialized Creative Solutions', 399, 'Print-ready double-sided business card layout'],
      ['Smart NFC Business Card', 'Specialized Creative Solutions', 349, 'Digital NFC tap business card setup & link profile'],
      ['Label Design Front', 'Specialized Creative Solutions', 499, 'Front product label packaging design'],
      ['Label Design Front & Back', 'Specialized Creative Solutions', 799, 'Complete front & back product label packaging design'],

      // Digital & Production
      ['Website Development', 'Digital & Production', 9999, 'Starting @ ₹9,999 - Responsive business website / landing page'],
      ['Video Shoot Creation', 'Digital & Production', 1499, '₹1,499 / Per Reel - Professional 4K video shoot & Reel creation'],
      ['Quick Impact Marketing', 'Digital & Production', 499, '₹499 / 1 Day - 1-Day quick impact turnaround marketing campaign'],

      // Meta Ads & Performance
      ['Meta Ads Service', 'Meta Ads & Performance', 6000, '₹6,000 / Month - Facebook & Instagram ad campaign setup, targeting & ROAS management (Ad spend extra)'],
    ];

    const insertService = db.prepare(`
      INSERT INTO services (name, category, base_price, description)
      VALUES (?, ?, ?, ?)
    `);

    for (const s of officialServices) {
      insertService.run(s[0], s[1], s[2], s[3]);
    }
  }

  // Seed default Expense Categories if empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM expense_categories').get().count;
  if (categoryCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO expense_categories (name, icon, color, description)
      VALUES (?, ?, ?, ?)
    `);

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
      insertCat.run(c[0], c[1], c[2], c[3]);
    }
  }
}

export default db;

