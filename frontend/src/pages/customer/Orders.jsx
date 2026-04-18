import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { FileText, ShoppingCart, Package, Calendar, Filter, ArrowRight, CheckCircle, Clock, XCircle, Truck } from 'lucide-react';

const parseMoney = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

// Format currency as LKR (safe for string DECIMALs from API)
const formatCurrencyLKR = (amount) => {
  const safe = parseMoney(amount);
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(safe);
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/orders${params}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
        return Truck;
      case 'processing':
      case 'confirmed':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  const filters = [
    { value: 'all', label: 'All Orders', icon: ShoppingCart, color: 'slate' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
    { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'blue' },
    { value: 'shipped', label: 'Shipped', icon: Truck, color: 'purple' },
    { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'emerald' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'rose' },
  ];

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => {
    const line = parseMoney(order.final_amount ?? order.total_amount);
    return sum + line;
  }, 0);

  return (
    <Layout>
      <div className="page-shell">

        {/* Statistics */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-3xl font-black text-slate-900">{totalOrders}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Spent</p>
                  <p className="text-3xl font-black text-slate-600">{formatCurrencyLKR(totalSpent)}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            const isCancelled = f.value === 'cancelled';
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${isActive
                  ? isCancelled
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/35 ring-2 ring-red-500/40'
                    : 'bg-slate-800 text-white shadow-lg shadow-slate-500/30'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && orders.length === 0 ? (
          <div className="card">
            <Loading />
          </div>
        ) : orders.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={FileText}
              title="No orders found"
              message="You haven't placed any orders yet"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.order_status);
              return (
                <Link key={order.order_id} to={`/customer/orders/${order.order_id}`}>
                  <div className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-slate-600">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg flex-shrink-0">
                        <ShoppingCart className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900">Order #{order.order_number}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(order.order_status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            {order.order_status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{formatDate(order.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span>{order.items_count || 0} item(s)</span>
                          </div>
                          <div className="text-right md:text-left">
                            <p className="text-xl font-black text-slate-600">{formatCurrencyLKR(order.final_amount)}</p>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
