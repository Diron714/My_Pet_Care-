import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { ShoppingCart, Bell, User, LogOut, PawPrint, Package, Stethoscope } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cartItemCount = 0 } = useCart();
  const { unreadCount = 0 } = useNotifications();

  const [profileOpen, setProfileOpen] = useState(false);
  const roleLower = String(user?.role || '').toLowerCase();

  const handleLogout = () => {
    logout();
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    const r = roleLower;
    if (r === 'customer') return '/customer/dashboard';
    if (r === 'doctor') return '/doctor/dashboard';
    if (r === 'admin' || r === 'staff') return '/admin/dashboard';
    return '/';
  };

  const notificationsPath = (() => {
    const r = roleLower;
    if (r === 'customer') return '/customer/notifications';
    if (r === 'admin' || r === 'staff') return '/admin/notifications';
    if (r === 'doctor') return '/doctor/notifications';
    return '/customer/notifications';
  })();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                  <PawPrint className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-slate-800 transition-colors">
                My Pet <span className="text-slate-800">Care+</span>
              </span>
            </Link>
            {/* Public links removed per request */}
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {roleLower === 'customer' && (
                  <Link
                    to="/customer/cart"
                    className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
                  >
                    <ShoppingCart className="w-5 h-5 text-slate-700 group-hover:text-slate-800 transition-colors" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                )}
                <Link
                  to={notificationsPath}
                  className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
                >
                  <Bell className="w-5 h-5 text-slate-700 group-hover:text-slate-800 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-50 hover:to-slate-100 border border-slate-200 hover:border-slate-300 transition-all duration-200 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-800 transition-colors">
                      {user?.firstName || user?.first_name || 'User'}
                    </span>
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl py-2 border border-slate-100 z-50 ${profileOpen ? '' : 'hidden'
                      }`}
                  >
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-slate-800 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold">Dashboard</span>
                    </Link>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
