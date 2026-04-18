import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { exchangeRequestSchema } from '../../utils/validators';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { Plus, Package, RefreshCw, ShoppingBag, AlertCircle, Calendar, X, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';

const ExchangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(exchangeRequestSchema),
  });

  const selectedOrderId = watch('orderId');

  useEffect(() => {
    loadRequests();
    loadOrders();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exchanges');
      setRequests(response.data.data || []);
    } catch (error) {
      console.error('Error loading exchange requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');
      const ordersWithPets = (response.data.data || []).filter(
        (order) => order.items?.some((item) => item.item_type === 'pet')
      );
      setOrders(ordersWithPets);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        order_id: parseInt(data.orderId),
        pet_id: parseInt(data.petId),
        reason: data.reason,
      };
      const response = await api.post('/exchanges', payload);
      if (response.data.success) {
        toast.success('Exchange request submitted');
        setShowForm(false);
        reset();
        loadRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleCancel = async (exchangeId) => {
    try {
      setCancelLoading(true);
      await api.delete(`/exchanges/${exchangeId}`);
      toast.success('Exchange request cancelled');
      loadRequests();
    } catch (error) {
      toast.error('Failed to cancel request');
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const selectedOrder = orders.find((o) => o.order_id === parseInt(selectedOrderId));
  const petsInOrder = selectedOrder?.items?.filter((item) => item.item_type === 'pet') || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'rejected':
        return X;
      default:
        return RefreshCw;
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Exchange Requests</h2>
          </div>
          <Button onClick={() => setShowForm(true)} className="!bg-slate-800 hover:!bg-slate-900 !rounded-xl">
            <Plus className="w-4 h-4 inline mr-2" />
            New Request
          </Button>
        </div>

        {requests.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Package}
              title="No exchange requests"
              message="Submit a request to exchange a pet from your orders"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((request) => {
              const StatusIcon = getStatusIcon(request.status);
              return (
                <div key={request.exchange_id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-amber-500">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">
                          Request #{request.exchange_id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(request.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {request.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">Order:</span> #{request.order?.order_number}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold">Pet:</span> {request.pet?.name}
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Reason</p>
                              <p className="text-sm text-amber-800">{request.reason}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          Requested: {formatDate(request.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="pt-4 border-t border-slate-100">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelTarget(request)}
                        className="w-full"
                      >
                        <X className="w-4 h-4 inline mr-1" />
                        Cancel Request
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Exchange Request Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            reset();
          }}
          title="New Exchange Request"
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <ShoppingBag className="w-4 h-4 inline mr-1" />
                Order <span className="text-red-500">*</span>
              </label>
              <select {...register('orderId')} className="input-field">
                <option value="">Select an order</option>
                {orders.map((order) => (
                  <option key={order.order_id} value={order.order_id}>
                    Order #{order.order_number} - {formatDate(order.created_at)}
                  </option>
                ))}
              </select>
              {errors.orderId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.orderId.message}
                </p>
              )}
            </div>

            {selectedOrder && petsInOrder.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Pet <span className="text-red-500">*</span>
                </label>
                <select {...register('petId')} className="input-field">
                  <option value="">Select a pet</option>
                  {petsInOrder.map((item) => (
                    <option key={item.item_id} value={item.item_id}>
                      {item.item_name}
                    </option>
                  ))}
                </select>
                {errors.petId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.petId.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('reason')}
                rows={4}
                className="input-field"
                placeholder="Please provide a reason for the exchange..."
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reason.message}
                </p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Submit Request
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Cancel confirmation dialog */}
        <ConfirmDialog
          isOpen={!!cancelTarget}
          title="Cancel exchange request"
          message={
            cancelTarget
              ? `Are you sure you want to cancel exchange request #${cancelTarget.exchange_id}?`
              : ''
          }
          confirmLabel="Yes, cancel"
          confirmVariant="danger"
          loading={cancelLoading}
          onCancel={() => {
            if (cancelLoading) return;
            setCancelTarget(null);
          }}
          onConfirm={() => cancelTarget && handleCancel(cancelTarget.exchange_id)}
        />
      </div>
    </Layout>
  );
};

export default ExchangeRequests;
