import mongoose from 'mongoose';

const dealServiceSchema = new mongoose.Schema({
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  service_name: { type: String, default: '' },
  agreed_price: { type: Number, default: 0 }
}, { _id: true });

dealServiceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.service_id) ret.service_id = ret.service_id.toString();
    delete ret.__v;
    return ret;
  }
});

const clientDealSchema = new mongoose.Schema({
  client_name: { type: String, required: true, trim: true },
  client_phone: { type: String, default: null },
  client_email: { type: String, default: null },
  company_name: { type: String, default: null },
  insta_id: { type: String, default: null },
  deal_date: { type: String, required: true },
  duration_months: { type: Number, default: 1 },
  expiry_date: { type: String, default: null },
  total_deal_amount: { type: Number, required: true },
  received_amount: { type: Number, default: 0 },
  pending_amount: { type: Number, required: true },
  status: { type: String, default: 'active' },
  notes: { type: String, default: null },
  services: [dealServiceSchema],
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

const ClientDeal = mongoose.models.ClientDeal || mongoose.model('ClientDeal', clientDealSchema);
export default ClientDeal;
