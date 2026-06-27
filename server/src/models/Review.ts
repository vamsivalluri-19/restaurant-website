import { Schema, model } from 'mongoose';

const ReviewSchema = new Schema({
  userName: { type: String, required: true },
  foodName: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false }
});

export const Review = model('Review', ReviewSchema);
