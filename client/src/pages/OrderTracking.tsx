import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadOrderIntoCart } from '../redux/slices/cartSlice';
import { apiCall } from '../services/api';
import { subscribeToEvent, unsubscribeFromEvent, initiateSocketConnection } from '../services/socket';
import { Clock, CheckCircle2, ShieldCheck, MapPin, Phone, MessageSquare, AlertCircle, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const LiveTrackingMap: React.FC<{ progress: number; status: string; agentName: string }> = ({ progress, status, agentName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);

  const isActive = status === 'Served';
  const isCompleted = status === 'Completed';

  // Determine status description text
  let statusText = 'Waiting for kitchen preparation...';
  if (status === 'Ready') {
    statusText = `${agentName} is picking up your hot meal at Guntur Military Hotel.`;
  } else if (status === 'Served') {
    if (progress < 30) {
      statusText = `${agentName} has picked up your food and is navigating the Guntur Highway.`;
    } else if (progress < 70) {
      statusText = `${agentName} is passing Pakka Junction. Food is hot in the thermal case!`;
    } else if (progress < 95) {
      statusText = `${agentName} is on Mallepalli Road, turning onto your street.`;
    } else {
      statusText = `${agentName} is arriving at your gate! Please get ready with your OTP.`;
    }
  } else if (status === 'Completed') {
    statusText = 'Order delivered successfully. Enjoy your Andhra feast!';
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([16.3067, 80.4365], 13);
    mapRef.current = map;

    // Use Voyager tile layer for highly readable maps
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Restaurant marker
    const restIcon = L.divIcon({
      html: '<div style="background-color: #3E2723; border: 2px solid #D4AF37; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">🏨</div>',
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([16.3067, 80.4365], { icon: restIcon })
      .bindPopup('<b>Guntur Military Hotel</b><br/>Kitchen accepting and preparing hot meals.')
      .addTo(map);

    // Customer destination marker
    const homeIcon = L.divIcon({
      html: '<div style="background-color: #059669; border: 2px solid white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">🏠</div>',
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([16.3367, 80.4665], { icon: homeIcon })
      .bindPopup('<b>Your Home</b><br/>Delivery destination.')
      .addTo(map);

    // Connecting route polyline
    L.polyline([[16.3067, 80.4365], [16.3367, 80.4665]], {
      color: '#D4AF37',
      weight: 4,
      opacity: 0.8,
      dashArray: '6, 8'
    }).addTo(map);

    // Rider marker icon
    const riderIcon = L.divIcon({
      html: '<div style="background-color: #D4AF37; border: 2px solid #3E2723; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.5);" class="animate-bounce">🚴</div>',
      className: '',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    const riderMarker = L.marker([16.3067, 80.4365], { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    return () => {
      map.remove();
    };
  }, []);

  // Update position dynamically
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
    <div className="flex flex-col gap-3 mt-4 border-t border-gold/15 pt-4">
      <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider font-sans">
        <span>Delivery Live Tracking Map</span>
        <span className="text-red font-sans font-bold">{progress}% Completed</span>
      </div>

      <div 
        ref={mapContainerRef} 
        className="h-48 w-full rounded-2xl border border-gold/25 relative overflow-hidden shadow-inner z-10" 
      />

      <div className="flex gap-2.5 items-start p-3 bg-gold/5 border border-gold/15 rounded-xl">
        <Compass className="text-gold shrink-0 animate-spin-slow mt-0.5" size={14} style={{ animationDuration: '6s' }} />
        <div className="flex flex-col text-[10px] text-brown dark:text-cream/80 leading-relaxed font-sans">
          <span className="font-bold text-gold-dark uppercase tracking-wider">Live Position Updates</span>
          <span className="opacity-95">{statusText}</span>
          {isActive && (
            <span className="text-[8px] text-gray-500 font-mono mt-1 font-bold">
              GPS coords: {(16.3067 + progress * 0.0003).toFixed(5)}° N, {(80.4365 + progress * 0.0003).toFixed(5)}° E
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const OrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleEditOrderItems = () => {
    if (!order) return;
    const cartItems = order.items.map((item: any) => ({
      foodId: item.foodId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      isVeg: !!item.isVeg,
      image: ''
    }));

    dispatch(
      loadOrderIntoCart({
        id: order._id,
        friendlyId: order.orderId,
        items: cartItems,
        orderType: order.type,
        tableNumber: order.tableNumber || null,
        notes: order.specialInstructions || '',
      })
    );
    navigate('/');
  };

  useEffect(() => {
    // Initiate socket connection
    initiateSocketConnection();

    const fetchOrder = async () => {
      try {
        const data = await apiCall(`/orders/${id}`);
        setOrder(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Socket subscription
    subscribeToEvent('orderStatusChanged', (updatedOrder: any) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder);
      }
    });

    subscribeToEvent('deliveryLocationUpdate', (data: any) => {
      if (data.orderId === id) {
        setOrder((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            deliveryLocation: data.deliveryLocation,
            status: data.status || prev.status
          };
        });
      }
    });

    return () => {
      unsubscribeFromEvent('orderStatusChanged');
      unsubscribeFromEvent('deliveryLocationUpdate');
    };
  }, [id]);

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Received': return 1;
      case 'Preparing': return 2;
      case 'Ready': return 3;
      case 'Served':
      case 'Completed': return 4;
      default: return 1;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream/40 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream/40 flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl max-w-sm text-center flex flex-col items-center gap-4">
          <AlertCircle size={40} className="text-red animate-bounce" />
          <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light">Order Tracking Error</h3>
          <p className="text-xs text-brown/70">
            We could not resolve this order reference. Please go back to checkout or contact support.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg text-xs font-bold transition-all"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 flex flex-col gap-8 w-full min-h-screen">
      <div className="text-center flex flex-col items-center gap-2">
        <span className="text-[10px] bg-gold/15 border border-gold/30 px-3 py-1 rounded-full text-gold-dark font-extrabold uppercase tracking-widest">
          Live Tracking Enabled
        </span>
        <h2 className="font-serif text-3xl font-extrabold text-brown dark:text-gold-light">
          Order Tracker
        </h2>
        <span className="text-xs font-bold text-brown-light opacity-80 font-sans">
          Order ID: {order.orderId} ({order.type})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Tracking status flow */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-8">
            <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light border-b border-gold/15 pb-3">
              Order Status: <span className="text-red font-sans">{order.status}</span>
            </h3>

            {/* Live Progress Bar Flow */}
            <div className="relative flex justify-between items-center w-full">
              {/* Connector line */}
              <div className="absolute left-0 right-0 top-5 h-1 bg-gold/15 -z-10" />
              <div 
                className="absolute left-0 top-5 h-1 bg-gold transition-all duration-500 -z-10" 
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {[
                { step: 1, label: 'Received', desc: 'Kitchen accepted' },
                { step: 2, label: 'Preparing', desc: 'Cooking started' },
                { step: 3, label: 'Ready', desc: 'Plated & Checked' },
                { step: 4, label: order.type === 'Dine In' ? 'Served' : 'Out for Delivery', desc: 'Enjoy meal!' }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-2 relative">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow transition-all ${
                    currentStep >= item.step
                    ? 'bg-brown text-gold border-gold scale-115 dark:bg-gold dark:text-brown'
                    : 'bg-cream-light text-brown/40 border-gold/20'
                  }`}>
                    {currentStep > item.step ? <CheckCircle2 size={16} /> : item.step}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-brown dark:text-cream-light text-center">{item.label}</span>
                  <span className="text-[8px] text-brown/45 dark:text-cream/40 text-center hidden sm:block">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Special notifications details */}
            <div className="bg-gold/5 border border-gold/20 p-4 rounded-xl text-xs leading-relaxed flex flex-col gap-2">
              <span className="font-bold text-gold-dark">Estimated Time: 15-20 Minutes</span>
              <p className="text-brown/70 dark:text-cream/70">
                Your order is currently sent to the live military kitchen queue. Table ordering updates sync every second over Socket.IO.
              </p>
              {order.specialInstructions && (
                <p className="border-t border-gold/15 pt-2 mt-1">
                  <strong>Special Instructions:</strong> <span className="italic text-red-dark">"{order.specialInstructions}"</span>
                </p>
              )}
              {['Received', 'Preparing'].includes(order.status) && (
                <div className="border-t border-gold/15 pt-3 mt-1 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <span className="text-[10px] text-brown-light font-semibold">
                    Forgot something? You can add, remove, or modify items before the kitchen finishes cooking.
                  </span>
                  <button
                    onClick={handleEditOrderItems}
                    className="px-4 py-2 bg-gold text-brown hover:bg-gold-dark hover:text-white font-extrabold rounded-lg transition-all shadow shrink-0 text-center uppercase tracking-wider text-[9px] border border-gold-dark/25"
                  >
                    Modify Items
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Partner widget if Home Delivery */}
            {order.type === 'Home Delivery' && (
              <div className="border border-gold/25 p-5 rounded-2xl bg-brown-dark/5 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-brown dark:text-gold uppercase tracking-wider">Delivery Agent Assigned</h4>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center font-serif text-sm font-extrabold text-brown">
                      {(order.deliveryPartnerName || 'Ramu')[0]}
                    </div>
                    <div className="flex flex-col text-xs">
                      <span className="font-bold text-brown dark:text-cream-light">{order.deliveryPartnerName || 'Ramu'} (Delivery Partner)</span>
                      <span className="text-[10px] text-gray-500">OTP Code: <strong className="text-red font-sans">{order.otp || '5623'}</strong> (Share on delivery)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${order.deliveryPartnerPhone || '+919876543210'}`} className="p-2 bg-cream-light border border-gold/20 rounded-full hover:bg-gold/10 transition-colors" title="Call">
                      <Phone size={14} className="text-gold" />
                    </a>
                    <a href={`https://wa.me/${(order.deliveryPartnerPhone || '+919876543210').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-cream-light border border-gold/20 rounded-full hover:bg-emerald-500/10 transition-colors" title="WhatsApp">
                      <span className="text-sm font-bold text-emerald-500">💬</span>
                    </a>
                    <a href={`sms:${order.deliveryPartnerPhone || '+919876543210'}`} className="p-2 bg-cream-light border border-gold/20 rounded-full hover:bg-blue-500/10 transition-colors" title="SMS">
                      <span className="text-sm font-bold text-blue-500">✉️</span>
                    </a>
                  </div>
                </div>

                {/* Live GPS Route Tracking Map */}
                <LiveTrackingMap 
                  progress={order.deliveryLocation?.progress || 0}
                  status={order.status}
                  agentName={order.deliveryPartnerName || 'Ramu'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Invoice Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
          <h3 className="font-serif text-sm font-bold text-brown dark:text-gold border-b border-gold/15 pb-2 uppercase">
            Order Items
          </h3>
          <div className="flex flex-col gap-3.5 max-h-60 overflow-y-auto text-xs text-brown/85 dark:text-cream/80 border-b border-gold/15 pb-4">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red'}`} />
                  <span>{item.name} <strong>x{item.quantity}</strong></span>
                </div>
                <span className="font-bold font-sans">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-brown/75 dark:text-cream/60 border-b border-gold/15 pb-4 font-sans">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span>₹{order.gst}</span>
            </div>
            {order.type === 'Dine In' && (
              <div className="flex justify-between">
                <span>Service Charge</span>
                <span>₹{order.serviceCharge}</span>
              </div>
            )}
            {order.type === 'Home Delivery' && (
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>₹{order.deliveryCharge}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Code</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-sm font-extrabold text-red dark:text-gold border-b border-gold/15 pb-4">
            <span className="font-serif">Grand Total</span>
            <span className="font-sans">₹{order.grandTotal}</span>
          </div>

          <div className="flex items-center gap-2 p-3 bg-brown-dark/5 border border-gold/15 rounded-xl text-[10px] text-gray-500 justify-center">
            <ShieldCheck size={14} className="text-gold shrink-0" />
            <span className="font-bold uppercase tracking-wider">Secured Military Invoicing</span>
          </div>
        </div>

      </div>
    </div>
  );
};
