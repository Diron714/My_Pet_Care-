import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Package, Calendar, Gift, Bell, ShoppingCart, Heart, Users, MessageSquare, Star, Clock, ArrowRight, ChevronRight, PawPrint } from 'lucide-react';

const parseMoney = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(parseMoney(amount));
};

const heroSlides = [
  {
    title: 'with expert vets and delivery to your door',
    description:
      "Book appointments, order products, and get advice from trusted veterinarians. Everything your pet needs in one place.",
  },
  {
    title: 'manage every vet visit in one app',
    description:
      'Track upcoming appointments, prescriptions, and reminders so you never miss an important pet health task.',
  },
  {
    title: 'fast doorstep delivery for pet essentials',
    description:
      'Reorder food, treats, and supplies in seconds and get them delivered right to your home.',
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeOrders: 0,
    upcomingAppointments: 0,
    loyaltyPoints: 0,
    loyaltyTier: 'bronze',
    unreadNotifications: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const [instantTransition, setInstantTransition] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrackIndex((prev) => prev + 1);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Handle seamless loop when moving from the last real slide to the cloned first slide
  useEffect(() => {
    if (trackIndex !== heroSlides.length) return;

    const timeout = setTimeout(() => {
      setInstantTransition(true);
      setTrackIndex(0);

      // Re-enable smooth transition on the next frame
      requestAnimationFrame(() => {
        setInstantTransition(false);
      });
    }, 500); // should match the slide transition duration

    return () => clearTimeout(timeout);
  }, [trackIndex]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers/dashboard');
      const { stats: dashboardStats, recent_orders, upcoming_appointments } = response.data.data;

      setStats(dashboardStats || stats);
      setRecentOrders(recent_orders || []);
      setRecentAppointments(upcoming_appointments || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (String(tier).toLowerCase()) {
      case 'platinum':
        return { gradient: 'from-purple-500 to-purple-600', text: 'text-purple-700', bg: 'bg-purple-50' };
      case 'gold':
        return { gradient: 'from-amber-500 to-amber-600', text: 'text-amber-700', bg: 'bg-amber-50' };
      case 'silver':
        return { gradient: 'from-slate-400 to-slate-500', text: 'text-slate-700', bg: 'bg-slate-50' };
      case 'bronze':
        return { gradient: 'from-orange-500 to-orange-600', text: 'text-orange-700', bg: 'bg-orange-50' };
      default:
        return { gradient: 'from-slate-500 to-slate-600', text: 'text-slate-700', bg: 'bg-slate-50' };
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  const tierColors = getTierColor(stats.loyaltyTier);
  const activeDotIndex = trackIndex % heroSlides.length;

  const quickActions = [
    { path: '/customer/pets', label: 'Browse Pets', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
    { path: '/customer/products', label: 'Products', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { path: '/customer/doctors', label: 'Doctors', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { path: '/customer/orders', label: 'My Orders', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { path: '/customer/appointments/book', label: 'Book Vet', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { path: '/customer/pet-profiles', label: 'My Pets', icon: PawPrint, color: 'text-orange-600', bg: 'bg-orange-50' },
    { path: '/customer/chat', label: 'Chat', icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
    { path: '/customer/reminders', label: 'Reminders', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-white to-blue-50/40 pointer-events-none" aria-hidden />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="pt-8 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2">
                Hey, <span className="text-violet-600">{user?.firstName || user?.first_name || 'Pet Parent'}!</span>
              </h1>
              <p className="text-slate-500 font-medium italic">Your pets are waiting for some love today.</p>
            </div>
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className={`px-4 py-2 rounded-xl bg-gradient-to-br ${tierColors.gradient} text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-amber-200/20`}>
                {stats.loyaltyTier}
              </div>
              <div className="pr-4">
                <p className="text-[10px] uppercase tracking-tighter font-black text-slate-400 leading-none mb-1">Loyalty Points</p>
                <p className="text-lg font-black text-slate-800 leading-none">{stats.loyaltyPoints}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
            {/* Hero Section */}
            <div className="xl:col-span-2 relative h-[360px] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100 border border-slate-100 group">
              <div
                className={`flex h-full transition-transform duration-700 ease-out ${instantTransition ? 'transition-none' : ''}`}
                style={{ transform: `translateX(-${activeDotIndex * 100}%)` }}
              >
                {heroSlides.map((slide, idx) => (
                  <div key={idx} className="relative min-w-full h-full">
                    <img 
                      src={`https://images.unsplash.com/photo-${idx === 0 ? '1548191265-cc70d3d45ba1' : idx === 1 ? '1516734212186-a967f81ad0d7' : '1583337130417-3346a1be7dee'}?auto=format&fit=crop&q=80&w=1200`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      alt={slide.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-8 md:p-12">
                      <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-md">
                        {slide.title}
                      </h2>
                      <p className="text-slate-200 max-w-lg text-lg font-medium mb-6 drop-shadow-sm line-clamp-2 md:line-clamp-none">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTrackIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeDotIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 gap-4">
              {quickActions.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <Link
                    key={idx}
                    to={action.path}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className={`h-12 w-12 rounded-2xl ${action.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <ActionIcon className={`w-6 h-6 ${action.color}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 tracking-tight">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Stats Overview */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingCart, color: 'indigo' },
              { label: 'Appointments', value: stats.upcomingAppointments, icon: Calendar, color: 'violet' },
              { label: 'Loyalty Points', value: stats.loyaltyPoints, icon: Gift, color: 'amber' },
              { label: 'New Alerts', value: stats.unreadNotifications, icon: Bell, color: 'emerald' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/50 shadow-sm hover:shadow-lg hover:border-violet-200/50 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`h-12 w-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</span>
                </div>
                <p className="text-4xl font-black text-slate-800 tabular-nums">{item.value}</p>
              </div>
            ))}
          </section>

          {/* Recent Orders & Appointments */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                  Recent orders
                </h2>
                <Link to="/customer/orders" className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="p-8">
                {recentOrders.length === 0 ? (
                  <EmptyState icon={ShoppingCart} title="No recent orders" message="Looks like you haven't placed any orders yet." />
                ) : (
                  <div className="space-y-6">
                    {recentOrders.map((order) => (
                      <div key={order.order_id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                            <Package className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Order #{order.order_number}</p>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {formatDate(order.created_at)} · <span className="text-slate-600">{formatCurrencyLKR(order.final_amount || order.total_amount)}</span>
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${order.order_status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : order.order_status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                          {order.order_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
              <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-500" />
                  Upcoming appointments
                </h2>
                <Link to="/customer/appointments" className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="p-8">
                {recentAppointments.length === 0 ? (
                  <EmptyState icon={Calendar} title="No upcoming appointments" message="Time to book a check-up for your pet!" />
                ) : (
                  <div className="space-y-6">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.appointment_id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-violet-50 transition-colors">
                            <Users className="w-6 h-6 text-slate-400 group-hover:text-violet-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              {formatDate(appointment.appointment_date)} · {appointment.appointment_time}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${appointment.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {appointment.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
