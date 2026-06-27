import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FoodCard } from '../components/FoodCard';
import { apiCall } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import logo from '../assets/logo.png';
import banner from '../assets/banner.jpg'; // contains "Andhra's Largest Restaurant"
import { Search, SlidersHorizontal, MapPin, Calendar, Users, Clock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user && user.role !== 'customer') {
      if (user.role === 'delivery') navigate('/delivery');
      else if (user.role === 'kitchen') navigate('/kitchen');
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1);
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [vegFilter, setVegFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [priceSort, setPriceSort] = useState<'None' | 'LowHigh' | 'HighLow'>('None');

  // Table reservation form state
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tableNumber, setTableNumber] = useState(1);
  const [guestsCount, setGuestsCount] = useState(2);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // Customer Reviews states
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewFood, setReviewFood] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCall('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          userName: reviewName || undefined,
          foodName: reviewFood || undefined
        })
      });
      setReviewSubmitted(true);
      setReviewComment('');
      setReviewName('');
      setReviewFood('');
      setTimeout(() => setReviewSubmitted(false), 5000);
    } catch (err) {
      alert('Failed to submit review.');
    }
  };

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const data = await apiCall('/foods');
        setFoods(data);
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const data = await apiCall('/reviews/public');
        setReviews(data);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      }
    };

    fetchFoods();
    fetchReviews();
  }, []);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !date || !time) return;

    try {
      await apiCall('/tables/reserve', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          email: email || 'guest@pakkamilitary.com',
          phone,
          tableNumber,
          guestsCount,
          date,
          time
        })
      });
      setReserveSuccess(true);
      setTimeout(() => {
        setReserveSuccess(false);
        setCustomerName('');
        setEmail('');
        setPhone('');
        setDate('');
        setTime('');
      }, 5000);
    } catch (err) {
      alert('Failed to reserve table. Please try again.');
    }
  };

  // Filter & Sort Logic
  const filteredFoods = foods
    .filter((food) => {
      const matchSearch = food.name.toLowerCase().includes(search.toLowerCase()) || 
                          food.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'All' || food.category === categoryFilter;
      const matchVeg = vegFilter === 'All' || 
                       (vegFilter === 'Veg' && food.isVeg) || 
                       (vegFilter === 'Non-Veg' && !food.isVeg);
      return matchSearch && matchCategory && matchVeg;
    })
    .sort((a, b) => {
      const aPrice = a.price * (1 - (a.discount || 0) / 100);
      const bPrice = b.price * (1 - (b.discount || 0) / 100);
      if (priceSort === 'LowHigh') return aPrice - bPrice;
      if (priceSort === 'HighLow') return bPrice - aPrice;
      return 0;
    });

  const categories = ['All', 'Chicken', 'Mutton', 'Biryanis', 'Fish Specials', 'Egg Specials', 'Veg Specials', 'Cool Drinks', 'Desserts'];

  return (
    <div className="flex flex-col min-h-screen bg-cream/35 dark:bg-brown-dark transition-colors duration-300">
      
      {/* 1. Hero Section with Parallax Background */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden">
        {/* Banner Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={banner} 
            alt="Andhra style dishes" 
            className="w-full h-full object-cover filter brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brown via-brown/30 to-transparent" />
        </div>

        {/* Floating food graphic simulation overlay */}
        <div className="absolute top-12 left-10 w-32 h-32 opacity-20 animate-float hidden md:block">
          <img src="https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=150" alt="" className="rounded-full object-cover border border-gold" />
        </div>
        <div className="absolute bottom-20 right-10 w-40 h-40 opacity-25 animate-float hidden md:block" style={{ animationDelay: '2s' }}>
          <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=150" alt="" className="rounded-full object-cover border border-gold" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center gap-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 bg-brown/55 border border-gold/45 px-5 py-2 rounded-full backdrop-blur-md"
          >
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full border border-gold" />
            <span className="text-xs font-bold text-gold uppercase tracking-widest">{t('tagline')}</span>
          </motion.div>

          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-serif text-4xl sm:text-6xl font-extrabold tracking-wide text-cream-light leading-tight text-shadow"
          >
            {t('heroHeading')}
          </motion.h1>

          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-sm sm:text-lg text-cream/80 max-w-2xl leading-relaxed"
          >
            {t('heroSubheading')}
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-4"
          >
            <a 
              href="#menu-section"
              className="px-8 py-3.5 bg-gold text-brown font-extrabold rounded-full hover:bg-gold-dark hover:text-white transition-all shadow-lg pulse-gold-btn border border-gold-dark/40"
            >
              {t('orderFood')}
            </a>
            <a 
              href="#table-booking"
              className="px-8 py-3.5 border-2 border-gold text-gold font-extrabold rounded-full hover:bg-gold hover:text-brown transition-all shadow-lg bg-brown/20 backdrop-blur-sm"
            >
              {t('bookTable')}
            </a>
            <a 
              href="#menu-section"
              className="px-8 py-3.5 text-cream-light font-extrabold hover:text-gold transition-colors"
            >
              {t('exploreMenu')} →
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. Offers & Coupons Banner */}
      <section className="bg-brown text-gold py-6 px-4 md:px-12 border-y border-gold/30 dark:bg-brown-dark transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Sparkles className="animate-spin text-gold" size={24} />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold uppercase tracking-wider text-cream-light">Special Military Offers</span>
              <span className="text-xs text-cream/70">Use coupons on checkout to redeem instant discounts!</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="border border-dashed border-gold/60 px-4 py-1.5 rounded-lg bg-brown-dark/40 flex items-center gap-2">
              <span className="text-xs font-bold text-cream">10% Off:</span>
              <span className="text-sm font-extrabold uppercase tracking-wide">MILITARY10</span>
            </div>
            <div className="border border-dashed border-gold/60 px-4 py-1.5 rounded-lg bg-brown-dark/40 flex items-center gap-2">
              <span className="text-xs font-bold text-cream">15% Off:</span>
              <span className="text-sm font-extrabold uppercase tracking-wide">ANDHRASPECIAL</span>
            </div>
            <div className="border border-dashed border-gold/60 px-4 py-1.5 rounded-lg bg-brown-dark/40 flex items-center gap-2">
              <span className="text-xs font-bold text-cream">20% Off:</span>
              <span className="text-sm font-extrabold uppercase tracking-wide font-serif">BIRYANI50</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Menu Explorer section */}
      <section id="menu-section" className="max-w-7xl mx-auto py-16 px-4 flex flex-col gap-8 w-full">
        <div className="text-center flex flex-col items-center gap-2.5">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wide text-brown dark:text-gold-light">
            Our Military Menu Card
          </h2>
          <div className="w-16 h-1 bg-gold rounded-full" />
          <p className="text-xs text-brown/65 dark:text-cream/60 max-w-md mt-1">
            Choose from authentic spicy chicken starters, traditional samba mutton curries, and regional Andhra biryanis.
          </p>
        </div>

        {/* Filter Controls Panel */}
        <div className="glass-panel border border-gold/25 p-5 rounded-2xl flex flex-col gap-4 shadow-md backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3.5 top-3 text-gold" size={16} />
              <input 
                type="text"
                placeholder="Search Biryanis, Curry, Roast..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-3 bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-full text-brown dark:text-cream-light focus:outline-none focus:border-gold shadow-sm"
              />
            </div>

            {/* Veg Badge filter & Price Sorting */}
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={vegFilter} 
                onChange={(e: any) => setVegFilter(e.target.value)}
                className="text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-full px-4 py-2.5 text-brown dark:text-cream focus:outline-none focus:border-gold"
              >
                <option value="All">All Types</option>
                <option value="Veg">Vegetarian 🟢</option>
                <option value="Non-Veg">Non-Vegetarian 🔴</option>
              </select>

              <select 
                value={priceSort} 
                onChange={(e: any) => setPriceSort(e.target.value)}
                className="text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-full px-4 py-2.5 text-brown dark:text-cream focus:outline-none focus:border-gold"
              >
                <option value="None">Sort: Default</option>
                <option value="LowHigh">Price: Low to High</option>
                <option value="HighLow">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Categories Tab Selector */}
          <div id="categories" className="flex items-center gap-2 overflow-x-auto pb-1 mt-2 scrollbar-none border-t border-gold/10 pt-3">
            <SlidersHorizontal size={14} className="text-gold shrink-0 mr-2" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-5 py-2.5 rounded-full font-semibold border transition-all shrink-0 ${
                  categoryFilter === cat
                  ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown font-extrabold shadow'
                  : 'bg-transparent text-brown border-gold/20 dark:text-cream hover:bg-gold-light/20'
                }`}
              >
                {cat === 'All' ? 'All Items' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gold-light/10 border border-gold/15 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-bold border border-dashed border-gold/20 rounded-xl">
            No dishes found matching your selected filters. Try another category!
          </div>
        ) : (
          <div id="popular-foods" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFoods.map((food) => (
              <FoodCard 
                key={food._id}
                foodId={food._id}
                name={food.name}
                description={food.description}
                category={food.category}
                price={food.price}
                discount={food.discount}
                preparationTime={food.preparationTime}
                rating={food.rating}
                reviewsCount={food.reviewsCount}
                isVeg={food.isVeg}
                isAvailable={food.isAvailable}
                image={food.image}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Table Booking Section */}
      <section id="table-booking" className="bg-brown-dark/5 dark:bg-brown-dark/20 border-t border-b border-gold/15 py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Visual Table layout promo */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-3xl font-extrabold text-brown dark:text-gold-light">
              Table Reservation Desk
            </h3>
            <div className="w-12 h-1 bg-gold rounded-full" />
            <p className="text-sm text-brown/70 dark:text-cream/70 leading-relaxed">
              Our venue features <strong>100 fine-dining tables</strong>. Book your favorite table online to ensure immediate seating on busy military weekends. Scan QR codes at the table to place direct orders instantly.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="p-3 bg-cream-light border border-gold/20 rounded-xl text-center">
                <span className="block text-2xl font-extrabold text-gold font-serif">100</span>
                <span className="text-[10px] text-brown-light font-bold uppercase tracking-wider">Premium Tables</span>
              </div>
              <div className="p-3 bg-cream-light border border-gold/20 rounded-xl text-center">
                <span className="block text-2xl font-extrabold text-gold font-serif">12+</span>
                <span className="text-[10px] text-brown-light font-bold uppercase tracking-wider">Vip Cabins</span>
              </div>
              <div className="p-3 bg-cream-light border border-gold/20 rounded-xl text-center">
                <span className="block text-2xl font-extrabold text-gold font-serif">400</span>
                <span className="text-[10px] text-brown-light font-bold uppercase tracking-wider">Guest Capacity</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 bg-gold/10 border border-gold/25 p-3 rounded-lg text-xs text-gold-dark font-bold">
              <span>💡 Scanning QR-Code automatically selects your table number and bypasses desk queues!</span>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-gold/30 shadow-lg">
            <h4 className="font-serif text-xl font-bold text-brown dark:text-gold-light mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-gold" />
              Book A Table
            </h4>

            {reserveSuccess ? (
              <div className="bg-green-600/10 border border-green-600/30 text-green-600 text-xs p-4 rounded-xl text-center font-bold">
                🎉 Table Reservation successfully submitted! Table {tableNumber} has been reserved. A confirmation email has been simulated.
              </div>
            ) : (
              <form onSubmit={handleReserve} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Table Number (1 - 100)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={100}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(Number(e.target.value))}
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Number of Guests</label>
                  <select 
                    value={guestsCount} 
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none"
                  >
                    <option value={1}>1 Guest</option>
                    <option value={2}>2 Guests</option>
                    <option value={4}>4 Guests</option>
                    <option value={6}>6 Guests</option>
                    <option value={10}>10+ Group</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Date</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-bold text-brown/70 dark:text-cream/70">Preferred Time Slot</label>
                  <input 
                    type="time" 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="p-3 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg text-brown dark:text-cream focus:outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="sm:col-span-2 mt-2 py-3.5 bg-brown text-gold hover:bg-gold hover:text-brown border border-gold font-extrabold rounded-lg shadow-md transition-all uppercase tracking-wider"
                >
                  Confirm Table Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 5. Gallery Section */}
      <section id="gallery" className="max-w-7xl mx-auto py-16 px-4 flex flex-col gap-8 w-full">
        <div className="text-center flex flex-col items-center gap-2.5">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wide text-brown dark:text-gold-light">
            Restaurant Gallery
          </h2>
          <div className="w-16 h-1 bg-gold rounded-full" />
          <p className="text-xs text-brown/65 dark:text-cream/60 mt-1">
            Glimpse of Andhra's largest military dining arena, premium seating, and coastal flavors signature plates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Box 1 - Logo & Branding */}
          <div className="relative group overflow-hidden rounded-2xl border border-gold/25 shadow-md h-80 bg-brown-dark/30">
            <img 
              src={logo} 
              alt="Military Hotel Branding Logo" 
              className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500 bg-cream"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
              <span className="text-gold font-serif text-lg font-bold border-b border-gold pb-1">Military Hotel Signature Seal</span>
            </div>
          </div>

          {/* Box 2 - Andhra's Largest Restaurant dish */}
          <div className="relative group overflow-hidden rounded-2xl border border-gold/25 shadow-md h-80 bg-brown-dark/30">
            <img 
              src={banner} 
              alt="Uma Chicken Nalla Vepudu banner" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
              <span className="text-gold font-serif text-lg font-bold border-b border-gold pb-1">Andhra's Largest Dine-in Arena</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section id="reviews" className="bg-brown dark:bg-brown-dark/80 text-cream py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-2.5">
            <h2 className="font-serif text-3xl font-extrabold text-gold-light tracking-wide">
              Connoisseur Testimonials
            </h2>
            <div className="w-16 h-1 bg-gold rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(reviews.length > 0 ? reviews : [
              { _id: 'r1', userName: 'Karthik S. (Food Critic)', rating: 5, comment: 'The mutton biryani using Seeraga Samba rice is pure magic. It has that authentic military hotel flavour that you rarely find in multi-cuisine spots.' },
              { _id: 'r2', userName: 'Divya T. (Google Guide)', rating: 5, comment: 'Uma Chicken Nalla Vepudu is to die for. Extremely spicy, heavy curry leaf flavor, just the way we make it at home on Visakhapatnam highway.' },
              { _id: 'r3', userName: 'Srinivas V. (Tech Lead)', rating: 5, comment: 'We booked Table 45 for a family lunch. Scanned QR code, ordered 3 Fry Piece Biryanis, and it arrived in 15 mins. Outstanding workflow.' }
            ]).map((rev) => (
              <div key={rev._id} className="p-6 rounded-2xl bg-brown-dark/60 border border-gold/20 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center gap-0.5 text-gold mb-3 text-sm">
                    {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                  </div>
                  <p className="text-xs text-cream/80 leading-relaxed italic mb-4">
                    "{rev.comment}"
                  </p>
                </div>
                <h5 className="font-bold text-gold-light text-[10px] uppercase tracking-wider">
                  - {rev.userName} {rev.foodName ? `(${rev.foodName})` : ''}
                </h5>
              </div>
            ))}
          </div>

          {/* Write a Review Section */}
          <div className="mt-12 max-w-lg mx-auto bg-brown-dark/45 p-6 rounded-3xl border border-gold/25 shadow-xl flex flex-col gap-4 text-xs">
            <h3 className="font-serif text-sm font-bold text-gold-light text-center border-b border-gold/15 pb-2 uppercase tracking-wide">
              Leave a Feast Review
            </h3>
            
            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-600/10 border border-emerald-600/25 rounded-xl text-center text-emerald-400 font-bold">
                🎉 Thank you! Your review has been submitted for verification. It will appear on the wall of testimonials once approved by military hotel POS admin.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gold-light">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ramu Garu" 
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      className="p-2.5 bg-brown border border-gold/20 rounded-lg text-cream focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gold-light">Dish Enjoyed</label>
                    <select
                      value={reviewFood}
                      onChange={(e) => setReviewFood(e.target.value)}
                      className="p-2.5 bg-brown border border-gold/20 rounded-lg text-cream focus:outline-none"
                    >
                      <option value="">Select Dish (Optional)</option>
                      {foods.map((f, i) => (
                        <option key={i} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gold-light">Feast Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-lg transition-transform ${reviewRating >= star ? 'text-gold scale-110' : 'text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gold-light">Review Description</label>
                  <textarea 
                    required 
                    placeholder="Tell others about your culinary experience..." 
                    rows={3} 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="p-2.5 bg-brown border border-gold/20 rounded-lg text-cream focus:outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-gold text-brown hover:bg-gold-dark hover:text-white font-extrabold rounded-lg transition-all uppercase tracking-wider shadow"
                >
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 7. Google Maps Contact Frame */}
      <section id="contact" className="h-[350px] relative w-full border-t border-gold/10">
        <iframe 
          title="Andhra Style Military Hotel Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3800.68652150993!2d83.218482!3d17.6868159!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a39433bf94ecb97%3A0xe54dcf194ef400cc!2sMallepalli%20Vizag%20Highway!5e0!3m2!1sen!2sin!4v1719310000000!5m2!1sen!2sin" 
          className="w-full h-full border-0 filter invert-[0.9] dark:invert-0 grayscale-[0.3]"
          allowFullScreen
          loading="lazy"
        />
      </section>
    </div>
  );
};
