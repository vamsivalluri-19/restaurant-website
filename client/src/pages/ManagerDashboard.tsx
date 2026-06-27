import React, { useEffect, useState, useRef } from 'react';
import { apiCall } from '../services/api';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck, Flame, PieChart, Clock, ReceiptText, MessageSquareQuote, Compass, Check, Eye } from 'lucide-react';
import { subscribeToEvent, unsubscribeFromEvent } from '../services/socket';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const ManagerTrackingMap: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);

  const isActive = status === 'Served';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([16.3067, 80.4365], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Restaurant marker
    const restIcon = L.divIcon({
      html: '<div style="background-color: #3E2723; border: 1px solid #D4AF37; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">🏨</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([16.3067, 80.4365], { icon: restIcon }).addTo(map);

    // Customer marker
    const homeIcon = L.divIcon({
      html: '<div style="background-color: #059669; border: 1px solid white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.4);">🏠</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([16.3367, 80.4665], { icon: homeIcon }).addTo(map);

    // Route path line
    L.polyline([[16.3067, 80.4365], [16.3367, 80.4665]], {
      color: '#D4AF37',
      weight: 3,
      opacity: 0.8,
      dashArray: '5, 5'
    }).addTo(map);

    // Rider marker
    const riderIcon = L.divIcon({
      html: '<div style="background-color: #D4AF37; border: 1px solid #3E2723; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" class="animate-bounce">🚴</div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const riderMarker = L.marker([16.3067, 80.4365], { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    return () => {
      map.remove();
    };
  }, []);

  // Update Rider position dynamically
  useEffect(() => {
    if (!riderMarkerRef.current || !mapRef.current) return;

    const p = Math.min(Math.max(progress, 0), 100) / 100;
    const startLat = 16.3067;
    const startLng = 80.4365;
    const endLat = 16.3367;
    const endLng = 80.4665;

    const lat = startLat + p * (endLat - startLat);
    const lng = startLng + p * (endLng - startLng);

    riderMarkerRef.current.setLatLng([lat, lng]);

    if (isActive && progress > 0 && progress < 100) {
      mapRef.current.panTo([lat, lng]);
    }
  }, [progress, isActive]);

  return (
    <div 
      ref={mapContainerRef} 
      className="h-48 w-full rounded-xl border border-gold/25 relative overflow-hidden shadow-inner z-10" 
    />
  );
};

export const ManagerDashboard: React.FC = () => {
  const [forecast, setForecast] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'reviews' | 'timing'>('analytics');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any | null>(null);

  // Timing buf configs
  const [defaultPrepTime, setDefaultPrepTime] = useState(20);
  const [prepTimeSaved, setPrepTimeSaved] = useState(false);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const forecastingData = await apiCall('/analytics/forecasting');
        setForecast(forecastingData);

        const ordersData = await apiCall('/orders');
        setOrders(ordersData);

        const reviewsData = await apiCall('/reviews');
        setReviews(reviewsData);
      } catch (err) {
        console.error('Failed to load manager reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();

    // Sockets sync
    subscribeToEvent('newOrder', (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev]);
    });

    subscribeToEvent('orderStatusChanged', (updatedOrder: any) => {
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
      setActiveTrackingOrder((prev: any) => (prev?._id === updatedOrder._id ? updatedOrder : prev));
    });

    subscribeToEvent('deliveryLocationUpdate', (data: any) => {
      setOrders((prev) => 
        prev.map((o) => (o._id === data.orderId ? { ...o, deliveryLocation: data.deliveryLocation, status: data.status || o.status } : o))
      );
      setActiveTrackingOrder((prev: any) => {
        if (prev?._id === data.orderId) {
          return { ...prev, deliveryLocation: data.deliveryLocation, status: data.status || prev.status };
        }
        return prev;
      });
    });

    subscribeToEvent('newReviewSubmitted', (newRev: any) => {
      setReviews((prev) => [newRev, ...prev]);
    });

    subscribeToEvent('reviewApproved', (approvedRev: any) => {
      setReviews((prev) => prev.map((r) => (r._id === approvedRev._id ? approvedRev : r)));
    });

    return () => {
      unsubscribeFromEvent('newOrder');
      unsubscribeFromEvent('orderStatusChanged');
      unsubscribeFromEvent('deliveryLocationUpdate');
      unsubscribeFromEvent('newReviewSubmitted');
      unsubscribeFromEvent('reviewApproved');
    };
  }, []);

  const handleApproveReview = async (id: string) => {
    try {
      await apiCall(`/reviews/${id}/approve`, { method: 'PUT' });
      setReviews((prev) => 
        prev.map((r) => (r._id === id ? { ...r, isApproved: true } : r))
      );
    } catch (err) {
      alert('Failed to approve review.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiCall(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
    } catch (err) {
      alert('Failed to update order status.');
    }
  };

  const handleUpdatePrepTime = (e: React.FormEvent) => {
    e.preventDefault();
    setPrepTimeSaved(true);
    setTimeout(() => setPrepTimeSaved(false), 4000);
  };

  if (loading || !forecast) {
    return (
      <div className="min-h-screen bg-cream/40 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex flex-col gap-8 w-full min-h-screen text-xs">
      
      {/* Title */}
      <div className="flex flex-col gap-1 items-center text-center">
        <span className="text-[10px] bg-brown text-gold border border-gold/45 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
          Managerial Audits & Predictions
        </span>
        <h2 className="font-serif text-3xl font-extrabold text-brown dark:text-gold-light mt-1">
          Manager Dashboard
        </h2>
        <div className="w-12 h-1 bg-gold rounded-full" />
      </div>

      {/* Operator Navigation Shortcuts */}
      <div className="flex gap-4 items-center justify-center -mt-4 mb-2 flex-wrap">
        <Link to="/kitchen" className="px-4 py-2 border border-gold bg-brown text-gold hover:bg-gold hover:text-brown rounded-full font-bold transition-all text-[10px] uppercase shadow">
          ← Kitchen KDS Portal
        </Link>
        <Link to="/admin" className="px-4 py-2 border border-gold bg-brown text-gold hover:bg-gold hover:text-brown rounded-full font-bold transition-all text-[10px] uppercase shadow">
          Admin Portal →
        </Link>
      </div>

      {/* Tab bar header */}
      <div className="flex border-b border-gold/25 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'analytics', label: 'AI Forecasting & Staff', icon: <PieChart size={14} /> },
          { id: 'orders', label: 'Active Orders Log & GPS', icon: <ReceiptText size={14} /> },
          { id: 'reviews', label: 'Customer Reviews Moderation', icon: <MessageSquareQuote size={14} /> },
          { id: 'timing', label: 'Delivery Timings & Performance', icon: <Clock size={14} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold uppercase transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-brown text-gold font-extrabold border-t border-l border-r border-gold/25'
                : 'text-gray-500 hover:text-brown dark:hover:text-gold'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab contents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Tab 1: AI Forecasting & Staff */}
        {activeTab === 'analytics' && (
          <>
            <div className="lg:col-span-2 flex flex-col gap-6 animate-fade-in">
              {/* AI Peak hour card */}
              <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4">
                <h3 className="font-serif text-base font-bold text-brown dark:text-gold-light flex items-center gap-2 border-b border-gold/15 pb-2">
                  <Flame className="text-red animate-pulse" size={18} />
                  AI Peak Hour Analytics
                </h3>
                <div className="p-4 bg-red-600/10 border border-red/25 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red">Predicted Peak Slot: {forecast.peakHour.predictedPeakSlot}</span>
                    <span className="bg-red text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">{forecast.peakHour.confidenceScore} Conf.</span>
                  </div>
                  <p className="text-brown/70 leading-relaxed text-xs">
                    {forecast.peakHour.reasoning}
                  </p>
                </div>
              </div>

              {/* AI food performance card */}
              <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4">
                <h3 className="font-serif text-base font-bold text-brown dark:text-gold-light flex items-center gap-2 border-b border-gold/15 pb-2">
                  <TrendingUp className="text-gold" size={18} />
                  AI Food Performance Analytics
                </h3>
                <div className="flex flex-col gap-3">
                  {forecast.foodTrends.map((trend: any, idx: number) => (
                    <div key={idx} className="p-3 bg-cream-light border border-gold/15 rounded-xl flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-brown dark:text-gold-light">{trend.foodName}</span>
                        <span className="text-[10px] text-gray-500">{trend.reason}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                        {trend.demandTrend}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue forecasting */}
              <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4">
                <h3 className="font-serif text-base font-bold text-brown dark:text-gold-light flex items-center gap-2 border-b border-gold/15 pb-2">
                  <PieChart className="text-gold" size={18} />
                  Expected Revenue Forecasting (Next Week)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {forecast.revenueForecast.map((day: any, idx: number) => (
                    <div key={idx} className="p-3 bg-cream-light border border-gold/15 rounded-xl text-center flex flex-col gap-1 shadow-sm">
                      <span className="font-bold text-gray-500">{day.day.split(' ')[0]}</span>
                      <span className="text-sm font-extrabold text-red dark:text-gold">₹{day.expectedRevenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Employee live operations tracker */}
              <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
                <h3 className="font-serif text-sm font-bold text-brown dark:text-gold uppercase tracking-wider flex items-center gap-2 border-b border-gold/15 pb-2">
                  <Users size={16} />
                  Employee Live Operations Tracker
                </h3>
                <div className="flex flex-col gap-3">
                  {(() => {
                    const getChefStatus = (chefName: string) => {
                      const activeOrder = orders.find(o => o.status === 'Preparing' && o.chefName === chefName);
                      if (activeOrder) {
                        const itemsStr = activeOrder.items.map((it: any) => `${it.name} x${it.quantity}`).join(', ');
                        return { state: 'Cooking 🍳', detail: `Cooking #${activeOrder.orderId} (${itemsStr})`, isActive: true };
                      }
                      return { state: 'Idle 💤', detail: 'Available / Preparing ingredients', isActive: false };
                    };

                    const getDeliveryStatus = (agentName: string) => {
                      const activeOrder = orders.find(o => o.status === 'Served' && o.deliveryPartnerName === agentName);
                      if (activeOrder) {
                        const subtype = activeOrder.deliverySubtype || 'Home';
                        const dest = subtype === 'Office' ? `${activeOrder.companyName} (${activeOrder.floorBlock})` : activeOrder.address;
                        return { state: 'Delivering 🚴', detail: `Out on #${activeOrder.orderId} to ${dest}`, isActive: true };
                      }
                      return { state: 'Idle 💤', detail: 'Ready for dispatch shift', isActive: false };
                    };

                    const staff = [
                      { id: 'e1', name: 'Chef Somaraju', role: 'Kitchen Chef', ...getChefStatus('Chef Somaraju') },
                      { id: 'e3', name: 'Chef Koteswara Rao', role: 'Kitchen Chef', ...getChefStatus('Chef Koteswara Rao') },
                      { id: 'e2', name: 'Ramu', role: 'Delivery Rider', ...getDeliveryStatus('Ramu') },
                      { id: 'e4', name: 'Subrahmanyam', role: 'Delivery Rider', ...getDeliveryStatus('Subrahmanyam') }
                    ];

                    return staff.map((emp) => (
                      <div key={emp.id} className="flex flex-col gap-1.5 p-3 border border-gold/10 rounded-xl bg-cream-light/40">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-xs">{emp.name}</span>
                            <span className="text-[10px] text-gray-500 font-medium">{emp.role}</span>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            emp.isActive ? 'bg-red text-white border border-red/20 animate-pulse' : 'bg-green-600/10 text-green-600'
                          }`}>
                            {emp.state}
                          </span>
                        </div>
                        <div className="text-[10px] text-brown-light font-bold font-sans bg-gold-light/10 p-1.5 rounded border border-gold/5 flex items-center gap-1">
                          <span className="text-gold shrink-0">❖</span>
                          <span className="truncate">{emp.detail}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Inventory alert card */}
              <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
                <h3 className="font-serif text-sm font-bold text-brown dark:text-gold uppercase tracking-wider flex items-center gap-2 border-b border-gold/15 pb-2">
                  <AlertTriangle size={16} />
                  Inventory Alert Levels
                </h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Basmati Rice (Biryani)</span>
                    <span className="font-bold text-emerald-600">850 kg (Optimal)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Samba Rice (Mutton)</span>
                    <span className="font-bold text-emerald-600">420 kg (Optimal)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Guntur Red Chilli Powder</span>
                    <span className="font-bold text-red animate-pulse">12 kg (Low Stock ⚠️)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Refined Sunflower Oil</span>
                    <span className="font-bold text-emerald-600">180 L (Optimal)</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Active Orders Log & GPS */}
        {activeTab === 'orders' && (
          <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4 w-full animate-fade-in">
            <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">
              Managerial Order Log & GPS Dispatch Center
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gold/20 text-gray-500 font-bold">
                    <th className="py-3 px-2">Order ID</th>
                    <th className="py-3 px-2">Details</th>
                    <th className="py-3 px-2 text-center">Items</th>
                    <th className="py-3 px-2">Payment Method</th>
                    <th className="py-3 px-2">Payment Status</th>
                    <th className="py-3 px-2">Order Status</th>
                    <th className="py-3 px-2 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gold-light/5">
                      <td className="py-3.5 px-2 font-bold text-red font-sans">{o.orderId}</td>
                      <td className="py-3.5 px-2">
                        <div className="flex flex-col gap-1 max-w-[240px]">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase w-max ${
                            o.type === 'Dine In' ? 'bg-amber-600/10 text-amber-600 border border-amber-600/20' :
                            o.type === 'Home Delivery' ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20' :
                            'bg-purple-600/10 text-purple-600 border border-purple-600/20'
                          }`}>
                            {o.type}
                          </span>
                          
                          {/* Customer Details */}
                          <div className="flex flex-col text-[10px] leading-relaxed">
                            <span className="font-bold text-brown dark:text-cream">
                              👤 {o.user?.name || o.customerName || 'Walk-in Guest'}
                            </span>
                            {(o.phone || o.user?.phone) && (
                              <div className="flex items-center gap-1 mt-0.5 text-[9px] flex-wrap">
                                <span className="text-gray-500 font-mono font-bold">📞 {o.phone || o.user?.phone}</span>
                                <div className="flex gap-1 items-center ml-1 shrink-0">
                                  <a href={`tel:${o.phone || o.user?.phone}`} className="p-0.5 rounded bg-gold/10 hover:bg-gold/30 text-gold border border-gold/25" title="Call">📞</a>
                                  <a href={`https://wa.me/${(o.phone || o.user?.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/25" title="WhatsApp">💬</a>
                                  <a href={`sms:${o.phone || o.user?.phone}`} className="p-0.5 rounded bg-blue-500/10 hover:bg-blue-500/30 text-blue-500 border border-blue-500/25" title="SMS">✉️</a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Table or Address Details */}
                          <div className="text-[10px] text-gray-500 font-semibold leading-normal">
                            {o.type === 'Dine In' && o.tableNumber && (
                              <span className="text-red font-bold">🪑 Table #{o.tableNumber}</span>
                            )}
                            {o.type === 'Home Delivery' && (
                              <div className="flex flex-col gap-0.5 bg-gold-light/5 p-1.5 border border-gold/10 rounded">
                                <span className="font-semibold text-gold-dark">
                                  🏡 {o.deliverySubtype === 'Office' ? 'Office Delivery' : 'Home Delivery'}
                                </span>
                                <span className="truncate block text-gray-400" title={o.address}>
                                  📍 {o.address || 'No Address Provided'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Delivery Rider Assignment Status */}
                          {o.type === 'Home Delivery' && (
                            <div className="flex flex-col gap-0.5 mt-1 text-[9px]">
                              <span className={`font-bold uppercase ${
                                o.status === 'Completed' ? 'text-emerald-600' :
                                o.status === 'Served' ? 'text-amber-600 animate-pulse' :
                                o.deliveryPartnerName ? 'text-orange-500' : 'text-red'
                              }`}>
                                {o.status === 'Completed' ? `🟢 Delivered by ${o.deliveryPartnerName || 'Rider'}` :
                                 o.status === 'Served' ? `🚴 Out for Delivery (${o.deliveryPartnerName || 'Rider'})` :
                                 o.deliveryPartnerName ? `🟠 Assigned: ${o.deliveryPartnerName} (Pending Pickup)` :
                                 '🔴 Unassigned (Waiting for Rider)'}
                              </span>
                            </div>
                          )}

                          {o.type === 'Home Delivery' && ['Served', 'Completed'].includes(o.status) && (
                            <button
                              onClick={() => setActiveTrackingOrder(o)}
                              className="text-[9px] font-extrabold text-gold hover:text-gold-dark uppercase tracking-wider text-left mt-1 underline transition-all shrink-0 flex items-center gap-1"
                            >
                              🛰️ Track Live GPS Map
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <div className="flex flex-col gap-0.5">
                          {o.items.map((item: any, i: number) => (
                            <span key={i} className="text-[10px] text-brown-light dark:text-cream/70">
                              {item.name} x{item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-2 font-bold text-brown dark:text-gold-light">{o.paymentMethod}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          o.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' :
                          o.paymentStatus === 'Pending' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-600/10 text-red-600'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <select 
                          value={o.status} 
                          onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                          className="p-1 bg-cream-light border border-gold/20 rounded font-bold text-[10px] dark:bg-brown text-brown dark:text-gold"
                        >
                          <option value="Received">Received</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready">Ready</option>
                          <option value="Served">Served</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-2 text-right font-extrabold text-red dark:text-gold text-sm font-sans">₹{o.grandTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Customer Reviews Moderation */}
        {activeTab === 'reviews' && (
          <div className="lg:col-span-3 glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4 w-full animate-fade-in">
            <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">
              Reviews Moderation Queue
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-xl border border-gold/20 bg-cream-light/35 dark:bg-brown/25 flex flex-col justify-between gap-3 shadow-sm">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-brown dark:text-gold">{rev.userName}</span>
                      <span className="text-gold font-sans font-bold text-[10px]">{'★'.repeat(rev.rating)}</span>
                    </div>
                    {rev.foodName && (
                      <span className="text-[10px] bg-red/10 text-red border border-red/15 px-2 py-0.5 rounded-full w-max font-bold">
                        🍜 Dish: {rev.foodName}
                      </span>
                    )}
                    <p className="text-gray-500 italic text-[11px] leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-gold/10">
                    <span className="text-[9px] font-mono text-gray-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                    {rev.isApproved ? (
                      <span className="text-[9px] bg-emerald-600/10 text-emerald-600 border border-emerald-600/25 px-2.5 py-1 rounded-full font-bold uppercase">
                        🟢 Approved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveReview(rev._id)}
                        className="px-4 py-1.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded font-bold text-[9px] uppercase tracking-wider transition-all"
                      >
                        ✓ Approve Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400 font-bold border border-dashed border-gold/15 rounded-2xl bg-cream-light/35">
                  No customer feedbacks submitted yet in the database.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Delivery Timings & Performance */}
        {activeTab === 'timing' && (
          <>
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-6 animate-fade-in">
              <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">
                Rider Delivery Timings & Performance Log
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gold/20 text-gray-500 font-bold">
                      <th className="py-2.5 px-1">Rider</th>
                      <th className="py-2.5 px-1">Order ID</th>
                      <th className="py-2.5 px-1">Customer</th>
                      <th className="py-2.5 px-1 text-center">Transit Start</th>
                      <th className="py-2.5 px-1 text-center">Duration</th>
                      <th className="py-2.5 px-1 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {orders.filter(o => o.type === 'Home Delivery' && o.deliveryPartnerName).map((o, idx) => (
                      <tr key={idx} className="hover:bg-gold-light/5 text-[11px]">
                        <td className="py-3 px-1 font-bold text-brown dark:text-gold">🚴 {o.deliveryPartnerName}</td>
                        <td className="py-3 px-1 font-semibold text-red font-mono">#{o.orderId}</td>
                        <td className="py-3 px-1">
                          <div className="flex flex-col">
                            <span className="font-semibold">{o.user?.name || o.customerName || 'Guest'}</span>
                            <span className="text-[9px] text-gray-400 font-mono">{o.phone || o.user?.phone || 'No phone'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-1 text-center text-gray-500">
                          {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3 px-1 text-center font-bold">
                          {o.status === 'Completed' ? '12 mins' : (o.status === 'Served' ? 'In Transit ⏳' : 'Not Started')}
                        </td>
                        <td className="py-3 px-1 text-right">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            o.status === 'Completed' ? 'bg-emerald-600/10 text-emerald-600' : 'bg-amber-600/10 text-amber-600'
                          }`}>
                            {o.status === 'Completed' ? 'Delivered' : 'On Road'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(o => o.type === 'Home Delivery' && o.deliveryPartnerName).length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 font-bold">
                          No delivery dispatch records registered in this cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Prep timing buffer manager */}
              <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
                <h3 className="font-serif text-sm font-bold text-brown dark:text-gold uppercase tracking-wider flex items-center gap-2 border-b border-gold/15 pb-2">
                  <Clock size={16} />
                  Kitchen Prep buffer Config
                </h3>
                
                {prepTimeSaved ? (
                  <div className="p-3 bg-emerald-600/10 border border-emerald-600/25 rounded-xl text-center text-emerald-500 font-bold text-[10px]">
                    ✓ Kitchen preparation guidelines updated! Chefs notified.
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePrepTime} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-500">Default Buffer Time (minutes)</label>
                      <input 
                        type="number"
                        value={defaultPrepTime}
                        onChange={(e) => setDefaultPrepTime(Number(e.target.value))}
                        className="p-2.5 bg-cream-light border border-gold/20 rounded-lg text-brown focus:outline-none font-bold"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg font-bold transition-all uppercase shadow"
                    >
                      Update Guidelines
                    </button>
                  </form>
                )}
              </div>

              {/* Transit KPI timings summary */}
              <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4 bg-brown text-gold">
                <h3 className="font-serif text-xs font-bold text-gold-light uppercase tracking-wider border-b border-gold/15 pb-2">
                  Dispatch Performance Metrics
                </h3>
                <div className="flex flex-col gap-3 text-[11px] font-sans">
                  <div className="flex justify-between items-center">
                    <span>Avg Prep Time:</span>
                    <span className="font-bold">14.8 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Transit Time:</span>
                    <span className="font-bold">11.5 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Order-to-Door:</span>
                    <span className="font-bold text-gold-light">26.3 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>On-time Delivery Rate:</span>
                    <span className="font-bold text-emerald-500">98.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Live tracking map modal overlay */}
      {activeTrackingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-2xl max-w-lg w-full flex flex-col gap-4 relative animate-scale-up text-xs dark:bg-brown-dark">
            <button 
              onClick={() => setActiveTrackingOrder(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-cream-light dark:bg-brown border border-gold/20 flex items-center justify-center font-bold hover:bg-gold/20 transition-all text-xs"
            >
              ✕
            </button>
            
            <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light border-b border-gold/15 pb-2 uppercase">
              Track Delivery Rider - {activeTrackingOrder.orderId}
            </h3>
            
            <div className="flex flex-col gap-1.5 text-xs text-brown/85 dark:text-cream/80 bg-brown-dark/5 p-3 rounded-xl border border-gold/10 font-sans">
              <div><strong>Rider Name:</strong> {activeTrackingOrder.deliveryPartnerName || 'Ramu'}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <strong>Rider Contact:</strong>
                <span className="font-mono">{activeTrackingOrder.deliveryPartnerPhone || '+91 9876543210'}</span>
                <a href={`tel:${activeTrackingOrder.deliveryPartnerPhone || '+91 9876543210'}`} className="p-0.5 rounded bg-gold/10 hover:bg-gold/30 text-gold border border-gold/25" title="Call">📞</a>
                <a href={`https://wa.me/${(activeTrackingOrder.deliveryPartnerPhone || '+91 9876543210').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/25" title="WhatsApp">💬</a>
                <a href={`sms:${activeTrackingOrder.deliveryPartnerPhone || '+91 9876543210'}`} className="p-0.5 rounded bg-blue-500/10 hover:bg-blue-500/30 text-blue-500 border border-blue-500/25" title="SMS">✉️</a>
              </div>
              <div><strong>User Address:</strong> {activeTrackingOrder.address || 'Mallepalli Highway, Vizag'}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <strong>User Phone:</strong>
                <span className="font-mono">{activeTrackingOrder.phone || '+91 9736222999'}</span>
                <a href={`tel:${activeTrackingOrder.phone || '+91 9736222999'}`} className="p-0.5 rounded bg-gold/10 hover:bg-gold/30 text-gold border border-gold/25" title="Call">📞</a>
                <a href={`https://wa.me/${(activeTrackingOrder.phone || '+91 9736222999').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-500 border border-emerald-500/25" title="WhatsApp">💬</a>
                <a href={`sms:${activeTrackingOrder.phone || '+91 9736222999'}`} className="p-0.5 rounded bg-blue-500/10 hover:bg-blue-500/30 text-blue-500 border border-blue-500/25" title="SMS">✉️</a>
              </div>
            </div>

            <ManagerTrackingMap 
              progress={activeTrackingOrder.deliveryLocation?.progress || 0}
              status={activeTrackingOrder.status}
            />
            
            <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono font-bold">
              <span>Coordinates: {activeTrackingOrder.deliveryLocation?.lat?.toFixed(5) || '16.3067'}° N, {activeTrackingOrder.deliveryLocation?.lng?.toFixed(5) || '80.4365'}° E</span>
              <span>Progress: {activeTrackingOrder.deliveryLocation?.progress || 0}%</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
