import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../redux/store';
import { 
  removeFromCart, 
  updateQuantity, 
  setOrderType, 
  setTableNumber, 
  applyCoupon,
  setOrderNotes,
  clearCart,
  selectCartTotals,
  saveForLater,
  moveToCart,
  removeSaved
} from '../redux/slices/cartSlice';
import { apiCall } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Trash2, ArrowLeft, Bookmark, Zap, Check, AlertCircle } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { items, savedForLater, orderType, tableNumber, coupon, orderNotes, updatingOrderId, updatingOrderFriendlyId } = useSelector((state: RootState) => state.cart);
  const totals = useSelector(selectCartTotals);

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [deliverySubtype, setDeliverySubtype] = useState<'Home' | 'Office'>('Home');
  const [companyName, setCompanyName] = useState('');
  const [floorBlock, setFloorBlock] = useState('');
  const [cabinNumber, setCabinNumber] = useState('');

  const availableCoupons = [
    { code: 'MILITARY10', desc: '10% off on orders above ₹500', minOrderValue: 500, discountPercentage: 10, maxDiscount: 100 },
    { code: 'ANDHRASPECIAL', desc: '15% off on orders above ₹800', minOrderValue: 800, discountPercentage: 15, maxDiscount: 200 },
    { code: 'BIRYANI50', desc: '20% off on orders above ₹1200', minOrderValue: 1200, discountPercentage: 20, maxDiscount: 300 }
  ];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const codeUpper = couponInput.trim().toUpperCase();
    const found = availableCoupons.find((c) => c.code === codeUpper);

    if (!found) {
      setCouponError('Invalid coupon code.');
      dispatch(applyCoupon(null));
      return;
    }

    if (totals.subtotal < found.minOrderValue) {
      setCouponError(`Min order value of ₹${found.minOrderValue} required.`);
      dispatch(applyCoupon(null));
      return;
    }

    dispatch(applyCoupon(found));
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (orderType === 'Dine In' && !tableNumber) {
      alert('Please select your Table Number (1-100) for Dine In.');
      return;
    }
    if (orderType === 'Home Delivery') {
      if (!phone || !address) {
        alert('Please provide mobile number and delivery address.');
        return;
      }
      if (deliverySubtype === 'Office') {
        if (!companyName || !floorBlock || !cabinNumber) {
          alert('Please fill in all corporate office delivery fields: Company, Floor/Block, and Cabin/Cubicle.');
          return;
        }
      }
    }

    setPlacingOrder(true);
    try {
      if (updatingOrderId) {
        // Send PUT request to update existing order
        await apiCall(`/orders/${updatingOrderId}`, {
          method: 'PUT',
          body: JSON.stringify({
            items: items.map(item => ({
              foodId: item.foodId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              isVeg: item.isVeg
            })),
            couponCode: coupon?.code,
            specialInstructions: orderNotes
          })
        });

        const targetId = updatingOrderId;
        dispatch(clearCart());
        alert('Order updated successfully! The chef has been notified of changes.');
        navigate(`/order-tracking/${targetId}`);
      } else {
        // Create new order
        const response = await apiCall('/orders', {
          method: 'POST',
          body: JSON.stringify({
            type: orderType,
            tableNumber: orderType === 'Dine In' ? tableNumber : undefined,
            items: items.map(item => ({
              foodId: item.foodId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              isVeg: item.isVeg
            })),
            couponCode: coupon?.code,
            paymentMethod,
            specialInstructions: orderNotes,
            address: orderType === 'Home Delivery' ? address : undefined,
            phone: phone || undefined,
            deliverySubtype: orderType === 'Home Delivery' ? deliverySubtype : undefined,
            companyName: orderType === 'Home Delivery' && deliverySubtype === 'Office' ? companyName : undefined,
            floorBlock: orderType === 'Home Delivery' && deliverySubtype === 'Office' ? floorBlock : undefined,
            cabinNumber: orderType === 'Home Delivery' && deliverySubtype === 'Office' ? cabinNumber : undefined
          })
        });

        dispatch(clearCart());
        localStorage.setItem('lastOrderId', response.order._id);
        navigate(`/order-tracking/${response.order._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Checkout failed.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex flex-col gap-8 w-full min-h-screen">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-1.5 text-xs font-bold text-brown dark:text-gold hover:text-gold transition-colors self-start"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </button>

      <div className="text-center flex flex-col items-center gap-1">
        <h2 className="font-serif text-3xl font-extrabold text-brown dark:text-gold-light">
          {t('cart')}
        </h2>
        <div className="w-12 h-1 bg-gold rounded-full" />
      </div>

      {updatingOrderId && (
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex justify-between items-center max-w-6xl mx-auto w-full shadow-sm">
          <span>
            ⚠️ You are modifying active <strong>Order #{updatingOrderFriendlyId}</strong>. You can change quantities, add new items, or update instructions. Click <strong>"Update Order & Notify Kitchen"</strong> to sync.
          </span>
          <button 
            onClick={() => dispatch(clearCart())}
            className="underline text-[10px] font-bold text-red hover:text-red-dark pl-4 shrink-0"
          >
            Cancel Modification
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gold/25 rounded-2xl flex flex-col items-center gap-4 bg-cream-light/30">
          <ShoppingBag size={48} className="text-gold/60 animate-bounce" />
          <h3 className="font-serif text-lg font-bold text-brown dark:text-gold-light">Your cart is currently empty</h3>
          <p className="text-xs text-brown/70 dark:text-cream/70 max-w-xs">
            Browse our Guntur spice chicken starters and military special biryanis to add items to your cart!
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-full text-xs font-bold transition-all"
          >
            Explore Menu Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main items and Order flow */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Step 1: Order Type Selection */}
            <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
              <h4 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase tracking-wider">
                Step 1: Choose Order Type {updatingOrderId && <span className="text-[10px] text-amber-500 font-sans font-bold">(Locked for Modification)</span>}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {(['Dine In', 'Takeaway', 'Home Delivery'] as const).map((type) => (
                  <button
                    key={type}
                    disabled={!!updatingOrderId}
                    onClick={() => dispatch(setOrderType(type))}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                      orderType === type
                      ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown'
                      : 'bg-transparent text-brown dark:text-cream border-gold/25 hover:bg-gold-light/10'
                    } ${updatingOrderId ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {type === 'Dine In' ? t('dineIn') : type === 'Takeaway' ? t('takeaway') : t('delivery')}
                  </button>
                ))}
              </div>

              {/* Conditional parameters based on orderType */}
              {orderType === 'Dine In' && (
                <div className="flex flex-col gap-1.5 mt-2 animate-fade-in">
                  <label className="text-xs font-bold text-brown/85 dark:text-cream/80">Table Number (1 - 100)</label>
                  <input 
                    type="number"
                    min={1}
                    max={100}
                    disabled={!!updatingOrderId}
                    value={tableNumber || ''}
                    onChange={(e) => dispatch(setTableNumber(e.target.value ? Number(e.target.value) : null))}
                    placeholder="Enter Table Number"
                    className="p-3 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-lg text-brown dark:text-cream focus:outline-none focus:border-gold font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  {tableNumber && (
                    <span className="text-[10px] text-green-600 font-semibold">✓ Table {tableNumber} selected. QR session auto-locked.</span>
                  )}
                </div>
              )}

              {orderType === 'Home Delivery' && (
                <div className="flex flex-col gap-3.5 mt-2 animate-fade-in text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brown/85 dark:text-cream/80">Mobile Number</label>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter mobile number for OTP confirmation"
                      className="p-3 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-lg text-brown dark:text-cream focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brown/85 dark:text-cream/80">Delivery Destination Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliverySubtype('Home')}
                        className={`py-2 px-3 border rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                          deliverySubtype === 'Home'
                          ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown font-extrabold'
                          : 'bg-transparent text-brown dark:text-cream border-gold/20 hover:bg-gold-light/10'
                        }`}
                      >
                        🏠 Home Residence
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliverySubtype('Office')}
                        className={`py-2 px-3 border rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                          deliverySubtype === 'Office'
                          ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown font-extrabold'
                          : 'bg-transparent text-brown dark:text-cream border-gold/20 hover:bg-gold-light/10'
                        }`}
                      >
                        🏢 Corporate Office
                      </button>
                    </div>
                  </div>

                  {deliverySubtype === 'Office' && (
                    <div className="grid grid-cols-3 gap-2 mt-1 p-3 border border-gold/15 bg-gold-light/5 rounded-xl animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-brown/80 dark:text-cream/70">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. TCS / Wipro"
                          className="p-2 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded text-brown dark:text-cream focus:outline-none focus:border-gold font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-brown/80 dark:text-cream/70">Floor / Block</label>
                        <input
                          type="text"
                          value={floorBlock}
                          onChange={(e) => setFloorBlock(e.target.value)}
                          placeholder="e.g. 5th Floor, B-Block"
                          className="p-2 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded text-brown dark:text-cream focus:outline-none focus:border-gold font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-brown/80 dark:text-cream/70">Cabin / Cubicle</label>
                        <input
                          type="text"
                          value={cabinNumber}
                          onChange={(e) => setCabinNumber(e.target.value)}
                          placeholder="e.g. Cabin #402"
                          className="p-2 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded text-brown dark:text-cream focus:outline-none focus:border-gold font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brown/85 dark:text-cream/80">
                      {deliverySubtype === 'Office' ? 'Office Park / Corporate Address' : 'Delivery Address'}
                    </label>
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={deliverySubtype === 'Office' ? 'Enter Office Park Name, Street, Area/Highway' : 'Enter flat number, street name, landmark'}
                      rows={2}
                      className="p-3 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-lg text-brown dark:text-cream focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-4">
              <h4 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase tracking-wider">
                Cart Items
              </h4>
              <div className="flex flex-col gap-4 divider-y divide-gold/10">
                {items.map((item) => (
                  <div key={item.foodId} className="flex gap-4 items-center justify-between py-2 border-b border-gold/10 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      {/* Badge indicator */}
                      <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red'} shrink-0`} />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-brown dark:text-gold-light">{item.name}</span>
                        <span className="text-[10px] text-brown-light font-bold font-sans">₹{item.price} each</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gold/25 rounded-full overflow-hidden bg-cream-light dark:bg-brown">
                        <button 
                          onClick={() => dispatch(updateQuantity({ foodId: item.foodId, quantity: item.quantity - 1 }))}
                          className="px-2.5 py-1 text-xs hover:bg-gold-light/25 font-extrabold"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold font-sans">{item.quantity}</span>
                        <button 
                          onClick={() => dispatch(updateQuantity({ foodId: item.foodId, quantity: item.quantity + 1 }))}
                          className="px-2.5 py-1 text-xs hover:bg-gold-light/25 font-extrabold"
                        >
                          +
                        </button>
                      </div>

                      {/* Bookmark / Delete */}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => dispatch(saveForLater(item.foodId))}
                          className="text-gray-400 hover:text-gold"
                          title="Save for Later"
                        >
                          <Bookmark size={16} />
                        </button>
                        <button 
                          onClick={() => dispatch(removeFromCart(item.foodId))}
                          className="text-red-light hover:text-red"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save for Later Section */}
            {savedForLater.length > 0 && (
              <div className="glass-panel p-5 rounded-2xl border border-gold/20 shadow flex flex-col gap-4">
                <h4 className="font-serif text-sm font-bold text-gold uppercase tracking-wider">
                  Save For Later
                </h4>
                <div className="flex flex-col gap-3">
                  {savedForLater.map((item) => (
                    <div key={item.foodId} className="flex items-center justify-between py-2 border-b border-gold/15 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-brown dark:text-cream-light">{item.name}</span>
                        <span className="text-[10px] text-brown-light font-bold">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => dispatch(moveToCart(item.foodId))}
                          className="px-3.5 py-1.5 border border-gold text-gold hover:bg-gold hover:text-brown rounded-full text-[10px] font-bold transition-all"
                        >
                          Move To Cart
                        </button>
                        <button 
                          onClick={() => dispatch(removeSaved(item.foodId))}
                          className="text-red-light hover:text-red"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkout & Bill Summary panel */}
          <div className="flex flex-col gap-6">
            
            {/* Coupon Panel */}
            <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-3">
              <h4 className="font-serif text-xs font-extrabold text-brown dark:text-gold-light uppercase tracking-wider">
                Coupon Promotional Code
              </h4>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Code (e.g. BIRYANI50)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-grow text-xs px-3.5 py-2.5 bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-lg text-brown dark:text-cream focus:outline-none focus:border-gold uppercase font-bold"
                />
                <button 
                  type="submit"
                  className="px-4 py-2.5 bg-brown text-gold border border-gold rounded-lg text-xs font-extrabold hover:bg-gold hover:text-brown transition-all"
                >
                  Apply
                </button>
              </form>
              {couponError && (
                <span className="text-[10px] text-red font-bold flex items-center gap-1">
                  <AlertCircle size={10} /> {couponError}
                </span>
              )}
              {coupon && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-[10px] p-2.5 rounded-lg font-semibold flex items-center justify-between">
                  <span>Code Applied: <strong>{coupon.code}</strong> ({coupon.discountPercentage}% Off)</span>
                  <button 
                    onClick={() => { dispatch(applyCoupon(null)); setCouponInput(''); }}
                    className="underline text-red-light font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Payment Mode */}
            {!updatingOrderId && (
              <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-3">
                <h4 className="font-serif text-xs font-extrabold text-brown dark:text-gold-light uppercase tracking-wider">
                  Payment Method
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {['UPI', 'Stripe', 'Razorpay', 'COD'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 border rounded-lg font-bold flex items-center justify-between transition-all ${
                        paymentMethod === method
                        ? 'bg-brown text-gold border-gold dark:bg-gold dark:text-brown'
                        : 'bg-transparent text-brown dark:text-cream border-gold/20 hover:bg-gold-light/10'
                      }`}
                    >
                      <span>{method === 'COD' ? 'Cash on Delivery' : method}</span>
                      {paymentMethod === method && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div className="glass-panel p-5 rounded-2xl border border-gold/25 shadow flex flex-col gap-2">
              <h4 className="font-serif text-xs font-extrabold text-brown dark:text-gold-light uppercase tracking-wider">
                Chef Instructions
              </h4>
              <textarea 
                value={orderNotes}
                onChange={(e) => dispatch(setOrderNotes(e.target.value))}
                placeholder="E.g., Make it extra spicy, No onions, etc."
                rows={2}
                className="p-3 text-xs bg-cream-light/60 dark:bg-brown border border-gold/25 rounded-lg text-brown dark:text-cream focus:outline-none focus:border-gold"
              />
            </div>

            {/* Bill Calculations */}
            <div className="glass-panel p-5 rounded-2xl border border-gold/30 shadow-lg flex flex-col gap-4">
              <h4 className="font-serif text-sm font-bold text-brown dark:text-gold-light uppercase border-b border-gold/15 pb-2">
                Order Billing Invoice
              </h4>

              <div className="flex flex-col gap-2.5 text-xs text-brown/85 dark:text-cream/80 font-sans">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-bold">₹{totals.gst}</span>
                </div>
                {orderType === 'Dine In' && (
                  <div className="flex justify-between">
                    <span>Service Charge (5%)</span>
                    <span className="font-bold">₹{totals.serviceCharge}</span>
                  </div>
                )}
                {orderType === 'Home Delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-bold">₹{totals.deliveryCharge}</span>
                  </div>
                )}
                {totals.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{totals.discount}</span>
                  </div>
                )}
                <div className="border-t border-gold/20 my-2 pt-3 flex justify-between text-base font-extrabold text-red dark:text-gold">
                  <span className="font-serif">{t('grandTotal')}</span>
                  <span>₹{totals.grandTotal}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={placingOrder}
                className="w-full py-4 bg-brown text-gold hover:bg-gold hover:text-brown border-2 border-gold rounded-full text-xs font-bold transition-all uppercase tracking-wider shadow-md flex items-center justify-center gap-2 pulse-gold-btn"
              >
                <Zap size={14} className="fill-gold" />
                <span>
                  {placingOrder 
                    ? (updatingOrderId ? 'Updating Order...' : 'Processing Payment...') 
                    : (updatingOrderId ? 'Update Order & Notify Kitchen' : 'Secure Checkout & Pay')
                  }
                </span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
