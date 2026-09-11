import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  role: { type: String, default: 'admin' },
  twoFactorSecret: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret.password;
      delete ret.twoFactorSecret;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
