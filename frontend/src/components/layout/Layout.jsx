import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import DashboardHeader from './DashboardHeader';

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'staff';
  const isDoctor = role === 'doctor';
  const isCustomer = role === 'customer';
  const isManagement = isAdmin || isDoctor || isCustomer;

  // Determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'System Dashboard';
    if (path.includes('pets')) return 'Pet Management';
    if (path.includes('products')) return 'Product Inventory';
    if (path.includes('orders')) return 'Order History';
    if (path.includes('appointments')) return 'Clinical Appointments';
    if (path.includes('health-records')) return 'Electronic Health Records';
    if (path.includes('chat')) return 'Live Messenger';
    if (path.includes('feedback')) return 'User Feedbacks';
    if (path.includes('notifications')) return 'System Notifications';
    return 'Dashboard';
  };

  if (isAuthenticated && isManagement) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar aria-label="Main Navigation" />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <DashboardHeader title={getPageTitle()} />
          <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
            <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isManagement && <Navbar />}
      <div className="flex flex-1 relative">
        {isAuthenticated && !isManagement && <Sidebar />}
        <main
          className={`flex-1 relative ${
            isAuthenticated && !isManagement 
              ? 'p-6 md:p-8 bg-slate-50' 
              : 'py-10 px-4 sm:px-6 lg:px-8 bg-slate-50'
          }`}
        >
          <div className="max-w-7xl mx-auto relative">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;

