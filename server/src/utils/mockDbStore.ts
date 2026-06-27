export { isMockDB } from '../config/db';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Food } from '../models/Food';
import { Table } from '../models/Table';
import { Coupon } from '../models/Coupon';
import { Review } from '../models/Review';
import { Reservation } from '../models/Reservation';

export interface UserType {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin' | 'manager' | 'kitchen' | 'delivery';
  isVerified: boolean;
  phone?: string;
  loyaltyPoints: number;
}

export interface FoodType {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discount: number;
  preparationTime: number; // in minutes
  rating: number;
  reviewsCount: number;
  isVeg: boolean;
  isAvailable: boolean;
  image: string;
}

export interface TableType {
  _id: string;
  number: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
  capacity: number;
  currentOrderId?: string;
}

export interface OrderItemType {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

export interface OrderType {
  _id: string;
  orderId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  type: 'Dine In' | 'Takeaway' | 'Home Delivery';
  tableNumber?: number;
  items: OrderItemType[];
  subtotal: number;
  gst: number;
  serviceCharge: number;
  deliveryCharge: number;
  discount: number;
  grandTotal: number;
  status: 'Received' | 'Preparing' | 'Ready' | 'Served' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentMethod: string;
  specialInstructions?: string;
  createdAt: Date;
  deliveryPartnerId?: string;
  otp?: string;
  address?: string;
  phone?: string;
  deliverySubtype?: 'Home' | 'Office';
  companyName?: string;
  floorBlock?: string;
  cabinNumber?: string;
  chefName?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryLocation?: {
    lat: number;
    lng: number;
    progress: number;
  };
}

export interface CouponType {
  _id: string;
  code: string;
  discountPercentage: number;
  minOrderValue: number;
  maxDiscount: number;
  expiryDate: Date;
}

export interface ReviewType {
  _id: string;
  userName: string;
  foodName?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  isApproved: boolean;
}

export interface ReservationType {
  _id: string;
  customerName: string;
  email: string;
  phone: string;
  tableNumber: number;
  guestsCount: number;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}

// In-Memory Collections
export let usersList: UserType[] = [];
export let foodsList: FoodType[] = [];
export let tablesList: TableType[] = [];
export let ordersList: OrderType[] = [];
export let couponsList: CouponType[] = [];
export let reviewsList: ReviewType[] = [];
export let reservationsList: ReservationType[] = [];

// Curated High-Quality Unsplash Images for Andhra Military Hotel Menu Items
const foodImageMap: { [key: string]: string } = {
  // Chicken
  'Chicken Dum Biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
  'Chicken Fry Piece Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  'Chicken Curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  'Chicken Fry': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  'Chicken Roast': 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
  'Chicken 65': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
  'Pepper Chicken': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80',
  'Chicken Lollipop': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80',
  'Uma Chicken Nalla Vepudu': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',

  // Mutton
  'Mutton Biryani': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
  'Mutton Fry': 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80',
  'Mutton Curry': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  'Mutton Keema': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  'Mutton Roast': 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80',
  'Mutton Soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',

  // Biryanis
  'Special Chicken Biryani': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
  'Special Mutton Biryani': 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80',
  'Family Pack Biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
  'Gongura Chicken Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  'Fry Piece Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',

  // Cool Drinks
  'Coca Cola': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  'Pepsi': 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?auto=format&fit=crop&w=600&q=80',
  'Sprite': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'Thums Up': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  'Limca': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'Water Bottle': 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80',
  'Water Bottles': 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80',
  'Fresh Lime Soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'Fruit Juice': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',
  'Fruit Juices': 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80',

  // Desserts
  'Double Ka Meetha': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  'Gulab Jamun': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
  'Ice Cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80',
  'Apricot Delight': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80',

  // Fish Specials
  'Apollo Fish Fry': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=600&q=80',
  'Nellore Chepala Pulusu': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',

  // Egg Specials
  'Guddu Pulusu': 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=600&q=80',

  // Egg Specials
  'Egg Bhurji Fry': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80',

  // Veg Specials
  'Gutti Vankaya Curry': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
  'Tomato Cashew Curry': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80'
};

export const getFoodImage = (name: string): string => {
  const normName = name.trim().toLowerCase();
  
  // Direct matching first
  for (const [key, value] of Object.entries(foodImageMap)) {
    if (key.toLowerCase() === normName) {
      return value;
    }
  }
  
  // Keyword-based fallback matching
  if (normName.includes('mutton biryani') || normName.includes('special mutton biryani')) {
    return foodImageMap['Mutton Biryani'];
  }
  if (normName.includes('chicken biryani') || normName.includes('dum biryani') || normName.includes('biryani')) {
    return foodImageMap['Chicken Dum Biryani'];
  }
  if (normName.includes('chicken fry') || normName.includes('chicken 65')) {
    return foodImageMap['Chicken Fry'];
  }
  if (normName.includes('chicken roast')) {
    return foodImageMap['Chicken Roast'];
  }
  if (normName.includes('chicken curry') || normName.includes('chicken')) {
    return foodImageMap['Chicken Curry'];
  }
  if (normName.includes('mutton fry')) {
    return foodImageMap['Mutton Fry'];
  }
  if (normName.includes('mutton curry') || normName.includes('mutton')) {
    return foodImageMap['Mutton Curry'];
  }
  if (normName.includes('fish fry') || normName.includes('apollo')) {
    return foodImageMap['Apollo Fish Fry'];
  }
  if (normName.includes('fish curry') || normName.includes('pulusu') || normName.includes('chepala')) {
    return foodImageMap['Nellore Chepala Pulusu'];
  }
  if (normName.includes('egg') || normName.includes('guddu')) {
    return foodImageMap['Guddu Pulusu'];
  }
  if (normName.includes('coke') || normName.includes('cola') || normName.includes('pepsi') || normName.includes('sprite') || normName.includes('thums up') || normName.includes('limca')) {
    return foodImageMap['Coca Cola'];
  }
  if (normName.includes('dessert') || normName.includes('jamun') || normName.includes('double') || normName.includes('apricot')) {
    return foodImageMap['Gulab Jamun'];
  }
  
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
};

// Seed Initial Data
export const seedMockData = () => {
  console.log('🌱 Seeding Mock database...');
  
  // 1. Seed Users (passwords hashed using simple tag since it's mock, but we'll use bcrypt.compare fallback)
  // Password is 'admin123' or 'manager123' or 'kitchen123' or 'delivery123' or 'customer123'
  // In the mockDB helper, bcryptjs will be bypassed or simple checks can be done.
  usersList = [
    { _id: 'u1', name: 'Raju Garu (Admin)', email: 'admin@pakkamilitary.com', passwordHash: 'admin123', role: 'admin', isVerified: true, loyaltyPoints: 1000 },
    { _id: 'u2', name: 'Srinivas (Manager)', email: 'manager@pakkamilitary.com', passwordHash: 'manager123', role: 'manager', isVerified: true, loyaltyPoints: 500 },
    { _id: 'u3', name: 'Chef Somaraju (Kitchen)', email: 'kitchen@pakkamilitary.com', passwordHash: 'kitchen123', role: 'kitchen', isVerified: true, loyaltyPoints: 0 },
    { _id: 'u4', name: 'Ramu (Delivery)', email: 'delivery@pakkamilitary.com', passwordHash: 'delivery123', role: 'delivery', isVerified: true, loyaltyPoints: 0 },
    { _id: 'u5', name: 'Vamsi Valluri (Customer)', email: 'customer@gmail.com', passwordHash: 'customer123', role: 'customer', isVerified: true, loyaltyPoints: 120 }
  ];

  // 2. Seed Foods
  const foodData = [
    // Chicken
    { name: 'Chicken Dum Biryani', category: 'Chicken', price: 349, description: 'Classic slow-cooked basmati rice with fragrant spices and tender chicken piece.', time: 20, isVeg: false, rating: 4.8, reviews: 245 },
    { name: 'Chicken Fry Piece Biryani', category: 'Chicken', price: 369, description: 'Spiced biryani rice topped with crispy Andhra style chicken fry pieces.', time: 15, isVeg: false, rating: 4.7, reviews: 189 },
    { name: 'Uma Chicken Nalla Vepudu', category: 'Chicken', price: 299, description: 'Our signature crispy black pepper chicken fry loaded with fresh curry leaves.', time: 15, isVeg: false, rating: 4.9, reviews: 180 },
    { name: 'Chicken Curry', category: 'Chicken', price: 299, description: 'Tender chicken cooked in rich traditional Andhra gravy with heavy spices.', time: 25, isVeg: false, rating: 4.5, reviews: 92 },
    { name: 'Chicken Fry', category: 'Chicken', price: 279, description: 'Dry chicken stir fry with local green chillies, curry leaves, and spices.', time: 15, isVeg: false, rating: 4.6, reviews: 120 },
    { name: 'Chicken Roast', category: 'Chicken', price: 289, description: 'Pan-roasted spicy chicken dry pieces, rich in ghee and black pepper.', time: 18, isVeg: false, rating: 4.7, reviews: 110 },
    { name: 'Chicken 65', category: 'Chicken', price: 259, description: 'Deep fried crispy chicken cubes tossed with yoghurt and red chillies.', time: 12, isVeg: false, rating: 4.4, reviews: 178 },
    { name: 'Pepper Chicken', category: 'Chicken', price: 269, description: 'Stir fry chicken pieces loaded with crushed black pepper and garlic.', time: 15, isVeg: false, rating: 4.6, reviews: 85 },
    { name: 'Chicken Lollipop', category: 'Chicken', price: 249, description: 'Flipped chicken wings shaped into lollipops, deep fried and spicy.', time: 15, isVeg: false, rating: 4.5, reviews: 130 },

    // Mutton
    { name: 'Mutton Biryani', category: 'Mutton', price: 449, description: 'Traditional Military Hotel mutton biryani with short-grain Seeraga Samba rice.', time: 22, isVeg: false, rating: 4.9, reviews: 312 },
    { name: 'Mutton Fry', category: 'Mutton', price: 399, description: 'Succulent mutton cubes roasted with dry spices and fresh curry leaves.', time: 20, isVeg: false, rating: 4.8, reviews: 150 },
    { name: 'Mutton Curry', category: 'Mutton', price: 389, description: 'Rich spicy gravy featuring tender baby goat meat, cooked Andhra style.', time: 25, isVeg: false, rating: 4.7, reviews: 98 },
    { name: 'Mutton Keema', category: 'Mutton', price: 419, description: 'Finely minced mutton cooked with peas and robust local spices.', time: 18, isVeg: false, rating: 4.6, reviews: 76 },
    { name: 'Mutton Roast', category: 'Mutton', price: 399, description: 'Slow pan-roasted mutton pieces infused with Guntur red chilli powder.', time: 22, isVeg: false, rating: 4.8, reviews: 104 },
    { name: 'Mutton Soup', category: 'Mutton', price: 179, description: 'Highly aromatic bone-marrow extract soup, spiced with black pepper.', time: 10, isVeg: false, rating: 4.9, reviews: 205 },

    // Biryanis
    { name: 'Special Chicken Biryani', category: 'Biryanis', price: 389, description: 'Flavourful rice topped with boneless cashew chicken fry.', time: 18, isVeg: false, rating: 4.8, reviews: 340 },
    { name: 'Special Mutton Biryani', category: 'Biryanis', price: 479, description: 'Fragrant Samba rice layered with premium boneless mutton pieces.', time: 20, isVeg: false, rating: 4.9, reviews: 220 },
    { name: 'Family Pack Biryani', category: 'Biryanis', price: 799, description: 'Large pack of Chicken Biryani served with Chicken 65 and gravy, serves 3-4.', time: 30, isVeg: false, rating: 4.7, reviews: 410 },
    { name: 'Gongura Chicken Biryani', category: 'Biryanis', price: 399, description: 'Unique sour-spicy rice layered with sorrel leaves (Gongura) chicken.', time: 20, isVeg: false, rating: 4.8, reviews: 145 },
    { name: 'Fry Piece Biryani', category: 'Biryanis', price: 359, description: 'Military style biryani served with crispy chicken fry pieces.', time: 15, isVeg: false, rating: 4.6, reviews: 280 },

    // Cool Drinks
    { name: 'Coca Cola', category: 'Cool Drinks', price: 40, description: 'Chilled carbonated soft drink 250ml.', time: 2, isVeg: true, rating: 4.5, reviews: 320 },
    { name: 'Pepsi', category: 'Cool Drinks', price: 40, description: 'Chilled soft drink 250ml.', time: 2, isVeg: true, rating: 4.4, reviews: 190 },
    { name: 'Sprite', category: 'Cool Drinks', price: 40, description: 'Lemon-lime flavoured soft drink 250ml.', time: 2, isVeg: true, rating: 4.6, reviews: 240 },
    { name: 'Thums Up', category: 'Cool Drinks', price: 40, description: 'Strong, spicy Indian carbonated cola 250ml.', time: 2, isVeg: true, rating: 4.9, reviews: 520 },
    { name: 'Limca', category: 'Cool Drinks', price: 40, description: 'Cloudy lemon soft drink 250ml.', time: 2, isVeg: true, rating: 4.3, reviews: 90 },
    { name: 'Water Bottle', category: 'Cool Drinks', price: 20, description: '1 Litre mineral water bottle.', time: 1, isVeg: true, rating: 4.8, reviews: 670 },
    { name: 'Fresh Lime Soda', category: 'Cool Drinks', price: 60, description: 'Fizzy soda with fresh lime juice, salt and sugar.', time: 5, isVeg: true, rating: 4.7, reviews: 156 },
    { name: 'Fruit Juice', category: 'Cool Drinks', price: 90, description: 'Freshly squeezed seasonal fruit juices.', time: 7, isVeg: true, rating: 4.6, reviews: 88 },

    // Desserts
    { name: 'Double Ka Meetha', category: 'Desserts', price: 120, description: 'Traditional Hyderabadi bread pudding sweetened with saffron milk.', time: 5, isVeg: true, rating: 4.8, reviews: 142 },
    { name: 'Gulab Jamun', category: 'Desserts', price: 80, description: 'Warm fried milk balls soaked in sweet cardamom sugar syrup (2 pieces).', time: 3, isVeg: true, rating: 4.7, reviews: 215 },
    { name: 'Ice Cream', category: 'Desserts', price: 99, description: 'Scoop of premium vanilla/chocolate ice cream topped with nuts.', time: 3, isVeg: true, rating: 4.5, reviews: 110 },
    { name: 'Apricot Delight', category: 'Desserts', price: 160, description: 'Classic custard dessert served over sweet apricot compote.', time: 6, isVeg: true, rating: 4.9, reviews: 230 },

    // Fish Specials
    { name: 'Apollo Fish Fry', category: 'Fish Specials', price: 349, description: 'Crispy Apollo fish fillets tossed with green chillies, ginger, garlic, and special spices.', time: 15, isVeg: false, rating: 4.8, reviews: 145 },
    { name: 'Nellore Chepala Pulusu', category: 'Fish Specials', price: 389, description: 'Traditional Nellore style tangy, spicy fish curry cooked with raw mango and tamarind juice.', time: 25, isVeg: false, rating: 4.9, reviews: 198 },

    // Egg Specials
    { name: 'Guddu Pulusu', category: 'Egg Specials', price: 199, description: 'Hard boiled eggs simmered in a tangy onion and tamarind gravy with spices.', time: 15, isVeg: false, rating: 4.5, reviews: 78 },
    { name: 'Egg Bhurji Fry', category: 'Egg Specials', price: 149, description: 'Spiced scrambled eggs cooked with green chillies, onions, and curry leaves.', time: 8, isVeg: false, rating: 4.6, reviews: 104 },

    // Veg Specials
    { name: 'Gutti Vankaya Curry', category: 'Veg Specials', price: 249, description: 'Traditional Andhra stuffed eggplant curry in a rich peanut and sesame gravy.', time: 22, isVeg: true, rating: 4.7, reviews: 122 },
    { name: 'Tomato Cashew Curry', category: 'Veg Specials', price: 269, description: 'Rich creamy tomato gravy loaded with fried cashews and local spices.', time: 18, isVeg: true, rating: 4.8, reviews: 94 }
  ];

  foodsList = foodData.map((food, idx) => ({
    _id: `f${idx + 1}`,
    name: food.name,
    description: food.description,
    category: food.category,
    price: food.price,
    discount: food.category === 'Biryanis' || food.category === 'Mutton' ? 10 : 0, // 10% discount on Biryani/Mutton
    preparationTime: food.time,
    rating: food.rating,
    reviewsCount: food.reviews,
    isVeg: food.isVeg,
    isAvailable: true,
    image: getFoodImage(food.name)
  }));


  // 3. Seed Tables (1 to 100)
  for (let i = 1; i <= 100; i++) {
    let status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' = 'Available';
    // Distribute default status for demo variation
    if (i === 5 || i === 25 || i === 44) status = 'Occupied';
    else if (i === 12 || i === 80) status = 'Reserved';
    else if (i === 33 || i === 67) status = 'Cleaning';

    tablesList.push({
      _id: `t${i}`,
      number: i,
      status,
      capacity: i % 4 === 0 ? 6 : (i % 2 === 0 ? 2 : 4)
    });
  }

  // 4. Seed Coupons
  couponsList = [
    { _id: 'c1', code: 'MILITARY10', discountPercentage: 10, minOrderValue: 500, maxDiscount: 100, expiryDate: new Date('2027-12-31') },
    { _id: 'c2', code: 'ANDHRASPECIAL', discountPercentage: 15, minOrderValue: 800, maxDiscount: 200, expiryDate: new Date('2027-12-31') },
    { _id: 'c3', code: 'BIRYANI50', discountPercentage: 20, minOrderValue: 1200, maxDiscount: 300, expiryDate: new Date('2027-12-31') }
  ];

  // 5. Seed Reviews
  reviewsList = [
    { _id: 'r1', userName: 'Karthik S.', rating: 5, comment: 'Best Seeraga Samba mutton biryani in Visakhapatnam! Super authentic.', createdAt: new Date('2026-06-20'), isApproved: true },
    { _id: 'r2', userName: 'Divya T.', rating: 5, comment: 'Uma Chicken Nalla Vepudu is outstanding. Pakka Military, Pakka Fine Dine holds true!', createdAt: new Date('2026-06-22'), isApproved: true },
    { _id: 'r3', userName: 'Anil Kumar', rating: 4, comment: 'Excellent hospitality. Table layout is great and QR ordering was super easy.', createdAt: new Date('2026-06-24'), isApproved: true }
  ];

  // 6. Seed Reservations
  reservationsList = [
    { _id: 'res1', customerName: 'Srinivas V.', email: 'srinivas@gmail.com', phone: '9848022338', tableNumber: 12, guestsCount: 4, date: '2026-06-26', time: '19:30', status: 'Confirmed' }
  ];

  console.log(`✅ Seeded: ${usersList.length} users, ${foodsList.length} food items, ${tablesList.length} tables, ${couponsList.length} coupons.`);
};

// Seeder for real MongoDB Database
export const seedMongoDBData = async () => {
  try {
    const foodCount = await Food.countDocuments();
    if (foodCount > 0) {
      console.log('📚 MongoDB database already has food items. Skipping seeding of new items.');
      
      // Update food image paths with latest Unsplash URLs if they have changed
      const foods = await Food.find();
      let updatedCount = 0;
      for (const food of foods) {
        const latestImage = getFoodImage(food.name);
        if (food.image !== latestImage) {
          food.image = latestImage;
          await food.save();
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} food images to latest Unsplash URLs in MongoDB.`);
      }
      return;
    }

    console.log('🌱 Seeding MongoDB database...');

    // Define foodData inside scope to populate Food model
    const foodData = [
      // Chicken
      { name: 'Chicken Dum Biryani', category: 'Chicken', price: 349, description: 'Classic slow-cooked basmati rice with fragrant spices and tender chicken piece.', time: 20, isVeg: false, rating: 4.8, reviews: 245 },
      { name: 'Chicken Fry Piece Biryani', category: 'Chicken', price: 369, description: 'Spiced biryani rice topped with crispy Andhra style chicken fry pieces.', time: 15, isVeg: false, rating: 4.7, reviews: 189 },
      { name: 'Uma Chicken Nalla Vepudu', category: 'Chicken', price: 299, description: 'Our signature crispy black pepper chicken fry loaded with fresh curry leaves.', time: 15, isVeg: false, rating: 4.9, reviews: 180 },
      { name: 'Chicken Curry', category: 'Chicken', price: 299, description: 'Tender chicken cooked in rich traditional Andhra gravy with heavy spices.', time: 25, isVeg: false, rating: 4.5, reviews: 92 },
      { name: 'Chicken Fry', category: 'Chicken', price: 279, description: 'Dry chicken stir fry with local green chillies, curry leaves, and spices.', time: 15, isVeg: false, rating: 4.6, reviews: 120 },
      { name: 'Chicken Roast', category: 'Chicken', price: 289, description: 'Pan-roasted spicy chicken dry pieces, rich in ghee and black pepper.', time: 18, isVeg: false, rating: 4.7, reviews: 110 },
      { name: 'Chicken 65', category: 'Chicken', price: 259, description: 'Deep fried crispy chicken cubes tossed with yoghurt and red chillies.', time: 12, isVeg: false, rating: 4.4, reviews: 178 },
      { name: 'Pepper Chicken', category: 'Chicken', price: 269, description: 'Stir fry chicken pieces loaded with crushed black pepper and garlic.', time: 15, isVeg: false, rating: 4.6, reviews: 85 },
      { name: 'Chicken Lollipop', category: 'Chicken', price: 249, description: 'Flipped chicken wings shaped into lollipops, deep fried and spicy.', time: 15, isVeg: false, rating: 4.5, reviews: 130 },

      // Mutton
      { name: 'Mutton Biryani', category: 'Mutton', price: 449, description: 'Traditional Military Hotel mutton biryani with short-grain Seeraga Samba rice.', time: 22, isVeg: false, rating: 4.9, reviews: 312 },
      { name: 'Mutton Fry', category: 'Mutton', price: 399, description: 'Succulent mutton cubes roasted with dry spices and fresh curry leaves.', time: 20, isVeg: false, rating: 4.8, reviews: 150 },
      { name: 'Mutton Curry', category: 'Mutton', price: 389, description: 'Rich spicy gravy featuring tender baby goat meat, cooked Andhra style.', time: 25, isVeg: false, rating: 4.7, reviews: 98 },
      { name: 'Mutton Keema', category: 'Mutton', price: 419, description: 'Finely minced mutton cooked with peas and robust local spices.', time: 18, isVeg: false, rating: 4.6, reviews: 76 },
      { name: 'Mutton Roast', category: 'Mutton', price: 399, description: 'Slow pan-roasted mutton pieces infused with Guntur red chilli powder.', time: 22, isVeg: false, rating: 4.8, reviews: 104 },
      { name: 'Mutton Soup', category: 'Mutton', price: 179, description: 'Highly aromatic bone-marrow extract soup, spiced with black pepper.', time: 10, isVeg: false, rating: 4.9, reviews: 205 },

      // Biryanis
      { name: 'Special Chicken Biryani', category: 'Biryanis', price: 389, description: 'Flavourful rice topped with boneless cashew chicken fry.', time: 18, isVeg: false, rating: 4.8, reviews: 340 },
      { name: 'Special Mutton Biryani', category: 'Biryanis', price: 479, description: 'Fragrant Samba rice layered with premium boneless mutton pieces.', time: 20, isVeg: false, rating: 4.9, reviews: 220 },
      { name: 'Family Pack Biryani', category: 'Biryanis', price: 799, description: 'Large pack of Chicken Biryani served with Chicken 65 and gravy, serves 3-4.', time: 30, isVeg: false, rating: 4.7, reviews: 410 },
      { name: 'Gongura Chicken Biryani', category: 'Biryanis', price: 399, description: 'Unique sour-spicy rice layered with sorrel leaves (Gongura) chicken.', time: 20, isVeg: false, rating: 4.8, reviews: 145 },
      { name: 'Fry Piece Biryani', category: 'Biryanis', price: 359, description: 'Military style biryani served with crispy chicken fry pieces.', time: 15, isVeg: false, rating: 4.6, reviews: 280 },

      // Cool Drinks
      { name: 'Coca Cola', category: 'Cool Drinks', price: 40, description: 'Chilled carbonated soft drink 250ml.', time: 2, isVeg: true, rating: 4.5, reviews: 320 },
      { name: 'Pepsi', category: 'Cool Drinks', price: 40, description: 'Chilled soft drink 250ml.', time: 2, isVeg: true, rating: 4.4, reviews: 190 },
      { name: 'Sprite', category: 'Cool Drinks', price: 40, description: 'Lemon-lime flavoured soft drink 250ml.', time: 2, isVeg: true, rating: 4.6, reviews: 240 },
      { name: 'Thums Up', category: 'Cool Drinks', price: 40, description: 'Strong, spicy Indian carbonated cola 250ml.', time: 2, isVeg: true, rating: 4.9, reviews: 520 },
      { name: 'Limca', category: 'Cool Drinks', price: 40, description: 'Cloudy lemon soft drink 250ml.', time: 2, isVeg: true, rating: 4.3, reviews: 90 },
      { name: 'Water Bottle', category: 'Cool Drinks', price: 20, description: '1 Litre mineral water bottle.', time: 1, isVeg: true, rating: 4.8, reviews: 670 },
      { name: 'Fresh Lime Soda', category: 'Cool Drinks', price: 60, description: 'Fizzy soda with fresh lime juice, salt and sugar.', time: 5, isVeg: true, rating: 4.7, reviews: 156 },
      { name: 'Fruit Juice', category: 'Cool Drinks', price: 90, description: 'Freshly squeezed seasonal fruit juices.', time: 7, isVeg: true, rating: 4.6, reviews: 88 },

      // Desserts
      { name: 'Double Ka Meetha', category: 'Desserts', price: 120, description: 'Traditional Hyderabadi bread pudding sweetened with saffron milk.', time: 5, isVeg: true, rating: 4.8, reviews: 142 },
      { name: 'Gulab Jamun', category: 'Desserts', price: 80, description: 'Warm fried milk balls soaked in sweet cardamom sugar syrup (2 pieces).', time: 3, isVeg: true, rating: 4.7, reviews: 215 },
      { name: 'Ice Cream', category: 'Desserts', price: 99, description: 'Scoop of premium vanilla/chocolate ice cream topped with nuts.', time: 3, isVeg: true, rating: 4.5, reviews: 110 },
      { name: 'Apricot Delight', category: 'Desserts', price: 160, description: 'Classic custard dessert served over sweet apricot compote.', time: 6, isVeg: true, rating: 4.9, reviews: 230 },

      // Fish Specials
      { name: 'Apollo Fish Fry', category: 'Fish Specials', price: 349, description: 'Crispy Apollo fish fillets tossed with green chillies, ginger, garlic, and special spices.', time: 15, isVeg: false, rating: 4.8, reviews: 145 },
      { name: 'Nellore Chepala Pulusu', category: 'Fish Specials', price: 389, description: 'Traditional Nellore style tangy, spicy fish curry cooked with raw mango and tamarind juice.', time: 25, isVeg: false, rating: 4.9, reviews: 198 },

      // Egg Specials
      { name: 'Guddu Pulusu', category: 'Egg Specials', price: 199, description: 'Hard boiled eggs simmered in a tangy onion and tamarind gravy with spices.', time: 15, isVeg: false, rating: 4.5, reviews: 78 },
      { name: 'Egg Bhurji Fry', category: 'Egg Specials', price: 149, description: 'Spiced scrambled eggs cooked with green chillies, onions, and curry leaves.', time: 8, isVeg: false, rating: 4.6, reviews: 104 },

      // Veg Specials
      { name: 'Gutti Vankaya Curry', category: 'Veg Specials', price: 249, description: 'Traditional Andhra stuffed eggplant curry in a rich peanut and sesame gravy.', time: 22, isVeg: true, rating: 4.7, reviews: 122 },
      { name: 'Tomato Cashew Curry', category: 'Veg Specials', price: 269, description: 'Rich creamy tomato gravy loaded with fried cashews and local spices.', time: 18, isVeg: true, rating: 4.8, reviews: 94 }
    ];

    // 1. Seed Users (with hashed passwords)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const defaultUsers = [
        { name: 'Raju Garu (Admin)', email: 'admin@pakkamilitary.com', password: 'admin123', role: 'admin', isVerified: true, loyaltyPoints: 1000 },
        { name: 'Srinivas (Manager)', email: 'manager@pakkamilitary.com', password: 'manager123', role: 'manager', isVerified: true, loyaltyPoints: 500 },
        { name: 'Chef Somaraju (Kitchen)', email: 'kitchen@pakkamilitary.com', password: 'kitchen123', role: 'kitchen', isVerified: true, loyaltyPoints: 0 },
        { name: 'Ramu (Delivery)', email: 'delivery@pakkamilitary.com', password: 'delivery123', role: 'delivery', isVerified: true, loyaltyPoints: 0 },
        { name: 'Vamsi Valluri (Customer)', email: 'customer@gmail.com', password: 'customer123', role: 'customer', isVerified: true, loyaltyPoints: 120 }
      ];

      for (const u of defaultUsers) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(u.password, salt);
        const newUser = new User({
          name: u.name,
          email: u.email.toLowerCase(),
          passwordHash,
          role: u.role,
          isVerified: u.isVerified,
          loyaltyPoints: u.loyaltyPoints
        });
        await newUser.save();
      }
      console.log(`✅ Seeded ${defaultUsers.length} users in MongoDB.`);
    }

    // 2. Seed Foods
    const seededFoods = foodData.map((food, idx) => ({
      name: food.name,
      description: food.description,
      category: food.category,
      price: food.price,
      discount: food.category === 'Biryanis' || food.category === 'Mutton' ? 10 : 0,
      preparationTime: food.time,
      rating: food.rating,
      reviewsCount: food.reviews,
      isVeg: food.isVeg,
      isAvailable: true,
      image: getFoodImage(food.name)
    }));

    await Food.insertMany(seededFoods);
    console.log(`✅ Seeded ${seededFoods.length} food items in MongoDB.`);

    // 3. Seed Tables
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tablesToInsert = [];
      for (let i = 1; i <= 100; i++) {
        let status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' = 'Available';
        if (i === 5 || i === 25 || i === 44) status = 'Occupied';
        else if (i === 12 || i === 80) status = 'Reserved';
        else if (i === 33 || i === 67) status = 'Cleaning';

        tablesToInsert.push({
          number: i,
          status,
          capacity: i % 4 === 0 ? 6 : (i % 2 === 0 ? 2 : 4)
        });
      }
      await Table.insertMany(tablesToInsert);
      console.log(`✅ Seeded ${tablesToInsert.length} tables in MongoDB.`);
    }

    // 4. Seed Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      const couponsToInsert = [
        { code: 'MILITARY10', discountPercentage: 10, minOrderValue: 500, maxDiscount: 100, expiryDate: new Date('2027-12-31') },
        { code: 'ANDHRASPECIAL', discountPercentage: 15, minOrderValue: 800, maxDiscount: 200, expiryDate: new Date('2027-12-31') },
        { code: 'BIRYANI50', discountPercentage: 20, minOrderValue: 1200, maxDiscount: 300, expiryDate: new Date('2027-12-31') }
      ];
      await Coupon.insertMany(couponsToInsert);
      console.log(`✅ Seeded ${couponsToInsert.length} coupons in MongoDB.`);
    }

    // 5. Seed Reviews
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      const reviewsToInsert = [
        { userName: 'Karthik S.', rating: 5, comment: 'Best Seeraga Samba mutton biryani in Visakhapatnam! Super authentic.', createdAt: new Date('2026-06-20'), isApproved: true },
        { userName: 'Divya T.', rating: 5, comment: 'Uma Chicken Nalla Vepudu is outstanding. Pakka Military, Pakka Fine Dine holds true!', createdAt: new Date('2026-06-22'), isApproved: true },
        { userName: 'Anil Kumar', rating: 4, comment: 'Excellent hospitality. Table layout is great and QR ordering was super easy.', createdAt: new Date('2026-06-24'), isApproved: true }
      ];
      await Review.insertMany(reviewsToInsert);
      console.log(`✅ Seeded ${reviewsToInsert.length} reviews in MongoDB.`);
    }

    // 6. Seed Reservations
    const reservationCount = await Reservation.countDocuments();
    if (reservationCount === 0) {
      const reservationsToInsert = [
        { customerName: 'Srinivas V.', email: 'srinivas@gmail.com', phone: '9848022338', tableNumber: 12, guestsCount: 4, date: '2026-06-26', time: '19:30', status: 'Confirmed' }
      ];
      await Reservation.insertMany(reservationsToInsert);
      console.log(`✅ Seeded ${reservationsToInsert.length} reservations in MongoDB.`);
    }

    console.log('🟢 MongoDB database seeding complete!');
  } catch (error: any) {
    console.error('🔴 Seeding MongoDB database failed:', error.message);
  }
};

