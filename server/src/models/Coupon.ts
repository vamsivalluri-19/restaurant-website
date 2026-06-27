import { Schema, model } from 'mongoose';

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true },
  minOrderValue: { type: Number, required: true },
  maxDiscount: { type: Number, required: true },
  expiryDate: { type: Date, required: true }
});

export const Coupon = model('Coupon', CouponSchema);
