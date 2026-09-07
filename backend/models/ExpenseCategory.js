import mongoose from 'mongoose';

const expenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: 'tag' },
  color: { type: String, default: '#3b82f6' },
  description: { type: String, default: '' },
  is_active: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model('ExpenseCategory', expenseCategorySchema);
export default ExpenseCategory;
