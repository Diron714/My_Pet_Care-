import React, { useState, useEffect } from 'react';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { Clock, Check, Bell, Calendar, User, Package, ShoppingBag, PawPrint, RefreshCw, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const PreBookingManagement = () => {
  const [preBookings, setPreBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPreBookings();
  }, [filter]);

  const loadPreBookings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/pre-bookings${params}`);
      setPreBookings(response.data.data || []);
    } catch (error) {
      console.error('Error loading pre-bookings:', error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleFulfill = async (preBookingId) => {
    try {
      await api.put(`/pre-bookings/${preBookingId}/fulfill`);
      toast.success('Pre-booking fulfilled and customer notified');
      loadPreBookings();
    } catch (error) {
      toast.error('Failed to fulfill pre-booking');
    }
  };

  const handleNotify = async (preBookingId) => {
    try {
      await api.post(`/pre-bookings/${preBookingId}/notify`);
      toast.success('Customer notified');
    } catch (error) {
      toast.error('Failed to notify customer');
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'pet':
        return PawPrint;
      case 'product':
        return Package;
      case 'service':
        return ShoppingBag;
      default:
        return Package;
    }
  };

  const getItemStyles = (type) => {
    switch (type) {
      case 'pet':
        return {
          gradient: 'from-amber-500 to-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
        };
      case 'product':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
        };
      case 'service':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
        };
    }
  };

  const filters = [
    { value: 'all', label: 'All', icon: Package, color: 'slate' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
    { value: 'fulfilled', label: 'Fulfilled', icon: CheckCircle, color: 'emerald' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'rose' },
  ];

  if (initialLoad && loading) return <Loading />;

  const pendingCount = preBookings.filter(pb => pb.status === 'pending').length;
  const fulfilledCount = preBookings.filter(pb => pb.status === 'fulfilled').length;

  return (
    <div className="page-shell">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Requests</p>
                <p className="text-2xl font-black text-slate-900">{preBookings.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending</p>
                <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fulfilled</p>
                <p className="text-2xl font-black text-emerald-600">{fulfilledCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            const getActiveClasses = (color) => {
              switch (color) {
                case 'slate':
                  return 'bg-slate-600 text-white shadow-lg shadow-slate-500/30';
                case 'amber':
                  return 'bg-amber-600 text-white shadow-lg shadow-amber-500/30';
                case 'emerald':
                  return 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30';
                case 'rose':
                  return 'bg-red-600 text-white shadow-lg shadow-red-500/35 ring-2 ring-red-500/40';
                default:
                  return 'bg-slate-800 text-white shadow-lg shadow-slate-500/30';
              }
            };
            const getIconColor = (color) => {
              switch (color) {
                case 'slate':
                  return 'text-slate-600';
                case 'amber':
                  return 'text-amber-600';
                case 'emerald':
                  return 'text-emerald-600';
                case 'rose':
                  return 'text-red-600';
                default:
                  return 'text-slate-600';
              }
            };
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                    ? getActiveClasses(f.color)
                    : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : getIconColor(f.color)}`} />
                {f.label}
              </button>
            );
          })}
          {loading && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium ml-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              Updating
            </div>
          )}
        </div>

        {preBookings.length === 0 && !loading ? (
          <div className="card empty-state-enter">
            <EmptyState
              icon={Clock}
              title="No pre-booking requests"
              message="No pre-booking requests found for the selected filter"
            />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-4 transition-opacity duration-200 ${
              loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}
          >
            {preBookings.map((preBooking, index) => {
              const ItemIcon = getItemIcon(preBooking.item_type);
              const itemStyles = getItemStyles(preBooking.item_type);

              return (
                <div
                  key={preBooking.pre_booking_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${itemStyles.border} grid-item-enter`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${itemStyles.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <ItemIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-slate-900">
                              Request #{preBooking.pre_booking_id}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(preBooking.status)}`}>
                              {preBooking.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                              <User className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customer</p>
                                <p className="font-semibold text-slate-900">
                                  {preBooking.customer?.user?.first_name} {preBooking.customer?.user?.last_name}
                                </p>
                              </div>
                            </div>
                            <div className={`flex items-start gap-2 p-3 ${itemStyles.bg} rounded-xl`}>
                              <ItemIcon className={`w-4 h-4 ${itemStyles.text} mt-0.5`} />
                              <div>
                                <p className={`text-xs font-semibold ${itemStyles.text} uppercase tracking-wider mb-1`}>Item Type</p>
                                <p className={`font-semibold ${itemStyles.text} capitalize`}>{preBooking.item_type}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className={`p-4 ${itemStyles.bg} rounded-xl border ${itemStyles.border} mb-3`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className={`w-5 h-5 ${itemStyles.text}`} />
                            <p className={`text-sm font-bold ${itemStyles.text}`}>{preBooking.item_name}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full ${itemStyles.bg} border ${itemStyles.border}`}>
                            <p className={`text-xs font-semibold ${itemStyles.text}`}>
                              Qty: {preBooking.quantity}
                            </p>
                          </div>
                        </div>
                        {preBooking.notes && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                              <p className="text-sm text-slate-600 italic">{preBooking.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">Requested:</span>
                        <span>{formatDateTime(preBooking.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {preBooking.status === 'pending' && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleFulfill(preBooking.pre_booking_id)}
                          className="!bg-emerald-600 hover:!bg-emerald-700"
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Fulfill
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotify(preBooking.pre_booking_id)}
                        >
                          <Bell className="w-4 h-4 inline mr-1" />
                          Notify
                        </Button>
                      </div>
                    )}
                    {preBooking.status === 'fulfilled' && (
                      <div className="ml-4">
                        <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Fulfilled</span>
                        </div>
                      </div>
                    )}
                    {preBooking.status === 'cancelled' && (
                      <div className="ml-4">
                        <div className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Cancelled</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
};

export default PreBookingManagement;
