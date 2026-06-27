import { Schema, model } from 'mongoose';

const FoodSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  preparationTime: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  isVeg: { type: Boolean, required: true },
  isAvailable: { type: Boolean, default: true },
  image: { type: String, required: true }
});

export const Food = model('Food', FoodSchema);
