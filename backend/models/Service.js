import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, default: 'Digital Marketing' },
  base_price: { type: Number, default: 0 },
  description: { type: String, default: '' },
  pricing_type: { type: String, default: 'month_wise', enum: ['month_wise', 'qty_wise'] },
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

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;
