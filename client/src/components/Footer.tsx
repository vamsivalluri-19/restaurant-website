import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Phone, MapPin, Clock, ShieldCheck, Heart, Award } from 'lucide-react';
import logo from '../assets/logo.png';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="bg-brown text-cream-light border-t-2 border-gold pt-16 pb-8 px-4 md:px-12 dark:bg-brown-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        {/* About column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-14 h-14 rounded-full border border-gold" />
            <div>
              <h3 className="font-serif text-lg font-bold tracking-wide text-gold-light">{t('logoName')}</h3>
              <p className="text-[10px] text-gold tracking-widest font-semibold uppercase">{t('tagline')}</p>
            </div>
          </div>
          <p className="text-sm text-cream/70 leading-relaxed mt-2">
            Bringing the authentic taste of Andhra Military Hotels directly to your table. Crafted with hand-ground spices and fresh local produce, we offer fine dining experience with traditional soul.
          </p>
          <div className="flex items-center gap-3 mt-2 text-gold">
            <Award size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Coastal Andhra Flavors Excellence Award</span>
          </div>
        </div>

        {/* Contact info column */}
        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-gold font-semibold text-lg border-b border-gold/20 pb-2">Get In Touch</h4>
          
          <div className="flex items-start gap-3 mt-2">
            <MapPin className="text-gold mt-1 shrink-0" size={18} />
            <div className="text-sm text-cream/80">
              <p className="font-bold">Mallepalli Vizag High Way</p>
              <p>Andhra Pradesh, India</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="text-gold shrink-0" size={18} />
            <a href="tel:+919736222999" className="text-sm text-cream/80 hover:text-gold transition-colors font-bold">+91 9736222999</a>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="text-gold mt-0.5 shrink-0" size={18} />
            <div className="text-sm text-cream/80">
              <p className="font-bold">Military Timings</p>
              <p>Everyday: 11:00 AM - 11:00 PM</p>
            </div>
          </div>
        </div>

        {/* Categories Quick Links */}
        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-gold font-semibold text-lg border-b border-gold/20 pb-2">Military Specialties</h4>
          <ul className="text-sm text-cream/70 space-y-2.5">
            <li><a href="#popular-foods" className="hover:text-gold transition-colors">Chicken Dum Biryani</a></li>
            <li><a href="#popular-foods" className="hover:text-gold transition-colors">Mutton Seeraga Samba Biryani</a></li>
            <li><a href="#popular-foods" className="hover:text-gold transition-colors">Uma Chicken Nalla Vepudu</a></li>
            <li><a href="#popular-foods" className="hover:text-gold transition-colors">Gongura Fry Piece Biryani</a></li>
            <li><a href="#popular-foods" className="hover:text-gold transition-colors">Double Ka Meetha</a></li>
          </ul>
        </div>

        {/* Booking and Trust */}
        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-gold font-semibold text-lg border-b border-gold/20 pb-2">Military Safety</h4>
          <p className="text-sm text-cream/70 leading-relaxed">
            We adhere to strict military-grade kitchen hygiene and double safety checks on all home delivery orders.
          </p>
          <div className="flex items-center gap-2.5 p-3 bg-brown-dark/50 border border-gold/20 rounded-lg mt-2">
            <ShieldCheck className="text-gold shrink-0" size={20} />
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-gold-light">100% Certified Safe Dine & Order</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gold/15 pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-cream/45">
        <p>© 2026 Andhra Style Pakka Military Hotel. All Rights Reserved.</p>
        <p className="flex items-center gap-1.5 mt-3 sm:mt-0">
          Made with <Heart size={12} className="text-red animate-pulse" /> for food connoisseurs. MNCY Hospitality Group.
        </p>
      </div>
    </footer>
  );
};
