import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatDate, formatPaymentMethod } from '../../utils/formatters';
import { getStatusColor, getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  Download,
  ArrowLeft,
  ShoppingCart,
  MapPin,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  Percent,
  Sparkles,
  Calendar,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Utensils,
  Gamepad2,
  Scissors,
  Heart,
} from 'lucide-react';

// Format currency as LKR (handles null, Decimal strings, invalid values)
const formatCurrencyLKR = (amount) => {
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(safe);
};

const getSpeciesIcon = (species) => {
  switch (species) {
    case 'Dog':
      return Dog;
    case 'Cat':
      return Cat;
    case 'Bird':
      return Bird;
    case 'Rabbit':
      return Rabbit;
    default:
      return PawPrint;
  }
};

const getSpeciesColor = (species) => {
  switch (species) {
    case 'Dog':
      return { gradient: 'from-amber-500 to-amber-600', border: 'border-amber-200' };
    case 'Cat':
      return { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-200' };
    case 'Bird':
      return { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-200' };
    case 'Rabbit':
      return { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-200' };
    default:
      return { gradient: 'from-slate-500 to-slate-600', border: 'border-slate-200' };
  }
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'Food':
      return Utensils;
    case 'Toys':
      return Gamepad2;
    case 'Accessories':
      return Sparkles;
    case 'Grooming':
      return Scissors;
    case 'Health':
      return Heart;
    default:
      return Package;
  }
};

const getCategoryStyles = (category) => {
  switch (category) {
    case 'Food':
      return { gradient: 'from-amber-500 to-amber-600', border: 'border-amber-200' };
    case 'Toys':
      return { gradient: 'from-blue-500 to-blue-600', border: 'border-blue-200' };
    case 'Accessories':
      return { gradient: 'from-purple-500 to-purple-600', border: 'border-purple-200' };
    case 'Grooming':
      return { gradient: 'from-pink-500 to-pink-600', border: 'border-pink-200' };
    case 'Health':
      return { gradient: 'from-emerald-500 to-emerald-600', border: 'border-emerald-200' };
    default:
      return { gradient: 'from-slate-500 to-slate-600', border: 'border-slate-200' };
  }
};

const lineItemType = (item) => String(item.item_type ?? '').toLowerCase().trim();

const getLineItemVisuals = (item) => {
  const t = lineItemType(item);
  if (t === 'pet') {
    return {
      PlaceholderIcon: getSpeciesIcon(item.species),
      ...getSpeciesColor(item.species),
    };
  }
  if (t === 'product') {
    return {
      PlaceholderIcon: getCategoryIcon(item.category),
      ...getCategoryStyles(item.category),
    };
  }
  return {
    PlaceholderIcon: Package,
    gradient: 'from-slate-500 to-slate-600',
    border: 'border-slate-200',
  };
};

const getLineItemTitle = (item) => {
  const name = item.item_name?.toString().trim();
  if (name) return name;
  const fromPet = [item.species, item.breed].filter(Boolean).join(' · ');
  if (fromPet) return fromPet;
  if (item.category) return item.category;
  const t = lineItemType(item);
  const type = t === 'pet' ? 'Pet' : t === 'product' ? 'Product' : 'Item';
  return item.item_id != null ? `${type} #${item.item_id}` : type;
};

const getLineItemSubtitle = (item) => {
  const t = lineItemType(item);
  if (t === 'pet') {
    const parts = [item.species, item.breed].filter(Boolean);
    return parts.length > 1 || (parts.length === 1 && item.item_name?.toString().trim()) ? parts.join(' · ') : null;
  }
  if (t === 'product' && item.category) {
    return item.item_name?.toString().trim() ? item.category : null;
  }
  return null;
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelLoading(true);
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled successfully');
      loadOrderDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
      setCancelConfirmOpen(false);
    }
  };

  const handleVerifyPayment = async () => {
    try {
      setLoading(true);
      const response = await api.post('/payments/payhere/verify', { order_id: id });
      if (response.data.data.payment_status === 'paid') {
        toast.success('Payment verified successfully!');
        loadOrderDetails();
      } else {
        toast.error('Payment still pending on PayHere. Please wait a few minutes.');
      }
    } catch (error) {
      toast.error('Failed to verify payment with PayHere');
    } finally {
      setLoading(false);
    }
  };

  const handleMockSuccess = async () => {
    try {
      setLoading(true);
      await api.post('/payments/mock-success', { order_id: id });
      toast.success('Payment simulated successfully! (Dev Mode)');
      loadOrderDetails();
    } catch (error) {
      toast.error('Failed to simulate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.order_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
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
        return Package;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!order) return <Layout><div className="text-center py-12">Order not found</div></Layout>;

  const StatusIcon = getStatusIcon(order.order_status);

  return (
    <Layout>
      <div className="page-shell">
        <Link to="/customer/orders" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="card mb-6 border-l-4 border-l-slate-600">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Order #{order.order_number}</h1>
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(order.created_at)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold uppercase tracking-wider flex items-center gap-2 ${getStatusColor(order.order_status)}`}>
                <StatusIcon className="w-4 h-4" />
                {order.order_status}
              </span>
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold uppercase tracking-wider ${getStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-blue-900">Shipping Address</h3>
              </div>
              <p className="text-blue-700">{order.shipping_address}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-purple-900">Payment Method</h3>
              </div>
              <p className="text-purple-700">{formatPaymentMethod(order.payment_method)}</p>
            </div>
          </div>

          {order.transaction_reference && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700">Transaction Reference: <span className="font-mono">{order.transaction_reference}</span></p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Order Items</h2>
          </div>
          <div className="space-y-4">
            {order.items?.map((item) => {
              const title = getLineItemTitle(item);
              const subtitle = getLineItemSubtitle(item);
              const { PlaceholderIcon, gradient, border } = getLineItemVisuals(item);
              return (
                <div
                  key={item.order_item_id}
                  className={`flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 border-l-4 ${border}`}
                >
                  <div
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${border}`}
                  >
                    {item.image_url ? (
                      <img
                        src={getImageSrc(item.image_url)}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                      >
                        <PlaceholderIcon className="w-8 h-8 text-white opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-600 mb-1">{subtitle}</p>}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span>
                        Quantity: <span className="font-semibold">{item.quantity}</span>
                      </span>
                      <span>
                        Unit Price: <span className="font-semibold">{formatCurrencyLKR(item.unit_price)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-slate-600">{formatCurrencyLKR(item.subtotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCart className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrencyLKR(order.total_amount)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span className="flex items-center gap-1">
                  <Percent className="w-4 h-4" />
                  Discount
                </span>
                <span className="font-semibold">-{formatCurrencyLKR(order.discount_amount)}</span>
              </div>
            )}
            {order.loyalty_points_used > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Loyalty Points
                </span>
                <span className="font-semibold">-{formatCurrencyLKR(order.loyalty_points_used * 0.01)}</span>
              </div>
            )}
            <div className="pt-4 border-t-2 border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-600">
                  {formatCurrencyLKR(
                    order.final_amount != null && order.final_amount !== ''
                      ? order.final_amount
                      : order.total_amount
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleDownloadInvoice} variant="outline" className="!bg-white hover:!bg-slate-50">
            <Download className="w-4 h-4 inline mr-2" />
            Download Invoice
          </Button>
          {order.order_status === 'pending' && (
            <Button onClick={() => setCancelConfirmOpen(true)} variant="danger">
              <XCircle className="w-4 h-4 inline mr-2" />
              Cancel Order
            </Button>
          )}
          {order.payment_status === 'pending' && order.payment_method === 'card' && (
            <>
              <Button onClick={handleVerifyPayment} variant="primary" className="!bg-blue-600 hover:!bg-blue-700">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Verify Payment Status
              </Button>
              <Button onClick={handleMockSuccess} variant="outline" className="!text-emerald-600 !border-emerald-600 hover:!bg-emerald-50">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Simulate Success (Dev)
              </Button>
            </>
          )}
        </div>
        {/* Cancel confirmation dialog */}
        <ConfirmDialog
          isOpen={cancelConfirmOpen}
          title="Cancel order"
          message={`Are you sure you want to cancel order #${order.order_number}?`}
          confirmLabel="Yes, cancel"
          confirmVariant="danger"
          loading={cancelLoading}
          onCancel={() => {
            if (cancelLoading) return;
            setCancelConfirmOpen(false);
          }}
          onConfirm={handleCancel}
        />
      </div>
    </Layout>
  );
};

export default OrderDetails;
