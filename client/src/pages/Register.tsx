import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../redux/slices/authSlice';
import { apiCall } from '../services/api';
import logo from '../assets/logo.png';
import { User, Mail, Lock, Phone } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Role specific details states
  const [staffId, setStaffId] = useState('');
  const [securityToken, setSecurityToken] = useState('');
  const [specialty, setSpecialty] = useState('Biryani Specialist');
  const [healthCertId, setHealthCertId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [loyaltyOptIn, setLoyaltyOptIn] = useState(true);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    setError('');
    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role,
        // Role specific extras
        ...(role === 'customer' ? { loyaltyOptIn } : {}),
        ...(role === 'admin' || role === 'manager' ? { staffId, securityToken } : {}),
        ...(role === 'kitchen' ? { specialty, healthCertId } : {}),
        ...(role === 'delivery' ? { licenseNumber, vehicleType } : {}),
      };

      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      dispatch(
        loginSuccess({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        })
      );
      alert('Registration successful! Directing to homepage.');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream/40 dark:bg-brown-dark flex items-center justify-center p-4 text-xs">
      <div className="glass-panel border-gold/30 p-8 rounded-3xl max-w-md w-full shadow-glass-gold flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Logo" className="w-16 h-16 rounded-full border border-gold" />
          <h2 className="font-serif text-2xl font-extrabold text-brown dark:text-gold-light mt-2">Create Account</h2>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Join the Military Dining Club</span>
        </div>

        {error && (
          <div className="p-3 bg-red/10 border border-red/25 rounded-lg text-red font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gold" size={15} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full pl-10 pr-4 py-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gold" size={15} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-gold" size={15} />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9999999999"
                className="w-full pl-10 pr-4 py-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Select Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold font-bold"
            >
              <option value="customer">Customer (కస్టమర్)</option>
              <option value="admin">Restaurant Admin (అడ్మిన్)</option>
              <option value="manager">Restaurant Manager (మేనేజర్)</option>
              <option value="kitchen">Kitchen Chef (కిచెన్ స్టాఫ్)</option>
              <option value="delivery">Delivery Partner (డెలివరీ భాగస్వామి)</option>
            </select>
          </div>

          {/* Role Specific Conditional Details */}
          {role === 'customer' && (
            <div className="flex items-center gap-2 p-1.5 border border-gold/15 rounded-lg bg-gold/5 mt-1 animate-fade-in">
              <input 
                type="checkbox" 
                id="loyaltyCheck" 
                checked={loyaltyOptIn} 
                onChange={(e) => setLoyaltyOptIn(e.target.checked)}
                className="w-4 h-4 accent-gold cursor-pointer"
              />
              <label htmlFor="loyaltyCheck" className="text-[10px] text-brown-light dark:text-gold-light cursor-pointer font-semibold leading-tight">
                Enroll in Military Loyalty Club (Earn ₹1 points per ₹10 spent)
              </label>
            </div>
          )}

          {(role === 'admin' || role === 'manager') && (
            <div className="flex flex-col gap-3 p-3.5 border border-gold/25 rounded-xl bg-gold/5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-500">Employee Staff ID</label>
                <input 
                  type="text" 
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. EMP-1092"
                  className="w-full p-2.5 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-500">Security Authorization Token</label>
                <input 
                  type="password" 
                  required
                  value={securityToken}
                  onChange={(e) => setSecurityToken(e.target.value)}
                  placeholder="e.g. MIL-SEC-2026"
                  className="w-full p-2.5 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          {role === 'kitchen' && (
            <div className="flex flex-col gap-3 p-3.5 border border-gold/25 rounded-xl bg-gold/5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-500">Culinary Specialty</label>
                <select 
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-2.5 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg focus:outline-none focus:border-gold"
                >
                  <option value="Biryani Specialist">Biryani Specialist (బిర్యానీ మాస్టర్)</option>
                  <option value="Mutton Fry Master">Mutton Fry Master</option>
                  <option value="Starters & Roast Chef">Starters & Roast Chef</option>
                  <option value="Desserts Chef">Desserts Chef</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-500">Kitchen Health Certificate ID</label>
                <input 
                  type="text" 
                  required
                  value={healthCertId}
                  onChange={(e) => setHealthCertId(e.target.value)}
                  placeholder="e.g. FSSAI-HLTH-992"
                  className="w-full p-2.5 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          {role === 'delivery' && (
            <div className="flex flex-col gap-3 p-3.5 border border-gold/25 rounded-xl bg-gold/5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-500">Driving License Number</label>
                <input 
                  type="text" 
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. AP-31-DL-102938"
                  className="w-full p-2.5 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-500">Vehicle Type</label>
                <select 
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-2.5 bg-cream-light dark:bg-brown border border-gold/20 rounded-lg focus:outline-none focus:border-gold font-bold"
                >
                  <option value="Bike">Two Wheeler (Motorcycle)</option>
                  <option value="Electric Scooter">Electric Scooter (Green)</option>
                  <option value="Bicycle">Bicycle</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-gray-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gold" size={15} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose password"
                className="w-full pl-10 pr-4 py-3 bg-cream-light dark:bg-brown border border-gold/25 rounded-lg focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brown text-gold border border-gold hover:bg-gold hover:text-brown rounded-lg font-bold transition-all uppercase tracking-wider shadow mt-2"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <span className="text-center text-[10px] text-gray-400 mt-1">
          Already registered? <Link to="/login" className="underline text-gold font-bold">Access Login</Link>
        </span>
      </div>
    </div>
  );
};
