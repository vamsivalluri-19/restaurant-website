import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image: string;
}

interface Coupon {
  code: string;
  discountPercentage: number;
  minOrderValue: number;
  maxDiscount: number;
}

interface CartState {
  items: CartItem[];
  savedForLater: CartItem[];
  orderType: 'Dine In' | 'Takeaway' | 'Home Delivery';
  tableNumber: number | null;
  coupon: Coupon | null;
  orderNotes: string;
  updatingOrderId: string | null;
  updatingOrderFriendlyId: string | null;
}

const initialState: CartState = {
  items: [],
  savedForLater: [],
  orderType: 'Dine In',
  tableNumber: null,
  coupon: null,
  orderNotes: '',
  updatingOrderId: null,
  updatingOrderFriendlyId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((item) => item.foodId === action.payload.foodId);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.foodId !== action.payload);
    },
    updateQuantity(state, action: PayloadAction<{ foodId: string; quantity: number }>) {
      const item = state.items.find((i) => i.foodId === action.payload.foodId);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
      state.orderNotes = '';
      state.updatingOrderId = null;
      state.updatingOrderFriendlyId = null;
    },
    loadOrderIntoCart(state, action: PayloadAction<{ id: string; friendlyId: string; items: CartItem[]; orderType: 'Dine In' | 'Takeaway' | 'Home Delivery'; tableNumber: number | null; notes: string }>) {
      state.updatingOrderId = action.payload.id;
      state.updatingOrderFriendlyId = action.payload.friendlyId;
      state.items = action.payload.items;
      state.orderType = action.payload.orderType;
      state.tableNumber = action.payload.tableNumber;
      state.orderNotes = action.payload.notes;
    },
    setOrderType(state, action: PayloadAction<'Dine In' | 'Takeaway' | 'Home Delivery'>) {
      state.orderType = action.payload;
      if (action.payload !== 'Dine In') {
        state.tableNumber = null;
      }
    },
    setTableNumber(state, action: PayloadAction<number | null>) {
      state.tableNumber = action.payload;
      if (action.payload !== null) {
        state.orderType = 'Dine In';
      }
    },
    applyCoupon(state, action: PayloadAction<Coupon | null>) {
      state.coupon = action.payload;
    },
    setOrderNotes(state, action: PayloadAction<string>) {
      state.orderNotes = action.payload;
    },
    saveForLater(state, action: PayloadAction<string>) {
      const idx = state.items.findIndex(item => item.foodId === action.payload);
      if (idx !== -1) {
        const item = state.items[idx];
        const alreadySaved = state.savedForLater.find(s => s.foodId === item.foodId);
        if (!alreadySaved) {
          state.savedForLater.push(item);
        }
        state.items.splice(idx, 1);
      }
    },
    moveToCart(state, action: PayloadAction<string>) {
      const idx = state.savedForLater.findIndex(item => item.foodId === action.payload);
      if (idx !== -1) {
        const item = state.savedForLater[idx];
        const alreadyInCart = state.items.find(i => i.foodId === item.foodId);
        if (alreadyInCart) {
          alreadyInCart.quantity += item.quantity;
        } else {
          state.items.push(item);
        }
        state.savedForLater.splice(idx, 1);
      }
    },
    removeSaved(state, action: PayloadAction<string>) {
      state.savedForLater = state.savedForLater.filter(item => item.foodId !== action.payload);
    }
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  loadOrderIntoCart,
  setOrderType, 
  setTableNumber, 
  applyCoupon,
  setOrderNotes,
  saveForLater,
  moveToCart,
  removeSaved
} = cartSlice.actions;

export default cartSlice.reducer;
const selectCartItems = (state: { cart: CartState }) => state.cart.items;
const selectCartOrderType = (state: { cart: CartState }) => state.cart.orderType;
const selectCartCoupon = (state: { cart: CartState }) => state.cart.coupon;

export const selectCartTotals = createSelector(
  [selectCartItems, selectCartOrderType, selectCartCoupon],
  (items, orderType, coupon) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const serviceCharge = orderType === 'Dine In' ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
    const deliveryCharge = orderType === 'Home Delivery' ? 40 : 0;
    
    let discount = 0;
    if (coupon && subtotal >= coupon.minOrderValue) {
      discount = Math.min(Math.round(subtotal * (coupon.discountPercentage / 100) * 100) / 100, coupon.maxDiscount);
    }
    
    const grandTotal = Math.max(0, Math.round((subtotal + gst + serviceCharge + deliveryCharge - discount) * 100) / 100);
    
    return {
      subtotal,
      gst,
      serviceCharge,
      deliveryCharge,
      discount,
      grandTotal,
    };
  }
);
