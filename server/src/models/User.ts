import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'manager', 'kitchen', 'delivery'], 
    default: 'customer' 
  },
  isVerified: { type: Boolean, default: false },
  phone: { type: String },
  loyaltyPoints: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const User = model('User', UserSchema);
