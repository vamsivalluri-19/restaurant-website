import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { RootState } from '../redux/store';
import { apiCall } from '../services/api';
import { addToCart } from '../redux/slices/cartSlice';
import { Clock, ShoppingBag, ArrowLeft, Award, Sparkles, AlertCircle } from 'lucide-react';

export const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserOrders = async () => {
      try {
        const data = await apiCall('/orders/user');
        setOrders(data);
      } catch (err) {
        console.error('Failed to load user orders:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchUserOrders();
  }, [user, navigate]);

  const handleReorder = (orderItems: any[]) => {
    orderItems.forEach((item) => {
      dispatch(
        addToCart({
          foodId: item.foodId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isVeg: !!item.isVeg,
          image: ''
        })
      );
    });
    alert('All items from this order have been added to your cart!');
    navigate('/cart');
  };

  const getActiveOrders = () => {
    return orders.filter((o) => ['Received', 'Preparing', 'Ready'].includes(o.status));
  };

  const getPastOrders = () => {
    return orders.filter((o) => ['Served', 'Completed', 'Cancelled'].includes(o.status));
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 flex flex-col gap-8 w-full min-h-screen text-xs">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-1.5 text-xs font-bold text-brown dark:text-gold hover:text-gold transition-colors self-start"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </button>

      {/* Profile & Loyalty Header */}
      <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 dark:bg-brown/85 bg-cream/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/45 flex items-center justify-center font-serif text-xl font-bold text-gold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <h2 className="font-serif text-lg font-extrabold text-brown dark:text-gold-light">{user.name}</h2>
            <span className="text-[10px] text-gray-500">{user.email}</span>
            <span className="text-[10px] text-red dark:text-gold font-bold uppercase tracking-wider mt-1">{user.role} Account</span>
          </div>
        </div>
        
        {/* Loyalty Points display */}
        <div className="border border-gold/25 p-4 rounded-2xl bg-brown text-gold flex items-center gap-3 shrink-0">
          <div className="p-2 bg-gold/15 rounded-lg border border-gold/30 text-gold animate-pulse">
            <Award size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-cream/70">Loyalty Balance</span>
            <span className="text-lg font-extrabold font-serif text-cream-light">
              {user.loyaltyPoints || 0} <span className="text-xs text-gold">Points</span>
            </span>
            <span className="text-[8px] text-cream/65 mt-0.5 flex items-center gap-1">
              <Sparkles size={9} /> Earn 1 pt per ₹10 spent
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 flex-grow">
          <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 border border-dashed border-gold/25 rounded-2xl flex flex-col items-center gap-3 bg-cream-light/35">
          <AlertCircle size={40} className="text-red" />
          <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light">Failed to load order history</h3>
          <p className="text-[10px] text-gray-500">There was an issue querying the server database. Please refresh or try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Active Orders Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <h3 className="font-serif text-sm font-extrabold text-brown dark:text-gold border-b border-gold/15 pb-2">
              Active Orders ({getActiveOrders().length})
            </h3>
            
            {getActiveOrders().length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gold/25 rounded-2xl flex flex-col items-center gap-3 bg-cream-light/30">
                <Clock size={32} className="text-gold/60" />
                <h4 className="font-serif text-xs font-bold text-brown dark:text-gold-light">No active orders right now</h4>
                <p className="text-[10px] text-gray-500 max-w-xs">
                  Place an order from the menu layout, and it will appear here with live tracking updates.
                </p>
              </div>
            ) : (
              getActiveOrders().map((order) => (
                <div key={order._id} className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-red font-sans">#{order.orderId}</span>
                      <span className="text-[10px] text-gray-500">Placed on: {new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-full font-bold uppercase text-[9px] tracking-wider animate-pulse">
                      {order.status}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="border-t border-b border-gold/15 py-3 flex flex-col gap-1.5 text-brown/85 dark:text-cream/80">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name} <strong>x{item.quantity}</strong></span>
                        <span className="font-sans font-semibold">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-brown dark:text-gold-light text-xs">
                      Grand Total: <span className="text-red font-sans font-extrabold text-sm">₹{order.grandTotal}</span>
                    </span>
                    <Link 
                      to={`/order-tracking/${order._id}`}
                      className="px-4 py-2 bg-brown text-gold border border-gold rounded-lg font-bold hover:bg-gold hover:text-brown transition-all uppercase tracking-wider text-[9px]"
                    >
                      Track Live Status
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Past Orders History Column */}
          <div className="flex flex-col gap-5">
            <h3 className="font-serif text-sm font-extrabold text-brown dark:text-gold border-b border-gold/15 pb-2">
              Order History ({getPastOrders().length})
            </h3>
            
            {getPastOrders().length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gold/20 rounded-xl text-gray-500 font-bold">
                No past orders found.
              </div>
            ) : (
              getPastOrders().map((order) => (
                <div key={order._id} className="glass-panel p-4 rounded-xl border border-gold/15 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brown dark:text-gold-light font-mono">#{order.orderId}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                      order.status === 'Cancelled' 
                        ? 'bg-red/10 text-red border border-red/20' 
                        : 'bg-green-600/10 text-green-600 border border-green-600/20'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Items names list */}
                  <div className="text-[10px] text-gray-500 border-b border-gold/10 pb-2">
                    {order.items.map((i: any) => i.name).join(', ')}
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold font-sans">₹{order.grandTotal}</span>
                    <button
                      onClick={() => handleReorder(order.items)}
                      disabled={order.status === 'Cancelled'}
                      className="text-red font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      Reorder Item(s)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};
