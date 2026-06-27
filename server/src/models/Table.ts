import { Schema, model } from 'mongoose';

const TableSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['Available', 'Occupied', 'Reserved', 'Cleaning'], 
    default: 'Available' 
  },
  capacity: { type: Number, required: true },
  currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' }
});

export const Table = model('Table', TableSchema);
