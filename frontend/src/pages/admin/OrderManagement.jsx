import React, { useState, useEffect, useRef, useCallback } from 'react';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { Eye, Edit, ShoppingCart, User, Package, DollarSign, Calendar, Filter, Search, RefreshCw, CheckCircle, XCircle, Clock, Truck, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

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

const SEARCH_MIN_CHARS = 2;
const SEARCH_DEBOUNCE_MS = 400;

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const firstFetchRef = useRef(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      const applied = trimmed.length === 0 || trimmed.length >= SEARCH_MIN_CHARS ? trimmed : '';
      setFilters((prev) => (prev.search === applied ? prev : { ...prev, search: applied }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    try {
      if (firstFetchRef.current) {
        setLoading(true);
      } else {
        setListRefreshing(true);
      }
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/orders?${params.toString()}`);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setListRefreshing(false);
      setInitialLoad(false);
      firstFetchRef.current = false;
    }
  }, [filters.status, filters.paymentStatus, filters.dateFrom, filters.dateTo, filters.search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated');
      setShowStatusModal(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      toast.error('Failed to update order status');
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
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  const getPaymentIcon = (status) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'failed':
        return XCircle;
      case 'refunded':
        return RefreshCw;
      default:
        return CreditCard;
    }
  };

  if (initialLoad && loading) return <Loading />;

  const totalRevenue = orders.reduce((sum, o) => sum + parseMoney(o.final_amount ?? o.total_amount), 0);
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
  const paidOrders = orders.filter(o => o.payment_status === 'paid').length;

  return (
    <div className="page-shell">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrencyLKR(totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending Orders</p>
                <p className="text-2xl font-black text-amber-600">{pendingOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Paid Orders</p>
                <p className="text-2xl font-black text-emerald-600">{paidOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                Updating
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10 pr-8"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchInput.trim().length === 1 && (
                <p className="mt-1.5 text-xs text-amber-700">Enter at least {SEARCH_MIN_CHARS} characters to search.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Order Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                className="input-field"
              >
                <option value="">All Payment</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setFilters({ status: '', paymentStatus: '', dateFrom: '', dateTo: '', search: '' });
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 && !loading ? (
          <div className="card empty-state-enter">
            <EmptyState
              icon={ShoppingCart}
              title="No orders found"
              message="No orders match the selected filters"
            />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-4 transition-opacity duration-200 ${
              loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}
          >
            {orders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.order_status);
              const PaymentIcon = getPaymentIcon(order.payment_status);

              return (
                <div
                  key={order.order_id}
                  className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-slate-600 grid-item-enter"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg flex-shrink-0">
                          <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-slate-900">{order.order_number}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.order_status)}`}>
                              {order.order_status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span className="font-semibold">{order.customer?.user?.first_name} {order.customer?.user?.last_name}</span>
                            </div>
                            <span className="mx-2">•</span>
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              <span>{order.items_count || 0} items</span>
                            </div>
                            <span className="mx-2">•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(order.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon className="w-4 h-4 text-slate-400" />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order Status</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 capitalize">{order.order_status}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <PaymentIcon className="w-4 h-4 text-slate-400" />
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</p>
                          </div>
                          <p className="text-sm font-bold text-slate-900 capitalize">{order.payment_status}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Amount</p>
                          </div>
                          <p className="text-lg font-black text-emerald-700">{formatCurrencyLKR(order.final_amount)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          // Show order details
                        }}
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowStatusModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedOrder && (
          <Modal
            isOpen={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setSelectedOrder(null);
            }}
            title="Update Order Status"
            size="lg"
          >
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm font-semibold text-slate-700 mb-1">Order: {selectedOrder.order_number}</p>
                <p className="text-xs text-slate-600">Customer: {selectedOrder.customer?.user?.first_name} {selectedOrder.customer?.user?.last_name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Order Status
                </label>
                <select
                  id="orderStatus"
                  className="input-field"
                  defaultValue={selectedOrder.order_status}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Payment Status
                </label>
                <select
                  id="paymentStatus"
                  className="input-field"
                  defaultValue={selectedOrder.payment_status}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-2">
                <Button
                  className="flex-1 !bg-slate-800 hover:!bg-slate-900"
                  onClick={() => {
                    const orderStatus = document.getElementById('orderStatus').value;
                    const paymentStatus = document.getElementById('paymentStatus').value;
                    handleUpdateStatus(selectedOrder.order_id, orderStatus);
                    // Also update payment status if needed
                  }}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
  );
};

export default OrderManagement;
