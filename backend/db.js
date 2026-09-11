import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import Service from './models/Service.js';
import ExpenseCategory from './models/ExpenseCategory.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expenset';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`🍃 Connected to MongoDB Atlas / Database: ${conn.connection.host}/${conn.connection.name}`);
    await initDB();
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn(`⚠️ Please ensure MONGODB_URI is correctly configured in backend/.env`);
  }
}

export async function initDB() {
  try {
    // Seed default Services if missing
    const officialServices = [
      { name: 'Professional Logo Design', category: 'Specialized Creative Solutions', base_price: 799, description: 'Custom vector logo design & high-res branding assets' },
      { name: 'Visiting Card Design', category: 'Specialized Creative Solutions', base_price: 399, description: 'Print-ready double-sided business card layout' },
      { name: 'Smart NFC Business Card', category: 'Specialized Creative Solutions', base_price: 349, description: 'Digital NFC tap business card setup & link profile' },
      { name: 'Label Design Front', category: 'Specialized Creative Solutions', base_price: 499, description: 'Front product label packaging design' },
      { name: 'Label Design Front & Back', category: 'Specialized Creative Solutions', base_price: 799, description: 'Complete front & back product label packaging design' },
      { name: 'Website Development', category: 'Digital & Production', base_price: 9999, description: 'Starting @ ₹9,999 - Responsive business website / landing page' },
      { name: 'Video Shoot Creation', category: 'Digital & Production', base_price: 1499, description: '₹1,499 / Per Reel - Professional 4K video shoot & Reel creation' },
      { name: 'Quick Impact Marketing', category: 'Digital & Production', base_price: 499, description: '₹499 / 1 Day - 1-Day quick impact turnaround marketing campaign' },
      { name: 'Meta Ads Service', category: 'Meta Ads & Performance', base_price: 6000, description: '₹6,000 / Month - Facebook & Instagram ad campaign setup, targeting & ROAS management (Ad spend extra)' },
    ];

    for (const s of officialServices) {
      await Service.updateOne(
        { name: s.name },
        { $setOnInsert: s },
        { upsert: true }
      );
    }

    // Seed default Expense Categories if missing
    const defaultCategories = [
      { name: 'Food & Refreshments', icon: 'utensils', color: '#f97316', description: 'Team snacks, client dinners, shoot day lunches & coffee' },
      { name: 'Travel & Commute', icon: 'navigation', color: '#06b6d4', description: 'Auto, cab, metro, and local commute for shoots' },
      { name: 'Salesman Travel', icon: 'briefcase', color: '#3b82f6', description: 'Client pitch travel, on-site sales meetings & client visits' },
      { name: 'Office Rent', icon: 'building', color: '#8b5cf6', description: 'Monthly studio and office space rental' },
      { name: 'Fuel & Petrol', icon: 'fuel', color: '#eab308', description: 'Vehicle fuel for field shoots and equipment transport' },
      { name: 'Party & Celebrations', icon: 'party-popper', color: '#ec4899', description: 'Team milestones, festive parties, birthdays & agency outings' },
      { name: 'Software & Subscriptions', icon: 'laptop', color: '#6366f1', description: 'Canva Pro, Adobe Premiere / After Effects, ChatGPT Plus, Midjourney, Hosting' },
      { name: 'Freelancers & Crew Payouts', icon: 'users', color: '#10b981', description: 'Freelance cameramen, voiceover artists, scriptwriters, extra editors' },
      { name: 'Equipment & Studio Rental', icon: 'camera', color: '#14b8a6', description: 'Lens rentals, studio lighting, gimbal, mic & tripod rentals' },
      { name: 'Office Utilities & Internet', icon: 'wifi', color: '#64748b', description: 'High-speed broadband, electricity, drinking water, supplies' },
      { name: 'Meta Ads Ad-Spend', icon: 'trending-up', color: '#f43f5e', description: 'Pre-funded client ad spend balance / agency testing budget' }
    ];

    for (const c of defaultCategories) {
      await ExpenseCategory.updateOne(
        { name: c.name },
        { $setOnInsert: c },
        { upsert: true }
      );
    }

    // Seed default Admin User if no users exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        name: 'Gandhi Infosol Admin',
        role: 'admin'
      });
      await adminUser.save();
      console.log(`👤 Seeded default admin account (Username: admin, Password: ${defaultPassword})`);
    }
  } catch (err) {
    console.error('Error seeding default data:', err.message);
  }
}

export default connectDB;
