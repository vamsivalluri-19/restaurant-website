import React, { useEffect, useState } from 'react';
import { apiCall } from '../services/api';
import { subscribeToEvent, unsubscribeFromEvent } from '../services/socket';
import { MapPin, Phone, ShieldCheck, Check } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export const DeliveryDashboard: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState<{ [key: string]: string }>({});
  
  // GPS Simulation state
  const [simulationProgress, setSimulationProgress] = useState<{ [key: string]: number }>({});
  const [isSimulating, setIsSimulating] = useState<{ [key: string]: boolean }>({});
  const simulationIntervals = React.useRef<{ [key: string]: any }>({});

  useEffect(() => {
    return () => {
      Object.values(simulationIntervals.current).forEach((interval) => clearInterval(interval));
    };
  }, []);

  const startSimulation = (orderId: string) => {
    if (isSimulating[orderId]) return;
    
    setIsSimulating((prev) => ({ ...prev, [orderId]: true }));
    let prog = 0;
    setSimulationProgress((prev) => ({ ...prev, [orderId]: prog }));
    
    simulationIntervals.current[orderId] = setInterval(async () => {
      prog += 10;
      if (prog >= 100) {
        prog = 100;
        clearInterval(simulationIntervals.current[orderId]);
        setIsSimulating((prev) => ({ ...prev, [orderId]: false }));
      }
      
      setSimulationProgress((prev) => ({ ...prev, [orderId]: prog }));
      
      // Calculate coordinates
      const lat = 16.3067 + (prog / 100) * 0.03;
      const lng = 80.4365 + (prog / 100) * 0.03;
      
      try {
        await apiCall(`/orders/${orderId}/location`, {
          method: 'PUT',
          body: JSON.stringify({ lat, lng, progress: prog })
        });
      } catch (err) {
        console.error('Failed to update live coordinates:', err);
      }
    }, 2000);
  };
  
  // Delivery agent state
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeAgent, setActiveAgent] = useState<'Ramu' | 'Subrahmanyam'>('Ramu');
  const [activeDuty, setActiveDuty] = useState<'Home' | 'Office'>('Home');

  useEffect(() => {
    if (user?.name?.toLowerCase().includes('subrahmanyam')) {
      setActiveAgent('Subrahmanyam');
    } else {
      setActiveAgent('Ramu');
    }
  }, [user]);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const data = await apiCall('/orders');
        // Filter orders that are Home Delivery and active (Received, Preparing, Ready, Served)
        setDeliveries(
          data.filter((o: any) => o.type === 'Home Delivery' && ['Received', 'Preparing', 'Ready', 'Served'].includes(o.status))
        );
      } catch (err) {
        console.error('Failed to load deliveries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();

    // Socket.IO updates
    subscribeToEvent('orderStatusChanged', (order: any) => {
      if (order.type === 'Home Delivery') {
        if (['Received', 'Preparing', 'Ready', 'Served'].includes(order.status)) {
          setDeliveries((prev) => {
            const exists = prev.find((o) => o._id === order._id);
            if (exists) {
              return prev.map((o) => (o._id === order._id ? order : o));
            } else {
              return [order, ...prev];
            }
          });
        } else {
          setDeliveries((prev) => prev.filter((o) => o._id !== order._id));
        }
      }
    });

    return () => {
      unsubscribeFromEvent('orderStatusChanged');
    };
  }, []);

  const handleAcceptDelivery = async (orderId: string) => {
    try {
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'Served', 
          deliveryPartnerName: activeAgent 
        })
      });
      alert(`Delivery accepted! Order is now assigned to ${activeAgent} and is Out for Delivery.`);
    } catch (err) {
      alert('Failed to accept delivery.');
    }
  };

  const handleConfirmDelivery = async (orderId: string, expectedOtp: string) => {
    const userOtp = otpInputs[orderId];
    if (userOtp !== expectedOtp && userOtp !== '5623') { // simulated master bypass 5623
      alert('Invalid Delivery OTP. Please ask the customer for the correct OTP.');
      return;
    }

    try {
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'Completed',
          deliveryPartnerName: activeAgent 
        })
      });
      alert('Order marked as Completed. Payment logged.');
    } catch (err) {
      alert('Failed to confirm delivery.');
    }
  };

  const handleOtpChange = (orderId: string, val: string) => {
    setOtpInputs((prev) => ({ ...prev, [orderId]: val }));
  };

  const filteredDeliveries = deliveries.filter((o) => {
    const subtype = o.deliverySubtype || 'Home';
    if (subtype !== activeDuty) return false;
    
    // If order is Out for Delivery (Served), only show it if assigned to this agent
    if (o.status === 'Served') {
      return o.deliveryPartnerName === activeAgent;
    }
    return true; // show all Ready orders
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream/40 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col gap-8 w-full min-h-screen text-xs">
      
      {/* Title */}
      <div className="flex flex-col gap-1 items-center text-center">
        <span className="text-[10px] bg-red text-white border border-red-dark px-3 py-1 rounded-full font-bold uppercase tracking-widest">
          Active Delivery Agent Queue
        </span>
        <h2 className="font-serif text-3xl font-extrabold text-brown dark:text-gold-light mt-1">
          Delivery Dashboard
        </h2>
        <div className="w-12 h-1 bg-gold rounded-full animate-pulse" />
      </div>

      {/* Control Panels: Identity & Duty Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent Identity */}
        {/* Agent Profile Indicator */}
        <div className="glass-panel p-4 rounded-xl border border-gold/25 shadow-sm flex items-center justify-between bg-cream-light/35">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-brown/70 dark:text-gold uppercase tracking-wider">Active Delivery Duty Profile</label>
            <span className="text-sm font-extrabold text-brown dark:text-gold-light">🚴 {activeAgent}</span>
          </div>
          <span className="text-[9px] bg-emerald-600/10 text-emerald-600 border border-emerald-600/25 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            🟢 Online
          </span>
        </div>

        {/* Active Duty Type */}
        <div className="glass-panel p-4 rounded-xl border border-gold/25 shadow-sm flex flex-col gap-2 bg-cream-light/35">
          <label className="text-[10px] font-bold text-brown/70 dark:text-gold uppercase tracking-wider">Duty Mode Filter</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveDuty('Home')}
              className={`py-2.5 rounded-lg border text-xs font-bold transition-all ${
                activeDuty === 'Home'
                ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown font-extrabold shadow'
                : 'bg-transparent text-brown dark:text-cream border-gold/15 hover:bg-gold-light/10'
              }`}
            >
              🏠 Home Deliveries
            </button>
            <button
              onClick={() => setActiveDuty('Office')}
              className={`py-2.5 rounded-lg border text-xs font-bold transition-all ${
                activeDuty === 'Office'
                ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown font-extrabold shadow'
                : 'bg-transparent text-brown dark:text-cream border-gold/15 hover:bg-gold-light/10'
              }`}
            >
              🏢 Office Deliveries
            </button>
          </div>
        </div>
      </div>

      {filteredDeliveries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gold/25 rounded-2xl flex flex-col items-center gap-3 bg-cream-light/35">
          <ShieldCheck size={40} className="text-gold" />
          <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light">All caught up!</h3>
          <p className="text-xs text-brown/70 dark:text-cream/70 max-w-xs">
            No {activeDuty === 'Home' ? 'home' : 'office'} delivery tickets are ready or out for delivery under your assignment at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {filteredDeliveries.map((order) => (
            <div key={order._id} className="glass-panel p-5 rounded-2xl border border-gold/30 shadow flex flex-col gap-4">
              <div className="flex justify-between items-center font-bold">
                <span className="text-red">#{order.orderId}</span>
                <span className={`px-2.5 py-0.5 border rounded text-[10px] uppercase ${
                  order.status === 'Ready' 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/25 animate-pulse'
                    : 'bg-emerald-600/10 text-emerald-600 border-emerald-600/25'
                }`}>
                  {order.status === 'Ready' ? 'Ready for Pickup' : 'Out for Delivery'}
                </span>
              </div>

              {/* Address details */}
              <div className="flex flex-col gap-2 border-t border-b border-gold/15 py-3 text-brown/85 dark:text-cream/80">
                {order.user?.name && (
                  <div className="text-[10px] text-gray-500 font-bold border-b border-gold/10 pb-1.5 mb-1 flex justify-between items-center">
                    <span>Customer: {order.user.name}</span>
                  </div>
                )}
                
                {order.deliverySubtype === 'Office' ? (
                  <div className="p-2.5 border border-gold/20 bg-gold-light/5 rounded-lg mb-1 flex flex-col gap-1.5 text-[11px]">
                    <div className="font-bold text-red dark:text-gold">
                      🏢 Company: {order.companyName || 'N/A'}
                    </div>
                    <div className="flex justify-between text-brown/70 dark:text-cream/70 font-semibold text-[10px]">
                      <span>🚪 Cabin/Cubicle: {order.cabinNumber || 'N/A'}</span>
                      <span>📶 Floor/Block: {order.floorBlock || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 border border-emerald-500/20 bg-emerald-500/5 rounded-lg mb-1 text-[11px] font-bold text-emerald-600">
                    🏠 Home Delivery Address
                  </div>
                )}
 
                 <div className="flex items-start gap-2">
                   <MapPin size={15} className="text-gold shrink-0 mt-0.5" />
                   <span className="font-semibold">{order.address || 'Mallepalli Highway, Vizag'}</span>
                 </div>
                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <Phone size={14} className="text-gold shrink-0" />
                    <span className="font-bold text-red dark:text-gold">{order.phone || order.user?.phone || 'No Phone Provided'}</span>
                    {(order.phone || order.user?.phone) && (
                      <div className="flex gap-1.5 ml-2 items-center">
                        <a href={`tel:${order.phone || order.user?.phone}`} className="p-0.5 rounded bg-gold/10 hover:bg-gold/30 text-gold border border-gold/25" title="Call">📞</a>
                        <a href={`https://wa.me/${(order.phone || order.user?.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/25" title="WhatsApp">💬</a>
                        <a href={`sms:${order.phone || order.user?.phone}`} className="p-0.5 rounded bg-blue-500/10 hover:bg-blue-500/30 text-blue-500 border border-blue-500/25" title="SMS">✉️</a>
                      </div>
                    )}
                  </div>
              </div>

              {/* Items Summary */}
              <div className="flex flex-col gap-1 text-[10px] text-gray-500 border-b border-gold/10 pb-3">
                <span className="font-bold text-[9px] uppercase tracking-wider text-brown-light mb-0.5">Order Items:</span>
                {order.items.map((item: any, i: number) => (
                  <span key={i}>{item.name} <strong>x{item.quantity}</strong></span>
                ))}
              </div>
              {/* GPS Location Simulation */}
              {order.status === 'Served' && (
                <div className="border border-gold/20 p-3.5 rounded-xl bg-gold/5 flex flex-col gap-2.5 font-sans text-[11px] mb-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gold-dark uppercase tracking-wider">GPS Simulation Controller</span>
                    <span className="font-mono text-gray-500">Progress: {simulationProgress[order._id] !== undefined ? simulationProgress[order._id] : (order.deliveryLocation?.progress || 0)}%</span>
                  </div>
                  
                  <div className="w-full bg-gold/15 h-2 rounded-full overflow-hidden border border-gold/10">
                    <div 
                      className="bg-gold h-full transition-all duration-500" 
                      style={{ width: `${simulationProgress[order._id] !== undefined ? simulationProgress[order._id] : (order.deliveryLocation?.progress || 0)}%` }} 
                    />
                  </div>

                  <button
                    onClick={() => startSimulation(order._id)}
                    disabled={isSimulating[order._id] || (simulationProgress[order._id] || order.deliveryLocation?.progress || 0) >= 100}
                    className={`w-full py-2 rounded-md font-bold transition-all border ${
                      isSimulating[order._id]
                        ? 'bg-brown/15 text-brown/50 border-brown/10 animate-pulse'
                        : (simulationProgress[order._id] || order.deliveryLocation?.progress || 0) >= 100
                          ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20'
                          : 'bg-brown text-gold border-gold hover:bg-gold hover:text-brown'
                    }`}
                  >
                    {isSimulating[order._id] 
                      ? '🚴 GPS Simulating Live Movement...' 
                      : (simulationProgress[order._id] || order.deliveryLocation?.progress || 0) >= 100 
                        ? '✅ Rider Arrived at Gate (100%)' 
                        : '📍 Start GPS Route Simulation'}
                  </button>
                </div>
              )}

              {/* Action: Claim vs OTP verify */}
              {['Received', 'Preparing', 'Ready'].includes(order.status) ? (
                <button
                  onClick={() => handleAcceptDelivery(order._id)}
                  className="w-full py-3 bg-brown text-gold border border-gold rounded-lg hover:bg-gold hover:text-brown transition-all font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  🚚 Accept Delivery Task
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    maxLength={4}
                    value={otpInputs[order._id] || ''}
                    onChange={(e) => handleOtpChange(order._id, e.target.value)}
                    placeholder="Enter Customer OTP"
                    className="flex-grow p-3 border border-gold/25 bg-cream-light/60 dark:bg-brown rounded-lg focus:outline-none font-bold tracking-widest text-center"
                  />
                  <button
                    onClick={() => handleConfirmDelivery(order._id, order.otp || '5623')}
                    className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold flex items-center justify-center gap-1.5 shadow"
                  >
                    <Check size={14} />
                    <span>Verify</span>
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
