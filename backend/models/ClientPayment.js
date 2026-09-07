import mongoose from 'mongoose';

const clientPaymentSchema = new mongoose.Schema({
  deal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientDeal', required: true },
  amount: { type: Number, required: true },
  payment_date: { type: String, required: true },
  payment_mode: { type: String, default: 'UPI' },
  reference_no: { type: String, default: null },
  notes: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.deal_id) ret.deal_id = ret.deal_id.toString();
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

const ClientPayment = mongoose.models.ClientPayment || mongoose.model('ClientPayment', clientPaymentSchema);
export default ClientPayment;
