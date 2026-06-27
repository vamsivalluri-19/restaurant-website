import { Schema, model } from 'mongoose';

const ReservationSchema = new Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  tableNumber: { type: Number, required: true },
  guestsCount: { type: Number, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Cancelled'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const Reservation = model('Reservation', ReservationSchema);
