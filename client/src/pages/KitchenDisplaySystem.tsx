import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/api';
import { subscribeToEvent, unsubscribeFromEvent } from '../services/socket';
import { Clock, Play, CheckCircle, ChefHat, Check, Info } from 'lucide-react';

const RECIPE_GUIDES: { [key: string]: { description: string; ingredients: string; garnish: string } } = {
  "Gulab Jamun": {
    description: "Classic sweet dumplings in warm cardamom sugar syrup.",
    ingredients: "2x Gulab Jamun balls, warm cardamom sugar syrup.",
    garnish: "Pistachio slivers, served hot in clay pottery."
  },
  "Nellore Chepala Pulusu": {
    description: "Traditional tangy Andhra fish curry prepared with raw mango and sour tamarind.",
    ingredients: "Tengra/Murrel fish pieces, tamarind pulp, raw mango wedges, green chilies.",
    garnish: "Fresh hand-torn curry leaves and a slit green chili."
  },
  "Chicken Roast": {
    description: "Spicy dry-fried chicken coated in Guntur red chili paste.",
    ingredients: "Chicken breast blocks, dry spices, Guntur chili powder, curry leaves.",
    garnish: "Red onion rings, fresh lemon wedge, raw coriander."
  },
  "Mutton Biryani": {
    description: "Authentic military style Seeraga Samba rice mutton biryani.",
    ingredients: "Samba rice, tender goat meat cubes, fresh mint, pure ghee, curds.",
    garnish: "1x Boiled egg half, fried crispy onions, served with Raita and Sherva."
  },
  "Fry Piece Biryani": {
    description: "Fragrant biryani rice topped with Guntur fried chicken cubes.",
    ingredients: "Biryani rice, spiced fried chicken breast chunks, cashew paste.",
    garnish: "Fried cashews, half lemon wedge, boiled egg."
  }
};

export const KitchenDisplaySystem: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [priorityOrders, setPriorityOrders] = useState<{ [key: string]: boolean }>({});
  const [selectedRecipe, setSelectedRecipe] = useState<{ name: string; description: string; ingredients: string; garnish: string } | null>(null);
  const [selectedChef, setSelectedChef] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // update wait times every 10 seconds
    return () => clearInterval(timer);
  }, []);

  const playKitchenAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      // Sweet two-tone kitchen chime (D5 -> A5)
      playTone(587.33, ctx.currentTime, 0.35);
      playTone(880.00, ctx.currentTime + 0.12, 0.45);
    } catch (e) {
      console.warn('Audio synthesis blocked by browser security guidelines:', e);
    }
  };

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePriority = (orderId: string) => {
    setPriorityOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getWaitTime = (createdAtStr: string) => {
    const elapsedMs = now.getTime() - new Date(createdAtStr).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  };

  const getWaitSeverityColor = (createdAtStr: string) => {
    const mins = Math.floor((now.getTime() - new Date(createdAtStr).getTime()) / 60000);
    if (mins < 10) return 'text-green-600 dark:text-green-400 font-semibold';
    if (mins < 20) return 'text-amber-600 dark:text-amber-400 font-bold';
    return 'text-red dark:text-red-400 font-extrabold animate-pulse';
  };

  const isOrderModified = (order: any) => {
    if (!order.updatedAt) return false;
    const createdTime = new Date(order.createdAt).getTime();
    const updatedTime = new Date(order.updatedAt).getTime();
    return updatedTime - createdTime > 1000;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiCall('/orders');
        setOrders(data);
      } catch (err) {
        console.error('KDS failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Socket.IO hooks
    subscribeToEvent('newOrder', (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev]);
      playKitchenAlertSound();
    });

    subscribeToEvent('orderStatusChanged', (updatedOrder: any) => {
      setOrders((prev) => 
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      playKitchenAlertSound();
    });

    return () => {
      unsubscribeFromEvent('newOrder');
      unsubscribeFromEvent('orderStatusChanged');
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const chefName = status === 'Preparing' ? (selectedChef[orderId] || 'Chef Somaraju') : undefined;
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, chefName })
      });
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const getFilteredOrders = (statuses: string[]) => {
    return orders
      .filter((o) => statuses.includes(o.status))
      .sort((a, b) => {
        const aPriority = priorityOrders[a._id] ? 1 : 0;
        const bPriority = priorityOrders[b._id] ? 1 : 0;
        return bPriority - aPriority; // VIP priority tickets float to top
      });
  };

  const getPrepSummary = () => {
    const activeOrders = orders.filter((o) => ['Received', 'Preparing'].includes(o.status));
    const summary: { [key: string]: number } = {};
    activeOrders.forEach((o) => {
      o.items.forEach((item: any, idx: number) => {
        const key = `${o._id}-${idx}`;
        if (!checkedItems[key]) {
          summary[item.name] = (summary[item.name] || 0) + item.quantity;
        }
      });
    });
    return Object.entries(summary).filter(([_, count]) => count > 0);
  };

  const handleDishClick = (name: string) => {
    const guide = RECIPE_GUIDES[name] || {
      description: "Traditional spicy Andhra plate prepared hot in military pans.",
      ingredients: `${name}, ginger paste, dry masalas.`,
      garnish: "Garnish with fresh coriander leaf and slit chiles."
    };
    setSelectedRecipe({ name, ...guide });
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 bg-cream/35 dark:bg-brown-dark min-h-screen text-xs">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-brown text-gold p-5 rounded-2xl border border-gold/30 shadow-md">
        <div className="flex items-center gap-3">
          <ChefHat size={26} className="text-gold animate-bounce" />
          <div>
            <h2 className="font-serif text-lg font-bold tracking-wide">Military Kitchen KDS Portal</h2>
            <p className="text-[10px] text-cream/70">Real-time digital ticket management for chef staff.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red inline-block"></span>Pending: {getFilteredOrders(['Received']).length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>Preparing: {getFilteredOrders(['Preparing']).length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>Ready: {getFilteredOrders(['Ready']).length}</span>
        </div>
      </div>

      {/* Prep Aggregator Panel */}
      {!loading && getPrepSummary().length > 0 && (
        <div className="bg-gold/10 border border-gold/25 p-4 rounded-2xl shadow-sm flex flex-col gap-2 animate-fade-in">
          <h3 className="font-serif text-xs font-bold text-brown dark:text-gold-light uppercase tracking-wider flex items-center gap-1.5">
            <span>🍳 Batch Cooking Aggregator (Active Items to Cook)</span>
          </h3>
          <div className="flex flex-wrap gap-2.5 max-h-24 overflow-y-auto pt-1">
            {getPrepSummary().map(([name, count]) => (
              <div 
                key={name} 
                onClick={() => handleDishClick(name)}
                className="bg-brown text-gold border border-gold/45 px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gold hover:text-brown transition-colors select-none font-bold text-[10px] shadow"
                title="Click to view recipe details"
              >
                <span>{name}</span>
                <span className="bg-red text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center font-sans">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 flex-grow">
          <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-start">
          
          {/* Column 1: Pending Tickets */}
          <div className="flex flex-col gap-4 bg-cream-light/60 dark:bg-brown-dark/30 border border-gold/15 p-4 rounded-2xl h-[70vh] overflow-y-auto shadow-sm">
            <h3 className="font-serif text-sm font-extrabold text-brown dark:text-gold-light border-b border-gold/10 pb-2 flex justify-between items-center">
              <span>Pending Tickets</span>
              <span className="px-2 py-0.5 bg-red text-white text-[9px] rounded-full">{getFilteredOrders(['Received']).length}</span>
            </h3>

            {getFilteredOrders(['Received']).length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-bold border border-dashed border-gold/10 rounded-xl animate-pulse">No pending orders.</div>
            ) : (
              getFilteredOrders(['Received']).map((order) => (
                <div 
                  key={order._id} 
                  className={`p-4 rounded-xl border bg-cream-light dark:bg-brown shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                    priorityOrders[order._id] 
                      ? 'border-red-600 ring-2 ring-red-600/35 dark:border-red ring-offset-1 dark:ring-red/35' 
                      : 'border-gold/20'
                  }`}
                >
                  {/* Flashing modification banner */}
                  {isOrderModified(order) && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[8px] tracking-widest text-center py-0.5 uppercase select-none animate-pulse shadow-sm z-10">
                      ⚡ Items Modified
                    </div>
                  )}
                  <div className={`flex justify-between items-center font-bold ${isOrderModified(order) ? 'mt-2.5' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red">#{order.orderId}</span>
                      {priorityOrders[order._id] && (
                        <span className="px-2 py-0.5 bg-red text-white font-extrabold text-[8px] rounded animate-pulse">VIP</span>
                      )}
                    </div>
                    <span className="text-xs bg-gold/10 border border-gold/25 px-2 py-0.5 rounded text-gold-dark font-sans">
                      {order.type === 'Dine In' ? `Table ${order.tableNumber}` : order.type}
                    </span>
                  </div>

                  {/* Wait Time Indicator */}
                  <div className="flex justify-between items-center text-[10px] text-gray-500 border-b border-gold/10 pb-1.5">
                    <span className="font-semibold uppercase tracking-wider">Wait Time:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Clock size={11} className="text-gold" />
                      <span className={getWaitSeverityColor(order.createdAt)}>{getWaitTime(order.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Items List */}
                  <div className="flex flex-col gap-1.5 py-1">
                    {order.items.map((item: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex justify-between items-center py-1 hover:bg-gold-light/10 px-1 rounded transition-colors"
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleItemCheck(order._id, i)}
                        >
                          <input 
                            type="checkbox" 
                            checked={!!checkedItems[`${order._id}-${i}`]} 
                            onChange={() => {}} 
                            className="w-3.5 h-3.5 accent-gold border-gold/45 rounded cursor-pointer shrink-0" 
                          />
                          <span className={`flex items-center gap-1.5 ${checkedItems[`${order._id}-${i}`] ? 'line-through opacity-45' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red'} shrink-0`} />
                            <span className="font-bold text-brown dark:text-cream-light">{item.name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleDishClick(item.name)}
                            className="text-gray-400 hover:text-gold p-0.5"
                            title="View Recipe Guide"
                          >
                            <Info size={12} />
                          </button>
                          <span className={`font-extrabold text-red font-sans ${checkedItems[`${order._id}-${i}`] ? 'opacity-40 line-through' : ''}`}>x{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-red-light/5 border border-red-light/20 p-2 rounded text-[10px] text-red-dark dark:text-red-light italic font-semibold">
                      ✍️ Instructions: "{order.specialInstructions}"
                    </div>
                  )}

                  <div className="flex flex-col gap-1 mt-1 text-[10px] w-full border-t border-gold/10 pt-2 mb-1.5">
                    <label className="font-bold text-brown/70 dark:text-cream/60">👨‍🍳 Select Chef:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Chef Somaraju', 'Chef Koteswara Rao'].map((chef) => (
                        <button
                          key={chef}
                          type="button"
                          onClick={() => setSelectedChef(prev => ({ ...prev, [order._id]: chef }))}
                          className={`py-1 px-1.5 border rounded text-[9px] font-bold transition-all ${
                            (selectedChef[order._id] || 'Chef Somaraju') === chef
                            ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown font-extrabold shadow'
                            : 'bg-transparent text-brown dark:text-cream border-gold/15 hover:bg-gold-light/10'
                          }`}
                        >
                          {chef.replace('Chef ', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => togglePriority(order._id)}
                      className={`px-3 py-2 rounded-lg border font-bold flex items-center justify-center gap-1 transition-colors ${
                        priorityOrders[order._id] 
                          ? 'bg-red text-white border-red' 
                          : 'bg-cream-light border-gold/25 text-brown-light hover:bg-gold-light/20'
                      }`}
                      title="Toggle VIP Rush Priority"
                    >
                      🔥 Rush
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'Preparing')}
                      className="flex-grow py-2 bg-brown text-gold border border-gold rounded-lg font-bold hover:bg-gold hover:text-brown transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Play size={12} className="fill-gold" />
                      <span>Start Cooking</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 2: Cooking Queue */}
          <div className="flex flex-col gap-4 bg-cream-light/60 dark:bg-brown-dark/30 border border-gold/15 p-4 rounded-2xl h-[70vh] overflow-y-auto shadow-sm">
            <h3 className="font-serif text-sm font-extrabold text-brown dark:text-gold-light border-b border-gold/10 pb-2 flex justify-between items-center">
              <span>Cooking Queue</span>
              <span className="px-2 py-0.5 bg-amber-500 text-brown text-[9px] rounded-full font-bold">{getFilteredOrders(['Preparing']).length}</span>
            </h3>

            {getFilteredOrders(['Preparing']).length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-bold border border-dashed border-gold/10 rounded-xl animate-pulse">No active preparation.</div>
            ) : (
              getFilteredOrders(['Preparing']).map((order) => (
                <div 
                  key={order._id} 
                  className={`p-4 rounded-xl border bg-cream-light dark:bg-brown shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                    priorityOrders[order._id] 
                      ? 'border-red-600 ring-2 ring-red-600/35 dark:border-red ring-offset-1 dark:ring-red/35' 
                      : 'border-gold/20'
                  }`}
                >
                  {/* Flashing modification banner */}
                  {isOrderModified(order) && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[8px] tracking-widest text-center py-0.5 uppercase select-none animate-pulse shadow-sm z-10">
                      ⚡ Items Modified
                    </div>
                  )}
                  <div className={`flex justify-between items-center font-bold ${isOrderModified(order) ? 'mt-2.5' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red">#{order.orderId}</span>
                      {priorityOrders[order._id] && (
                        <span className="px-2 py-0.5 bg-red text-white font-extrabold text-[8px] rounded animate-pulse">VIP</span>
                      )}
                    </div>
                    <span className="text-xs bg-gold/10 border border-gold/25 px-2 py-0.5 rounded text-gold-dark">
                      {order.type === 'Dine In' ? `Table ${order.tableNumber}` : order.type}
                    </span>
                  </div>

                  {/* Wait Time Indicator */}
                  <div className="flex justify-between items-center text-[10px] text-gray-500 border-b border-gold/10 pb-1.5">
                    <span className="font-semibold uppercase tracking-wider">Cooking Time:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Clock size={11} className="text-gold" />
                      <span className={getWaitSeverityColor(order.createdAt)}>{getWaitTime(order.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Items List */}
                  <div className="flex flex-col gap-1.5 py-1">
                    {order.items.map((item: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex justify-between items-center py-1 hover:bg-gold-light/10 px-1 rounded transition-colors"
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleItemCheck(order._id, i)}
                        >
                          <input 
                            type="checkbox" 
                            checked={!!checkedItems[`${order._id}-${i}`]} 
                            onChange={() => {}} 
                            className="w-3.5 h-3.5 accent-gold border-gold/45 rounded cursor-pointer shrink-0" 
                          />
                          <span className={`flex items-center gap-1.5 ${checkedItems[`${order._id}-${i}`] ? 'line-through opacity-45' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red'} shrink-0`} />
                            <span className="font-bold text-brown dark:text-cream-light">{item.name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleDishClick(item.name)}
                            className="text-gray-400 hover:text-gold p-0.5"
                            title="View Recipe Guide"
                          >
                            <Info size={12} />
                          </button>
                          <span className={`font-extrabold text-red font-sans ${checkedItems[`${order._id}-${i}`] ? 'opacity-40 line-through' : ''}`}>x{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-red-light/5 border border-red-light/20 p-2 rounded text-[10px] text-red-dark dark:text-red-light italic font-semibold">
                      ✍️ Instructions: "{order.specialInstructions}"
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => togglePriority(order._id)}
                      className={`px-3 py-2 rounded-lg border font-bold flex items-center justify-center gap-1 transition-colors ${
                        priorityOrders[order._id] 
                          ? 'bg-red text-white border-red' 
                          : 'bg-cream-light border-gold/25 text-brown-light hover:bg-gold-light/20'
                      }`}
                      title="Toggle VIP Rush Priority"
                    >
                      🔥 Rush
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'Ready')}
                      className="flex-grow py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle size={12} />
                      <span>Mark Ready</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Column 3: Ready for Pickup / Served */}
          <div className="flex flex-col gap-4 bg-cream-light/60 dark:bg-brown-dark/30 border border-gold/15 p-4 rounded-2xl h-[70vh] overflow-y-auto shadow-sm">
            <h3 className="font-serif text-sm font-extrabold text-brown dark:text-gold-light border-b border-gold/10 pb-2 flex justify-between items-center">
              <span>Ready for Pickup / Serving</span>
              <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] rounded-full">{getFilteredOrders(['Ready']).length}</span>
            </h3>

            {getFilteredOrders(['Ready']).length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-bold border border-dashed border-gold/10 rounded-xl animate-pulse">No dishes ready.</div>
            ) : (
              getFilteredOrders(['Ready']).map((order) => (
                <div 
                  key={order._id} 
                  className={`p-4 rounded-xl border bg-cream-light dark:bg-brown shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${
                    priorityOrders[order._id] 
                      ? 'border-red-600 ring-2 ring-red-600/35 dark:border-red ring-offset-1 dark:ring-red/35' 
                      : 'border-gold/20'
                  }`}
                >
                  {/* Flashing modification banner */}
                  {isOrderModified(order) && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[8px] tracking-widest text-center py-0.5 uppercase select-none animate-pulse shadow-sm z-10">
                      ⚡ Items Modified
                    </div>
                  )}
                  <div className={`flex justify-between items-center font-bold ${isOrderModified(order) ? 'mt-2.5' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red">#{order.orderId}</span>
                      {priorityOrders[order._id] && (
                        <span className="px-2 py-0.5 bg-red text-white font-extrabold text-[8px] rounded animate-pulse">VIP</span>
                      )}
                    </div>
                    <span className="text-xs bg-gold/10 border border-gold/25 px-2 py-0.5 rounded text-gold-dark font-sans">
                      {order.type === 'Dine In' ? `Table ${order.tableNumber}` : order.type}
                    </span>
                  </div>

                  {/* Wait Time Indicator */}
                  <div className="flex justify-between items-center text-[10px] text-gray-500 border-b border-gold/10 pb-1.5">
                    <span className="font-semibold uppercase tracking-wider">Finished:</span>
                    <div className="flex items-center gap-1 font-bold">
                      <Clock size={11} className="text-gold" />
                      <span className={getWaitSeverityColor(order.createdAt)}>{getWaitTime(order.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Items List */}
                  <div className="flex flex-col gap-1.5 py-1">
                    {order.items.map((item: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex justify-between items-center py-1 hover:bg-gold-light/10 px-1 rounded transition-colors"
                      >
                        <div 
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleItemCheck(order._id, i)}
                        >
                          <input 
                            type="checkbox" 
                            checked={!!checkedItems[`${order._id}-${i}`]} 
                            onChange={() => {}} 
                            className="w-3.5 h-3.5 accent-gold border-gold/45 rounded cursor-pointer shrink-0" 
                          />
                          <span className={`flex items-center gap-1.5 ${checkedItems[`${order._id}-${i}`] ? 'line-through opacity-45' : ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red'} shrink-0`} />
                            <span className="font-bold text-brown dark:text-cream-light">{item.name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => handleDishClick(item.name)}
                            className="text-gray-400 hover:text-gold p-0.5"
                            title="View Recipe Guide"
                          >
                            <Info size={12} />
                          </button>
                          <span className={`font-extrabold text-red font-sans ${checkedItems[`${order._id}-${i}`] ? 'opacity-40 line-through' : ''}`}>x{item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-red-light/5 border border-red-light/20 p-2 rounded text-[10px] text-red-dark dark:text-red-light italic font-semibold">
                      ✍️ Instructions: "{order.specialInstructions}"
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => togglePriority(order._id)}
                      className={`px-3 py-2 rounded-lg border font-bold flex items-center justify-center gap-1 transition-colors ${
                        priorityOrders[order._id] 
                          ? 'bg-red text-white border-red' 
                          : 'bg-cream-light border-gold/25 text-brown-light hover:bg-gold-light/20'
                      }`}
                      title="Toggle VIP Rush Priority"
                    >
                      🔥 Rush
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order._id, order.type === 'Home Delivery' ? 'Completed' : 'Served')}
                      className="flex-grow py-2 bg-brown text-gold border border-gold rounded-lg font-bold hover:bg-gold hover:text-brown transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Check size={12} />
                      <span>{order.type === 'Home Delivery' ? 'Mark Dispatched' : 'Mark Served'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* Recipe Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-gold max-w-sm w-full flex flex-col gap-4 shadow-xl dark:bg-brown/95 bg-cream">
            <div className="flex justify-between items-center border-b border-gold/15 pb-2">
              <h4 className="font-serif text-sm font-extrabold text-brown dark:text-gold-light uppercase">{selectedRecipe.name} - Recipe Guide</h4>
              <button onClick={() => setSelectedRecipe(null)} className="text-red font-bold text-sm">✕</button>
            </div>
            <div className="flex flex-col gap-3 text-[11px] text-brown dark:text-cream">
              <div>
                <strong className="block text-gold">Description:</strong>
                <p className="opacity-85">{selectedRecipe.description}</p>
              </div>
              <div>
                <strong className="block text-gold">Prep Ingredients:</strong>
                <p className="opacity-85">{selectedRecipe.ingredients}</p>
              </div>
              <div>
                <strong className="block text-gold">Plating & Garnish:</strong>
                <p className="opacity-85">{selectedRecipe.garnish}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRecipe(null)}
              className="mt-2 w-full py-2 bg-brown text-gold border border-gold rounded-lg font-bold hover:bg-gold hover:text-brown transition-all"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
