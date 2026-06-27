import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { apiCall } from '../services/api';
import logo from '../assets/logo.png';
import { Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(loginStart());
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      dispatch(loginSuccess({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken
      }));

      // Navigate to corresponding dashboard
      if (response.user.role === 'admin') navigate('/admin');
      else if (response.user.role === 'manager') navigate('/manager');
      else if (response.user.role === 'kitchen') navigate('/kitchen');
      else if (response.user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Login failed. Please verify credentials.'));
    }
  };

  // Quick fill helper for easy testing
  const handleQuickFill = (role: 'admin' | 'manager' | 'kitchen' | 'delivery' | 'customer') => {
    const creds = {
      admin: { email: 'admin@pakkamilitary.com', pass: 'admin123' },
      manager: { email: 'manager@pakkamilitary.com', pass: 'manager123' },
      kitchen: { email: 'kitchen@pakkamilitary.com', pass: 'kitchen123' },
      delivery: { email: 'delivery@pakkamilitary.com', pass: 'delivery123' },
      customer: { email: 'customer@gmail.com', pass: 'customer123' }
    };
    setEmail(creds[role].email);
    setPassword(creds[role].pass);
  };

  return (
    <div className="min-h-screen bg-cream/40 dark:bg-brown-dark flex items-center justify-center p-4 text-xs">
      <div className="glass-panel border-gold/30 p-8 rounded-3xl max-w-md w-full shadow-glass-gold flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full border border-gold" />
          <h2 className="font-serif text-2xl font-extrabold text-brown dark:text-gold-light mt-2">Military Staff Portal</h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Sign in to manage operations</span>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3 bg-red/10 border border-red/25 rounded-lg text-red font-bold flex items-center gap-2">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gold" size={15} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@pakkamilitary.com"
                className="w-full pl-10 pr-4 py-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gold" size={15} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg font-bold transition-all uppercase tracking-wider shadow mt-2"
          >
            {loading ? 'Verifying Credentials...' : 'Access Dashboard'}
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-1 border-t border-gold/15">
          <span className="absolute bg-cream px-3 text-[10px] text-gray-400 font-bold uppercase dark:bg-brown-dark">
            Demo Portal Quick Fill
          </span>
        </div>

        {/* Quick Fill Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { role: 'admin', label: 'Admin', color: 'border-red-600/30 text-red-600 hover:bg-red-600/10' },
            { role: 'manager', label: 'Manager', color: 'border-amber-600/30 text-amber-600 hover:bg-amber-600/10' },
            { role: 'kitchen', label: 'Kitchen Chef', color: 'border-emerald-600/30 text-emerald-600 hover:bg-emerald-600/10' },
            { role: 'delivery', label: 'Delivery', color: 'border-blue-600/30 text-blue-600 hover:bg-blue-600/10' },
            { role: 'customer', label: 'Customer', color: 'border-gold/30 text-gold-dark hover:bg-gold/10' }
          ].map((item) => (
            <button
              key={item.role}
              onClick={() => handleQuickFill(item.role as any)}
              className={`py-2 border rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${item.color}`}
            >
              <Sparkles size={11} className="shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <span className="text-center text-[10px] text-gray-400 mt-2">
          New client ordering? <Link to="/register" className="underline text-gold font-bold">Register Account</Link>
        </span>
      </div>
    </div>
  );
};
