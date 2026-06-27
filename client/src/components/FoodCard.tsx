import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../redux/slices/cartSlice';
import { useLanguage } from '../context/LanguageContext';
import { Star, Clock, ShoppingCart, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export interface FoodCardProps {
  foodId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discount: number;
  preparationTime: number;
  rating: number;
  reviewsCount: number;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  foodId,
  name,
  description,
  category,
  price,
  discount,
  preparationTime,
  rating,
  reviewsCount,
  isVeg,
  isAvailable,
  image
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const discountedPrice = discount > 0 ? Math.round(price * (1 - discount / 100)) : price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const resolvedImage = image && image.startsWith('http') ? image : getFoodMockImage();
    dispatch(
      addToCart({
        foodId,
        name,
        price: discountedPrice,
        quantity: 1,
        isVeg,
        image: resolvedImage
      })
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const resolvedImage = image && image.startsWith('http') ? image : getFoodMockImage();
    dispatch(
      addToCart({
        foodId,
        name,
        price: discountedPrice,
        quantity: 1,
        isVeg,
        image: resolvedImage
      })
    );
    navigate('/cart');
  };

  // Select mock photo based on category or index for dynamic visual appeal
  const getFoodMockImage = () => {
    const itemName = name.toLowerCase();
    const catName = category.toLowerCase();

    if (itemName.includes('mutton biryani') || itemName.includes('special mutton biryani')) {
      return 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?q=80&w=400&auto=format&fit=crop'; // Mutton Biryani
    }
    if (itemName.includes('biryani')) {
      return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop'; // Chicken Biryani
    }
    if (itemName.includes('fish curry') || itemName.includes('pulusu')) {
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=400&auto=format&fit=crop'; // Traditional Fish Curry
    }
    if (itemName.includes('fish fry') || itemName.includes('apollo')) {
      return 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?q=80&w=400&auto=format&fit=crop'; // Fish Fry
    }
    if (catName.includes('egg') || itemName.includes('egg') || itemName.includes('guddu')) {
      return 'https://images.unsplash.com/photo-1590412200988-a436bb705300?q=80&w=400&auto=format&fit=crop'; // Egg Curry
    }
    if (catName.includes('veg') || itemName.includes('vankaya') || itemName.includes('cashew')) {
      return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=400&auto=format&fit=crop'; // Veg Curry (Gutti Vankaya)
    }
    if (catName.includes('mutton') || itemName.includes('mutton')) {
      if (itemName.includes('soup')) {
        return 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=400&auto=format&fit=crop'; // Lamb Soup
      }
      return 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=400&auto=format&fit=crop'; // Mutton Fry/Curry
    }
    if (catName.includes('drink') || catName.includes('cool')) {
      return 'https://images.unsplash.com/photo-1497534446932-c925b458314e?q=80&w=400&auto=format&fit=crop'; // Lime Soda / Mocktail
    }
    if (catName.includes('dessert')) {
      return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=400&auto=format&fit=crop'; // Desserts (Gulab Jamun)
    }
    // Default chicken starters/roasts
    return 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=400&auto=format&fit=crop'; // Chicken 65
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col h-full bg-cream-light dark:bg-brown border border-gold/25 rounded-2xl overflow-hidden shadow-md hover:shadow-glass-gold hover:border-gold/50 group transition-all"
    >
      {/* Veg/Non-Veg Badge */}
      <div className="absolute top-4 left-4 z-10 bg-cream/90 backdrop-blur-sm p-1.5 rounded-lg border border-gold/15 flex items-center justify-center">
        <div className={`w-3.5 h-3.5 border-2 ${isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
        </div>
      </div>

      {/* Discount Tag */}
      {discount > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-red text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow border border-cream animate-bounce">
          {discount}% OFF
        </div>
      )}

      {/* Food Image with Parallax & Hover Effect */}
      <div className="h-48 overflow-hidden relative bg-brown-dark/30">
        <img 
          src={image && image.startsWith('http') ? image : getFoodMockImage()} 
          alt={name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brown-dark/85 via-transparent to-transparent opacity-60" />
      </div>

      {/* Card Details */}
      <div className="flex flex-col flex-grow p-5 gap-3.5">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light group-hover:text-gold transition-colors duration-200">
            {name}
          </h3>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
            className="text-gray-400 hover:text-red transition-colors duration-250 p-1"
          >
            <Heart size={20} className={isWishlisted ? 'fill-red text-red' : ''} />
          </button>
        </div>

        <p className="text-xs text-brown/65 dark:text-cream/60 leading-relaxed flex-grow line-clamp-2">
          {description}
        </p>

        {/* Preparation Time, Ratings, Reviews */}
        <div className="flex items-center justify-between text-xs text-brown/85 dark:text-cream/80 border-t border-b border-gold/15 py-2.5">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-gold" />
            <span>{preparationTime} mins</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-gold text-gold" />
            <span className="font-bold">{rating}</span>
            <span className="text-[10px] opacity-75">({reviewsCount})</span>
          </div>
        </div>

        {/* Price & Action Panel */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col">
            {discount > 0 && (
              <span className="text-xs text-brown/45 dark:text-cream/40 line-through">
                ₹{price}
              </span>
            )}
            <span className="text-xl font-extrabold text-red dark:text-gold font-sans">
              ₹{discountedPrice}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isAvailable ? (
              <>
                <button 
                  onClick={handleAddToCart}
                  className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
                    justAdded 
                    ? 'bg-green-600 text-white border border-green-600' 
                    : 'bg-transparent text-gold border border-gold hover:bg-gold hover:text-brown'
                  }`}
                  title={t('addToCart')}
                >
                  <ShoppingCart size={16} />
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="flex items-center gap-1 px-3.5 py-2 bg-brown text-gold hover:bg-brown-light border border-gold rounded-full text-xs font-bold shadow transition-all"
                >
                  <Zap size={13} className="fill-gold" />
                  <span>{t('buyNow')}</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500 font-bold border border-gray-400/30 px-3 py-1.5 rounded-full">
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
