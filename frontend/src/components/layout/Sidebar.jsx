import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  MessageCircle,
  FileText,
  Heart,
  Gift,
  Bell,
  Clock,
  PawPrint,
  LogOut,
  User,
  Calendar,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'staff';
  const isDoctor = role === 'doctor';
  const isCustomer = role === 'customer';

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const adminMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/pets', label: 'Pets', icon: Heart },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/exchanges', label: 'Exchanges', icon: Package },
    { path: '/admin/pre-bookings', label: 'Pre-Bookings', icon: Clock },
    { path: '/admin/offers', label: 'Offers', icon: Gift },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
    { path: '/admin/chat', label: 'Chat', icon: MessageCircle },
  ];

  const customerMenuItems = [
    { path: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customer/pets', label: 'Browse Pets', icon: Heart },
    { path: '/customer/products', label: 'Products', icon: Package },
    { path: '/customer/doctors', label: 'Doctors', icon: Users },
    { path: '/customer/appointments', label: 'Appointments', icon: Calendar },
    { path: '/customer/pet-profiles', label: 'My Pets', icon: Heart },
    { path: '/customer/health-records', label: 'Health Records', icon: FileText },
    { path: '/customer/orders', label: 'Orders', icon: FileText }, // Matches previous
    { path: '/customer/cart', label: 'Cart', icon: ShoppingCart },
    { path: '/customer/exchanges', label: 'Exchanges', icon: Package },
    { path: '/customer/pre-bookings', label: 'Pre-Bookings', icon: Clock },
    { path: '/customer/chat', label: 'Chat', icon: MessageCircle },
    { path: '/customer/feedback', label: 'Feedback', icon: MessageSquare },
    { path: '/customer/notifications', label: 'Notifications', icon: Bell },
    { path: '/customer/offers', label: 'Offers', icon: Gift },
    { path: '/customer/reminders', label: 'Reminders', icon: Clock },
  ];

  const doctorMenuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/profile', label: 'Profile', icon: User },
    { path: '/doctor/schedule', label: 'Schedule', icon: Calendar },
    { path: '/doctor/appointments', label: 'Appointments', icon: Clock },
    { path: '/doctor/health-records', label: 'Health Records', icon: FileText },
    { path: '/doctor/notifications', label: 'Notifications', icon: Bell },
  ];

  const menuItems = isAdmin ? adminMenuItems : isDoctor ? doctorMenuItems : isCustomer ? customerMenuItems : [];

  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 left-0 z-40">
      {/* Brand Logo */}
      <div className="p-8 pb-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30 ring-1 ring-white/20">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">
            Pet <span className="text-blue-600">Care+</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 no-scrollbar scroll-smooth">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all group ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 active:scale-95'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-50 mt-auto bg-slate-50/50">
        <div className="space-y-1">
          <Link
            to="/change-password"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition-all hover:shadow-sm"
          >
            <ShieldCheck className="w-5 h-5 text-slate-400" />
            Security Settings
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-[13px] font-bold text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
