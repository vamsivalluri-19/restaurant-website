import React, { useEffect, useState, useRef } from 'react';
import { apiCall } from '../services/api';
import { Link } from 'react-router-dom';
import { subscribeToEvent, unsubscribeFromEvent } from '../services/socket';
import { TableLayout, TableItem } from '../components/TableLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, UtensilsCrossed, CalendarClock, MessageSquareQuote, ShieldAlert, Award, TrendingUp, Settings, Trash2, CheckCircle, Users, ReceiptText } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const AdminTrackingMap: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
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

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'foods' | 'tables' | 'users' | 'reviews'>('orders');
  const [stats, setStats] = useState<any>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<any | null>(null);

  // Form states for adding foods
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Chicken');
  const [price, setPrice] = useState(250);
  const [discount, setDiscount] = useState(0);
  const [preparationTime, setPreparationTime] = useState(15);
  const [isVeg, setIsVeg] = useState(false);

  // Table update panel
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [selectedTableStatus, setSelectedTableStatus] = useState<TableItem['status']>('Available');

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

  const handlePrintInvoice = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Pop-up blocker is preventing invoice printing. Please allow pop-ups for this site.');
      return;
    }

    const itemsHtml = order.items.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px 0; text-align: left;">${item.name} x${item.quantity}</td>
        <td style="padding: 8px 0; text-align: right; font-family: monospace;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const dineInChargesHtml = order.type === 'Dine In' ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
        <span>Service Charge (5%)</span>
        <span>₹${order.serviceCharge}</span>
      </div>
    ` : '';

    const deliveryChargesHtml = order.type === 'Home Delivery' ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
        <span>Delivery Charge</span>
        <span>₹${order.deliveryCharge}</span>
      </div>
    ` : '';

    const discountHtml = order.discount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #059669; font-weight: bold;">
        <span>Discount Code</span>
        <span>-₹${order.discount}</span>
      </div>
    ` : '';

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${order.orderId}</title>
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 20px; color: #3E2723; background-color: #fff; }
            .invoice-box { max-width: 400px; margin: auto; padding: 20px; border: 1px solid #D4AF37; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; }
            .logo { font-size: 20px; font-weight: bold; color: #B71C1C; margin-bottom: 4px; }
            .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #D4AF37; margin-bottom: 10px; }
            .info-table { width: 100%; font-size: 12px; margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
            .totals { border-top: 1px solid #D4AF37; padding-top: 10px; font-size: 12px; }
            .grand-total { font-size: 16px; font-weight: bold; color: #B71C1C; display: flex; justify-content: space-between; margin-top: 8px; border-top: 2px double #D4AF37; padding-top: 8px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; border-top: 1px dashed #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo">🍽️ Andhra Style Pakka Military Hotel</div>
              <div class="tagline">Pakka Military, Pakka Fine Dine</div>
              <div style="font-size: 11px; color: #666; margin-top: 5px;">Invoice Number: ${order.orderId}</div>
              <div style="font-size: 10px; color: #888;">Date: ${new Date(order.createdAt).toLocaleString()}</div>
            </div>
            
            <table class="info-table">
              <tr>
                <td style="font-weight: bold;">Order Type:</td>
                <td style="text-align: right;">${order.type}</td>
              </tr>
              ${order.tableNumber ? `
              <tr>
                <td style="font-weight: bold;">Table Number:</td>
                <td style="text-align: right;">Table #${order.tableNumber}</td>
              </tr>
              ` : ''}
              ${order.user ? `
              <tr>
                <td style="font-weight: bold;">Customer:</td>
                <td style="text-align: right;">${order.user.name}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="font-weight: bold;">Payment Method:</td>
                <td style="text-align: right;">${order.paymentMethod}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Payment Status:</td>
                <td style="text-align: right; font-weight: bold; color: ${order.paymentStatus === 'Paid' ? '#059669' : '#d97706'};">${order.paymentStatus}</td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr style="border-bottom: 2px solid #eee; font-weight: bold; color: #555;">
                  <th style="padding: 8px 0; text-align: left;">Item</th>
                  <th style="padding: 8px 0; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
                <span>Subtotal</span>
                <span>₹${order.subtotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #555;">
                <span>GST (5%)</span>
                <span>₹${order.gst}</span>
              </div>
              ${dineInChargesHtml}
              ${deliveryChargesHtml}
              ${discountHtml}
              <div class="grand-total">
                <span>Grand Total</span>
                <span>₹${order.grandTotal}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for dining with us! Come back for more pakka military flavours!</p>
              <p>Powered by Pakka Military POS System</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsData = await apiCall('/analytics/dashboard');
        setStats(statsData);

        const tablesData = await apiCall('/tables');
        setTables(tablesData);

        const foodsData = await apiCall('/foods');
        setFoods(foodsData);

        const usersData = await apiCall('/auth/users');
        setUsers(usersData);

        const ordersData = await apiCall('/orders');
        setOrders(ordersData);

        const reviewsData = await apiCall('/reviews');
        setReviews(reviewsData);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [activeTab]);

  useEffect(() => {
    // Real-time socket synchronization for Admin
    subscribeToEvent('newOrder', (newOrder: any) => {
      setOrders((prev) => {
        const exists = prev.find((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
    });

    subscribeToEvent('orderStatusChanged', (updatedOrder: any) => {
      setOrders((prev) => 
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      setActiveTrackingOrder((prev: any) => (prev?._id === updatedOrder._id ? updatedOrder : prev));
    });

    subscribeToEvent('deliveryLocationUpdate', (data: any) => {
      setOrders((prev) => 
        prev.map((o) => {
          if (o._id === data.orderId) {
            return {
              ...o,
              deliveryLocation: data.deliveryLocation,
              status: data.status || o.status
            };
          }
          return o;
        })
      );
      setActiveTrackingOrder((prev: any) => {
        if (prev?._id === data.orderId) {
          return {
            ...prev,
            deliveryLocation: data.deliveryLocation,
            status: data.status || prev.status
          };
        }
        return prev;
      });
    });

    subscribeToEvent('tableStatusChanged', (payload: any) => {
      setTables((prev) => 
        prev.map((t) => (t.number === payload.number ? { ...t, status: payload.status } : t))
      );
    });

    return () => {
      unsubscribeFromEvent('newOrder');
      unsubscribeFromEvent('orderStatusChanged');
      unsubscribeFromEvent('tableStatusChanged');
      unsubscribeFromEvent('deliveryLocationUpdate');
    };
  }, []);

  const handleCreateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFood = await apiCall('/foods', {
        method: 'POST',
        body: JSON.stringify({ name, description, category, price, discount, preparationTime, isVeg })
      });
      setFoods((prev) => [...prev, newFood]);
      setName('');
      setDescription('');
      setPrice(250);
      setDiscount(0);
      setPreparationTime(15);
      setIsVeg(false);
      alert('Food item added successfully!');
    } catch (err) {
      alert('Failed to add food item.');
    }
  };

  const handleDeleteFood = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return;
    try {
      await apiCall(`/foods/${id}`, { method: 'DELETE' });
      setFoods((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert('Failed to delete food.');
    }
  };

  const handleTableClick = (table: TableItem) => {
    setSelectedTable(table);
    setSelectedTableStatus(table.status);
  };

  const handleUpdateTableStatus = async () => {
    if (!selectedTable) return;
    try {
      await apiCall(`/tables/${selectedTable.number}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: selectedTableStatus })
      });
      setTables((prev) => 
        prev.map((t) => (t.number === selectedTable.number ? { ...t, status: selectedTableStatus } : t))
      );
      setSelectedTable(null);
    } catch (err) {
      alert('Failed to update table status.');
    }
  };

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

  const COLORS = ['#D4AF37', '#3E2723', '#B71C1C', '#E53935', '#F5ECCE'];

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-cream/40 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream/35 dark:bg-brown-dark transition-colors duration-300 text-xs">
      
      {/* Sidebar Nav */}
      <aside className="w-full lg:w-64 bg-brown text-gold p-6 flex flex-col gap-6 dark:bg-brown-dark/95 border-r border-gold/20 shrink-0">
        <div className="flex items-center gap-2 border-b border-gold/15 pb-4 mb-2">
          <Settings size={22} className="text-gold animate-spin" style={{ animationDuration: '4s' }} />
          <h2 className="font-serif text-base font-extrabold tracking-wide text-gold-light uppercase">Military Admin Portal</h2>
        </div>
        
        <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
          {[
            { id: 'orders', label: 'Order Tracking & Payments', icon: <ReceiptText size={16} /> },
            { id: 'foods', label: 'Menu Manager', icon: <UtensilsCrossed size={16} /> },
            { id: 'tables', label: 'Table Layout', icon: <CalendarClock size={16} /> },
            { id: 'users', label: 'User Details', icon: <Users size={16} /> },
            { id: 'reviews', label: 'Reviews Approval', icon: <MessageSquareQuote size={16} /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold uppercase transition-all shrink-0 ${
                activeTab === item.id
                ? 'bg-gold text-brown shadow font-extrabold border border-gold-dark/20'
                : 'bg-transparent text-cream hover:bg-gold-light/10'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-wider">{item.label}</span>
            </button>
          ))}
          
          {/* Operator Quick Jumps */}
          <div className="border-t border-gold/15 my-2 pt-4 flex flex-col gap-1.5">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-gold/45 mb-1 px-4">Operator Portals</span>
            <Link to="/kitchen" className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold uppercase hover:bg-gold-light/10 text-cream/80 hover:text-gold transition-all">
              <UtensilsCrossed size={14} className="text-gold shrink-0" />
              <span className="text-[9px] tracking-wider">Kitchen KDS</span>
            </Link>
            <Link to="/manager" className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold uppercase hover:bg-gold-light/10 text-cream/80 hover:text-gold transition-all">
              <TrendingUp size={14} className="text-gold shrink-0" />
              <span className="text-[9px] tracking-wider">Manager View</span>
            </Link>
            <Link to="/delivery" className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold uppercase hover:bg-gold-light/10 text-cream/80 hover:text-gold transition-all">
              <ShieldAlert size={14} className="text-gold shrink-0" />
              <span className="text-[9px] tracking-wider">Delivery View</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 flex flex-col gap-8 overflow-y-auto">
        


        {/* Tab 2: Foods Management */}
        {activeTab === 'foods' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
            {/* Create Food Form */}
            <div className="glass-panel p-6 rounded-2xl border border-gold/25 shadow flex flex-col gap-5">
              <h3 className="font-serif text-sm font-bold text-brown dark:text-gold uppercase border-b border-gold/15 pb-2">Add New Menu Item</h3>
              <form onSubmit={handleCreateFood} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-500">Food Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken Roast" className="p-2.5 bg-cream-light border border-gold/20 rounded-lg focus:outline-none dark:bg-brown" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-gray-500">Description</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fragrant military recipe..." rows={2} className="p-2.5 bg-cream-light border border-gold/20 rounded-lg focus:outline-none dark:bg-brown" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-500">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2.5 bg-cream-light border border-gold/20 rounded-lg dark:bg-brown">
                      <option value="Chicken">Chicken</option>
                      <option value="Mutton">Mutton</option>
                      <option value="Biryanis">Biryanis</option>
                      <option value="Cool Drinks">Cool Drinks</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-500">Price (₹)</label>
                    <input type="number" required value={price} onChange={(e) => setPrice(Number(e.target.value))} className="p-2.5 bg-cream-light border border-gold/20 rounded-lg dark:bg-brown font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-500">Discount (%)</label>
                    <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="p-2.5 bg-cream-light border border-gold/20 rounded-lg dark:bg-brown" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-gray-500">Prep Time (Mins)</label>
                    <input type="number" value={preparationTime} onChange={(e) => setPreparationTime(Number(e.target.value))} className="p-2.5 bg-cream-light border border-gold/20 rounded-lg dark:bg-brown" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} className="w-4 h-4 accent-gold" id="isVegCheck" />
                  <label htmlFor="isVegCheck" className="font-bold text-gray-500">Vegetarian 🟢</label>
                </div>
                <button type="submit" className="w-full py-3 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg font-bold transition-all uppercase mt-2">
                  Create Item
                </button>
              </form>
            </div>

            {/* Foods List */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <h3 className="font-serif text-sm font-bold text-brown dark:text-gold uppercase">Active Menu Items ({foods.length})</h3>
              <div className="flex flex-col gap-2">
                {foods.map((food) => (
                  <div key={food._id} className="flex justify-between items-center p-3 border border-gold/10 rounded-xl bg-cream-light/50 dark:bg-brown/50">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-brown dark:text-gold-light">{food.name} ({food.category})</span>
                      <span className="text-[10px] text-gray-500">Price: ₹{food.price} | Prep: {food.preparationTime} mins</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteFood(food._id)}
                      className="p-2 bg-red-light/10 text-red-light hover:text-red hover:bg-red-light/20 rounded-full transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Table Layout Modifier */}
        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
            {/* Visual Grid */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-6">
              <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase tracking-wider">
                100 Tables Seating Layout
              </h3>
              <TableLayout 
                tables={tables}
                selectedTableNumber={selectedTable?.number}
                onTableClick={handleTableClick}
              />
            </div>

            {/* Selected Table Manager panel */}
            <div className="glass-panel p-6 rounded-2xl border border-gold/25 shadow flex flex-col gap-5">
              <h3 className="font-serif text-sm font-bold text-brown dark:text-gold uppercase border-b border-gold/15 pb-2">Modify Seating Desk</h3>
              {selectedTable ? (
                <div className="flex flex-col gap-4">
                  <div className="p-3 bg-gold/10 border border-gold/25 rounded-lg flex justify-between items-center">
                    <span className="font-bold">Table #{selectedTable.number}</span>
                    <span className="text-[10px] font-semibold text-gold-dark">Capacity: {selectedTable.capacity} Seats</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-500">Change Status</label>
                    <select 
                      value={selectedTableStatus} 
                      onChange={(e: any) => setSelectedTableStatus(e.target.value)}
                      className="p-3 bg-cream-light border border-gold/20 rounded-lg dark:bg-brown"
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="Occupied">🔴 Occupied</option>
                      <option value="Reserved">🟡 Reserved</option>
                      <option value="Cleaning">🔵 Cleaning</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleUpdateTableStatus}
                    className="w-full py-3 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg font-bold transition-all uppercase mt-2 shadow"
                  >
                    Apply Status Change
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 font-bold border border-dashed border-gold/10 rounded-xl">
                  Click any table in the visual floor layout to modify its real-time seating availability.
                </div>
              )}
            </div>
          </div>
        )}



        {/* Tab 5: Users list */}
        {activeTab === 'users' && (
          <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4 w-full animate-fade-in max-h-[75vh] overflow-y-auto">
            <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">Registered Users & Staff Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gold/20 text-gray-500 font-bold">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">Phone</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2 text-right">Loyalty Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/10">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gold-light/5">
                      <td className="py-3.5 px-2 font-semibold text-brown dark:text-cream">{u.name}</td>
                      <td className="py-3.5 px-2 font-mono text-gray-500">{u.email}</td>
                      <td className="py-3.5 px-2">{u.phone || 'N/A'}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          u.role === 'admin' ? 'bg-red-600/10 text-red-600' :
                          u.role === 'manager' ? 'bg-amber-600/10 text-amber-600' :
                          u.role === 'kitchen' ? 'bg-emerald-600/10 text-emerald-600' :
                          u.role === 'delivery' ? 'bg-blue-600/10 text-blue-600' :
                          'bg-gold/15 text-gold-dark'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-red dark:text-gold">{u.loyaltyPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Reviews Approval */}
        {activeTab === 'reviews' && (
          <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4 w-full animate-fade-in max-h-[75vh] overflow-y-auto">
            <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">Customer Feedbacks & Reviews</h3>
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
                  No reviews submitted yet in the military database store.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Orders transactions */}
        {activeTab === 'orders' && (
          <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-lg flex flex-col gap-4 w-full animate-fade-in max-h-[75vh] overflow-y-auto">
            <h3 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">Order Tracking & Payments</h3>
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
                    <th className="py-3 px-2 text-right">Action</th>
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
                                <span className="truncate block" title={o.address}>
                                  📍 {o.address || 'No Address Provided'}
                                </span>
                                {o.deliverySubtype === 'Office' && (
                                  <span className="text-[8px] text-gray-400">
                                    🏢 {o.companyName} | Fl: {o.floorBlock} | Cab: {o.cabinNumber}
                                  </span>
                                )}
                              </div>
                            )}
                            {o.type === 'Takeaway' && (
                              <span className="text-purple-600 font-bold">🛍️ Self Pickup</span>
                            )}
                          </div>

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
                      <td className="py-3.5 px-2 text-right">
                        <button 
                          onClick={() => handlePrintInvoice(o)}
                          className="px-2.5 py-1.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded font-bold text-[9px] uppercase tracking-wider transition-all"
                        >
                          Print Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Tracking Modal */}
      {activeTrackingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-gold/30 shadow-2xl max-w-lg w-full flex flex-col gap-4 relative animate-scale-up text-xs">
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

            {/* Live GPS Map */}
            <AdminTrackingMap 
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
