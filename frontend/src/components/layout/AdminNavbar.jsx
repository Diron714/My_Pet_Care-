import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
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
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount = 0 } = useNotifications();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const role = String(user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'staff';
  const isDoctor = role === 'doctor';

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
    { path: '/customer/orders', label: 'Orders', icon: FileText },
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

  const isCustomer = role === 'customer';
  const menuItems = isAdmin ? adminMenuItems : isDoctor ? doctorMenuItems : isCustomer ? customerMenuItems : [];

  const getTheme = () => {
    if (isDoctor) {
      return {
        logoGradient: 'from-emerald-500 to-teal-600',
        logoShadow: 'group-hover:shadow-emerald-500/30',
        textAccent: 'text-emerald-400',
        bgAccent: 'bg-emerald-500/10',
        borderAccent: 'border-emerald-500/20'
      };
    }
    if (isCustomer) {
      return {
        logoGradient: 'from-indigo-500 to-blue-600',
        logoShadow: 'group-hover:shadow-indigo-500/30',
        textAccent: 'text-indigo-400',
        bgAccent: 'bg-indigo-500/10',
        borderAccent: 'border-indigo-500/20'
      };
    }
    return { // Admin/Default
      logoGradient: 'from-violet-500 to-indigo-600',
      logoShadow: 'group-hover:shadow-violet-500/30',
      textAccent: 'text-violet-400',
      bgAccent: 'bg-violet-500/10',
      borderAccent: 'border-violet-500/20'
    };
  };

  const theme = getTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-slate-900/95 backdrop-blur-md border-b border-white/5 shadow-2xl transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Brand & System Controls */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link 
              to={isAdmin ? "/admin/dashboard" : isCustomer ? "/customer/dashboard" : "/doctor/dashboard"} 
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className={`absolute -inset-2 ${theme.bgAccent.replace('/10', '/40')} rounded-xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700`}></div>
                <div className={`relative h-11 w-11 rounded-xl bg-gradient-to-br ${theme.logoGradient} flex items-center justify-center shadow-lg ${theme.logoShadow} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white leading-none group-hover:tracking-wider transition-all duration-500">
                  My Pet <span className={`${theme.textAccent} drop-shadow-[0_0_8px_rgba(var(--theme-accent),0.5)]`}>Care+</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1.5 transition-colors group-hover:text-slate-400">
                  {isAdmin || isDoctor ? 'Management Portal' : 'Customer Portal'}
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isCustomer && (
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 mr-2 group/points cursor-default transition-all duration-500 hover:border-amber-500/40 hover:from-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse transition-transform group-hover/points:scale-125" />
                <span className="text-[10px] sm:text-[11px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">
                  Gold Member: <span className="text-white ml-1">{user?.loyalty_points || 0}</span>
                </span>
              </div>
            )}

            <Link
              to={isAdmin ? "/admin/notifications" : isCustomer ? "/customer/notifications" : "/doctor/notifications"}
              className="relative p-2.5 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all duration-300 transform active:scale-90 group"
              title="Notifications"
            >
              <Bell className="w-5.5 h-5.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-gradient-to-br from-rose-500 to-red-600 text-white text-[10px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.4)] ring-2 ring-slate-900 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-white/[0.08] text-rose-400/80 hover:text-rose-400 transition-all duration-300 transform active:scale-90 group"
              title="Logout"
            >
              <LogOut className="w-5.5 h-5.5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
            </button>

            <div className="h-8 w-px bg-slate-800" />

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 pl-2 pr-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all duration-300 group transform active:scale-95"
              >
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-inner group-hover:shadow-lg transition-all duration-300">
                  <User className="w-4.5 h-4.5 text-slate-300 group-hover:text-white transition-colors" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">Identity</span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                    {user?.firstName || user?.first_name || 'Admin'}
                  </span>
                </div>
              </button>
              
              {profileOpen && (
                <div className="absolute right-0 mt-4 w-56 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 mb-1 border-b border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Hub</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-500/10">
                      <LogOut className="w-4 h-4" />
                    </div>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Management Links */}
        <div className="flex items-center h-12 overflow-x-auto no-scrollbar gap-1 border-t border-slate-800/60 -mx-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-300 group relative ${
                  active
                    ? `${theme.bgAccent} ${theme.textAccent} border ${theme.borderAccent} shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] scale-[1.02]`
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${active ? 'bg-white/10 shadow-sm' : 'bg-transparent'}`}>
                  <Icon
                    className={`w-4 h-4 transition-all duration-300 ${
                      active ? theme.textAccent : 'text-slate-500 group-hover:scale-110 group-hover:text-slate-300'
                    }`}
                  />
                </div>
                {item.label}
                {active && (
                  <span className={`absolute -bottom-[1px] left-5 right-5 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-60`} />
                )}
              </Link>
            );
          })}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default AdminNavbar;
