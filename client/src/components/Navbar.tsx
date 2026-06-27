import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingCart, Moon, Sun, Globe, User, LogOut, Menu, X, Clock } from 'lucide-react';
import logo from '../assets/logo.png';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, toggleLanguage, language } = useLanguage();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);

  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Get active dashboard link based on role
  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'manager': return '/manager';
      case 'kitchen': return '/kitchen';
      case 'delivery': return '/delivery';
      case 'customer': return '/my-orders';
      default: return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel shadow-md backdrop-blur-md px-4 py-3 md:px-8 flex justify-between items-center transition-all duration-300">
      {/* Brand Logo & Name */}
      <Link 
        to={user && user.role !== 'customer' ? getDashboardLink() : '/'} 
        onClick={() => {
          if (window.location.pathname === '/' || window.location.pathname === getDashboardLink()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="flex items-center gap-3"
      >
        <img 
          src={logo} 
          alt="Andhra Style Military Hotel Logo" 
          className="w-12 h-12 rounded-full border border-gold object-cover shadow-sm bg-cream animate-pulse"
        />
        <div className="flex flex-col">
          <span className="font-serif text-lg md:text-xl font-bold tracking-wide text-brown dark:text-gold-light">
            {t('logoName')}
          </span>
          <span className="text-[10px] md:text-xs text-red dark:text-gold tracking-widest font-semibold uppercase">
            {t('tagline')}
          </span>
        </div>
      </Link>

      {/* Desktop Links & Actions */}
      {(!user || user.role === 'customer') && (
        <div className="hidden lg:flex items-center gap-8">
          <Link to="/#categories" className="font-medium text-brown hover:text-gold transition-colors duration-200 dark:text-cream-light dark:hover:text-gold">
            {t('categories')}
          </Link>
          <Link to="/#popular-foods" className="font-medium text-brown hover:text-gold transition-colors duration-200 dark:text-cream-light dark:hover:text-gold">
            {t('popularFoods')}
          </Link>
          <Link to="/#gallery" className="font-medium text-brown hover:text-gold transition-colors duration-200 dark:text-cream-light dark:hover:text-gold">
            {t('gallery')}
          </Link>
          <Link to="/#reviews" className="font-medium text-brown hover:text-gold transition-colors duration-200 dark:text-cream-light dark:hover:text-gold">
            {t('reviews')}
          </Link>
          <Link to="/#contact" className="font-medium text-brown hover:text-gold transition-colors duration-200 dark:text-cream-light dark:hover:text-gold">
            {t('contact')}
          </Link>
        </div>
      )}

      <div className="hidden lg:flex items-center gap-4">
        {/* Language Switch */}
        <button 
          onClick={toggleLanguage}
          className="p-2 hover:bg-gold-light/20 rounded-full transition-colors duration-200 text-brown dark:text-cream-light flex items-center gap-1 border border-gold/30 px-3 py-1.5 text-xs font-semibold"
          title="Switch Language"
        >
          <Globe size={16} className="text-gold" />
          <span>{language === 'EN' ? 'తెలుగు' : 'English'}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 hover:bg-gold-light/20 rounded-full transition-colors duration-200 text-brown dark:text-cream-light border border-gold/30"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-brown-light" />}
        </button>

        {/* Shopping Cart */}
        {(!user || user.role === 'customer') && (
          <Link 
            to="/cart" 
            className="relative p-2.5 bg-brown text-gold rounded-full hover:bg-brown-light transition-all duration-200 border border-gold shadow-md flex items-center justify-center group"
            title="View Cart"
          >
            <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-cream shadow">
                {cartItemsCount}
              </span>
            )}
          </Link>
        )}

        {/* Session Portals */}
        {user ? (
          <div className="flex items-center gap-3 border-l border-gold/30 pl-4">
            <Link 
              to={getDashboardLink()} 
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-gold text-brown rounded-full hover:bg-gold-dark hover:text-white transition-all shadow border border-gold-dark/40"
            >
              <User size={14} />
              <span>{user.role === 'customer' ? 'My Orders' : `${user.role.toUpperCase()} Portal`}</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-red-light hover:text-red hover:bg-red-light/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {localStorage.getItem('lastOrderId') && (
              <Link 
                to={`/order-tracking/${localStorage.getItem('lastOrderId')}`}
                className="flex items-center gap-1.5 px-4 py-2 border border-gold/30 hover:bg-gold/10 text-gold rounded-full text-xs font-semibold transition-all"
                title="Track Active Guest Order"
              >
                <Clock size={13} className="animate-spin text-gold" />
                <span>Track Order</span>
              </Link>
            )}
            <Link 
              to="/login"
              className="flex items-center gap-1.5 px-5 py-2 border border-gold bg-transparent text-gold hover:bg-gold hover:text-brown rounded-full text-xs font-bold transition-all shadow"
            >
              <User size={14} />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Burger Menu Button */}
      <div className="flex lg:hidden items-center gap-3">
        {(!user || user.role === 'customer') && (
          <Link to="/cart" className="relative p-2 text-brown dark:text-cream-light">
            <ShoppingCart size={20} />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </Link>
        )}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-brown dark:text-cream-light"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[73px] left-0 w-full glass-panel border-b border-gold/20 flex flex-col p-6 gap-4 shadow-lg lg:hidden animate-fade-in dark:bg-brown-dark/95 z-50">
          {(!user || user.role === 'customer') && (
            <>
              <Link to="/#categories" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold py-2 border-b border-gold/10 text-brown dark:text-cream-light">{t('categories')}</Link>
              <Link to="/#popular-foods" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold py-2 border-b border-gold/10 text-brown dark:text-cream-light">{t('popularFoods')}</Link>
              <Link to="/#gallery" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold py-2 border-b border-gold/10 text-brown dark:text-cream-light">{t('gallery')}</Link>
              <Link to="/#reviews" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold py-2 border-b border-gold/10 text-brown dark:text-cream-light">{t('reviews')}</Link>
              <Link to="/#contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold py-2 border-b border-gold/10 text-brown dark:text-cream-light">{t('contact')}</Link>
            </>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <button 
              onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
              className="flex items-center gap-1 text-xs border border-gold/45 px-3 py-1.5 rounded-full text-brown dark:text-cream-light"
            >
              <Globe size={14} className="text-gold" />
              <span>{language === 'EN' ? 'తెలుగు' : 'English'}</span>
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 border border-gold/45 rounded-full text-brown dark:text-cream-light"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="mt-4">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link 
                  to={getDashboardLink()} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 bg-gold text-brown font-bold rounded-lg shadow-md"
                >
                  <User size={16} />
                  <span>{user.role === 'customer' ? 'MY ORDERS' : `${user.role.toUpperCase()} PORTAL`}</span>
                </Link>
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 py-3 bg-red text-white font-bold rounded-lg shadow-md"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {localStorage.getItem('lastOrderId') && (
                  <Link 
                    to={`/order-tracking/${localStorage.getItem('lastOrderId')}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 bg-brown border border-gold text-gold font-bold rounded-lg"
                  >
                    <Clock size={16} className="animate-spin text-gold" />
                    <span>Track Active Order</span>
                  </Link>
                )}
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 border border-gold text-gold font-bold rounded-lg"
                >
                  <User size={16} />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
