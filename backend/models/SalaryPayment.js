import mongoose from 'mongoose';

const salaryPaymentSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month_year: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_date: { type: String, required: true },
  payment_mode: { type: String, default: 'GPay' },
  reference_no: { type: String, default: '' },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      if (ret.employee_id && typeof ret.employee_id === 'object' && ret.employee_id._id) {
        ret.employee_name = ret.employee_id.name;
        ret.job_role = ret.employee_id.job_role;
        ret.employee_status = ret.employee_id.status;
        ret.employee_id = ret.employee_id._id.toString();
      } else if (ret.employee_id) {
        ret.employee_id = ret.employee_id.toString();
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

const SalaryPayment = mongoose.models.SalaryPayment || mongoose.model('SalaryPayment', salaryPaymentSchema);
export default SalaryPayment;
