import React, { useEffect, useState } from 'react';
import { subscribeToEvent, unsubscribeFromEvent } from '../services/socket';
import { Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export const Notifications: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    // Listen for socket events
    subscribeToEvent('orderStatusChanged', (order: any) => {
      addToast(`Order #${order.orderId} status updated: ${order.status}`, 'success');
    });

    subscribeToEvent('tableStatusChanged', (table: any) => {
      addToast(`Table #${table.number} is now ${table.status}`, 'info');
    });

    subscribeToEvent('newOrder', (order: any) => {
      addToast(`💥 New Order #${order.orderId} Received! Type: ${order.type} (₹${order.grandTotal})`, 'warning');
    });

    return () => {
      unsubscribeFromEvent('orderStatusChanged');
      unsubscribeFromEvent('tableStatusChanged');
      unsubscribeFromEvent('newOrder');
    };
  }, []);

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-gold" />;
    }
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-brown-dark/95 border border-gold/30 shadow-glass text-cream text-xs backdrop-blur-md"
          >
            <div className="mt-0.5 shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-gold-light">
                {toast.type === 'success' ? 'Update Successful' : 'Military Hotel System'}
              </span>
              <p className="leading-relaxed opacity-90">{toast.message}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
