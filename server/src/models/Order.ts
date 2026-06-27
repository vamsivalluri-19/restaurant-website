import { Schema, model } from 'mongoose';

const OrderItemSchema = new Schema({
  foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  isVeg: { type: Boolean, required: true }
});

const OrderSchema = new Schema({
  orderId: { type: String, required: true, unique: true },
  user: {
    _id: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  type: { 
    type: String, 
    enum: ['Dine In', 'Takeaway', 'Home Delivery'], 
    required: true 
  },
  tableNumber: { type: Number },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  gst: { type: Number, required: true },
  serviceCharge: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Received', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'], 
    default: 'Received' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed'], 
    default: 'Pending' 
  },
  paymentMethod: { type: String, required: true },
  specialInstructions: { type: String },
  deliveryPartnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  otp: { type: String },
  address: { type: String },
  phone: { type: String },
  deliverySubtype: { type: String, enum: ['Home', 'Office'], default: 'Home' },
  companyName: { type: String },
  floorBlock: { type: String },
  cabinNumber: { type: String },
  chefName: { type: String },
  deliveryPartnerName: { type: String },
  deliveryPartnerPhone: { type: String },
  deliveryLocation: {
    lat: { type: Number },
    lng: { type: Number },
    progress: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export const Order = model('Order', OrderSchema);
