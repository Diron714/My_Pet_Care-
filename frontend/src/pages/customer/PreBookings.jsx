import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { Plus, Clock, Package, PawPrint, CheckCircle, XCircle, Calendar, AlertCircle, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const PreBookings = () => {
  const [preBookings, setPreBookings] = useState([]);
  const [pets, setPets] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [itemType, setItemType] = useState('pet');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    loadPreBookings();
    loadPets();
    loadProducts();
  }, []);

  const loadPreBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pre-bookings');
      setPreBookings(response.data.data || []);
    } catch (error) {
      console.error('Error loading pre-bookings:', error);
      setPreBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPets = async () => {
    try {
      const response = await api.get('/pets?available=false');
      setPets(response.data.data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products?available=false');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      item_type: formData.get('itemType'),
      item_id: parseInt(formData.get('itemId')),
      quantity: parseInt(formData.get('quantity')) || 1,
    };

    try {
      const response = await api.post('/pre-bookings', data);
      if (response.data.success) {
        toast.success('Pre-booking request submitted');
        setShowForm(false);
        loadPreBookings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleCancel = async (preBookingId) => {
    try {
      setCancelLoading(true);
      await api.delete(`/pre-bookings/${preBookingId}`);
      toast.success('Pre-booking cancelled');
      loadPreBookings();
    } catch (error) {
      toast.error('Failed to cancel pre-booking');
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'fulfilled':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getItemIcon = (type) => {
    return type === 'pet' ? PawPrint : Package;
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Pre-Bookings</h2>
          </div>
          <Button onClick={() => setShowForm(true)} className="!bg-slate-800 hover:!bg-slate-900 !rounded-xl">
            <Plus className="w-4 h-4 inline mr-2" />
            New Request
          </Button>
        </div>

        {preBookings.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Clock}
              title="No pre-booking requests"
              message="Request to be notified when unavailable items become available"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {preBookings.map((preBooking) => {
              const StatusIcon = getStatusIcon(preBooking.status);
              const ItemIcon = getItemIcon(preBooking.item_type);
              return (
                <div key={preBooking.pre_booking_id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-violet-500">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${preBooking.item_type === 'pet' ? 'from-rose-500 to-rose-600' : 'from-blue-500 to-blue-600'
                      } flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <ItemIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">
                          Pre-Booking #{preBooking.pre_booking_id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(preBooking.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {preBooking.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">Item:</span> {preBooking.item_name}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">Type:</span> <span className="capitalize">{preBooking.item_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">Quantity:</span> {preBooking.quantity}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          Requested: {formatDate(preBooking.created_at)}
                        </div>
                        {preBooking.fulfilled_at && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            Fulfilled: {formatDate(preBooking.fulfilled_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {preBooking.status === 'pending' && (
                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelTarget(preBooking)}
                        className="w-full"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Cancel Request
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pre-Booking Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="New Pre-Booking Request"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Package className="w-4 h-4 inline mr-1" />
                Item Type <span className="text-red-500">*</span>
              </label>
              <select
                name="itemType"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="input-field"
              >
                <option value="pet">Pet</option>
                <option value="product">Product</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {itemType === 'pet' ? (
                  <>
                    <PawPrint className="w-4 h-4 inline mr-1" />
                    Pet
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 inline mr-1" />
                    Product
                  </>
                )}{' '}
                <span className="text-red-500">*</span>
              </label>
              <select name="itemId" className="input-field" required>
                <option value="">Select {itemType}</option>
                {(itemType === 'pet' ? pets : products).map((item) => (
                  <option key={item[`${itemType}_id`]} value={item[`${itemType}_id`]}>
                    {item.name} - {formatCurrencyLKR(item.price)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Quantity"
              type="number"
              name="quantity"
              defaultValue={1}
              min={1}
              required
            />

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Submit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Cancel confirmation dialog */}
        <ConfirmDialog
          isOpen={!!cancelTarget}
          title="Cancel pre-booking"
          message={
            cancelTarget
              ? `Are you sure you want to cancel pre-booking #${cancelTarget.pre_booking_id}?`
              : ''
          }
          confirmLabel="Yes, cancel"
          confirmVariant="danger"
          loading={cancelLoading}
          onCancel={() => {
            if (cancelLoading) return;
            setCancelTarget(null);
          }}
          onConfirm={() => cancelTarget && handleCancel(cancelTarget.pre_booking_id)}
        />
      </div>
    </Layout>
  );
};

export default PreBookings;
