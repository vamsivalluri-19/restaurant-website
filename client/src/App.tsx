import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIChatbot } from './components/AIChatbot';
import { Notifications } from './components/Notifications';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { TableQRPage } from './pages/TableQRPage';
import { CartPage } from './pages/CartPage';
import { OrderTracking } from './pages/OrderTracking';
import { KitchenDisplaySystem } from './pages/KitchenDisplaySystem';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { DeliveryDashboard } from './pages/DeliveryDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MyOrders } from './pages/MyOrders';

export const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="flex flex-col min-h-screen">
        {/* Navigation bar at top */}
        <Navbar />
        
        {/* Real-time alerts toaster container */}
        <Notifications />

        {/* Dynamic page routes container */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/table/:id" element={<TableQRPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/order-tracking/:id" element={<OrderTracking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-orders" element={<MyOrders />} />
            
            {/* Operator Protected Dashboards */}
            <Route 
              path="/kitchen" 
              element={
                <ProtectedRoute allowedRoles={['kitchen', 'admin', 'manager']}>
                  <KitchenDisplaySystem />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/manager" 
              element={
                <ProtectedRoute allowedRoles={['manager', 'admin']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/delivery" 
              element={
                <ProtectedRoute allowedRoles={['delivery', 'admin']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>

        {/* AI Virtual Chatbot floating assistant */}
        <AIChatbot />

        {/* Site Footer details */}
        <Footer />
      </div>
    </Router>
  );
};
