import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  job_role: { type: String, default: 'Graphics' },
  monthly_salary: { type: Number, default: 0 },
  status: { type: String, default: 'Active' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  joining_date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  notes: { type: String, default: '' },
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

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;
