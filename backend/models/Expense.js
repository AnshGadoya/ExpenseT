import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  amount: { type: Number, required: true },
  expense_date: { type: String, required: true },
  payment_mode: { type: String, default: 'GPay' },
  description: { type: String, required: true, trim: true },
  paid_to: { type: String, default: null },
  receipt_no: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.category_id && typeof ret.category_id === 'object' && ret.category_id._id) {
        ret.category_name = ret.category_id.name;
        ret.category_color = ret.category_id.color;
        ret.category_icon = ret.category_id.icon;
        ret.category_id = ret.category_id._id.toString();
      } else if (ret.category_id) {
        ret.category_id = ret.category_id.toString();
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
export default Expense;
