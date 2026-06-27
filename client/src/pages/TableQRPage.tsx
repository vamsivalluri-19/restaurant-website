import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setTableNumber, setOrderType } from '../redux/slices/cartSlice';
import { apiCall } from '../services/api';
import logo from '../assets/logo.png';
import { Clock, Info, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const TableQRPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [tableName, setTableName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const initTableSession = async () => {
      try {
        const num = Number(id);
        if (isNaN(num) || num < 1 || num > 100) {
          setError(true);
          setLoading(false);
          return;
        }

        // Fetch table verification from backend
        const table = await apiCall(`/tables/${num}`);
        
        // Dispatch to Redux cart store
        dispatch(setTableNumber(table.number));
        dispatch(setOrderType('Dine In'));
        
        setTableName(`Table ${table.number}`);
      } catch (err) {
        console.error('QR activation failed:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    initTableSession();
  }, [id, dispatch]);

  const handleStartOrdering = () => {
    navigate('/#menu-section');
    // Scroll down to the menu section
    setTimeout(() => {
      const element = document.getElementById('menu-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-cream/40 dark:bg-brown-dark flex items-center justify-center p-4">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-brown dark:text-gold-light">Verifying Dining Session...</span>
        </div>
      ) : error ? (
        <div className="glass-panel border-red/30 p-8 rounded-2xl max-w-sm text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red/10 border border-red/30 flex items-center justify-center text-red font-extrabold text-2xl">
            !
          </div>
          <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light">Table Session Error</h3>
          <p className="text-xs text-brown/70 dark:text-cream/70">
            This QR code references an invalid table. Please contact military staff at the front desk.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg text-xs font-bold transition-all"
          >
            Go to Homepage
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel border-gold/30 p-8 rounded-3xl max-w-md w-full text-center flex flex-col items-center gap-6 shadow-glass-gold"
        >
          <img src={logo} alt="Logo" className="w-20 h-20 rounded-full border border-gold animate-bounce" />
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-red dark:text-gold font-extrabold tracking-widest uppercase">Pakka Military Dining</span>
            <h2 className="font-serif text-3xl font-extrabold text-brown dark:text-gold-light">
              Welcome to {tableName}
            </h2>
          </div>

          <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left text-xs">
            <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">QR Session Activated Successfully</span>
              <p className="text-brown/75 dark:text-cream/70 leading-relaxed">
                You do not need to manually choose tables or register. Your items will be delivered directly to <strong>{tableName}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-brown/70 dark:text-cream/70 border-t border-b border-gold/15 py-3.5 w-full justify-center">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gold" />
              <span>Direct Kitchen Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Info size={14} className="text-gold" />
              <span>Auto Bill Invoicing</span>
            </div>
          </div>

          <button 
            onClick={handleStartOrdering}
            className="w-full py-4 bg-brown text-gold hover:bg-gold hover:text-brown border border-gold rounded-full text-sm font-extrabold transition-all shadow-md uppercase tracking-wider pulse-gold-btn"
          >
            Start Digital Ordering
          </button>
        </motion.div>
      )}
    </div>
  );
};
