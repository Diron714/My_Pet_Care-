import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, LogOut, User, Search, ChevronDown } from 'lucide-react';

const DashboardHeader = ({ title }) => {
  const { user, logout } = useAuth();
  const { unreadCount = 0 } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);

  const role = String(user?.role || '').toLowerCase();
  const roleLabel = role === 'admin' ? 'ADMIN PORTAL' : role === 'doctor' ? 'DOCTOR PORTAL' : 'CUSTOMER PORTAL';

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">{title || 'Dashboard'}</h1>
        <div className="h-6 w-px bg-slate-200 hidden md:block" />
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full tracking-widest uppercase hidden lg:block">
          {roleLabel}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar - Aesthetic Only as per reference */}
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search system..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 w-64 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2.5 rounded-2xl bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all group">
            <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>
        </div>

        {/* Profile */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-600/20">
              {user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                {user?.firstName || user?.first_name || 'User'}
              </p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none">
                {role}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-3xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated As</p>
                <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-5 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
