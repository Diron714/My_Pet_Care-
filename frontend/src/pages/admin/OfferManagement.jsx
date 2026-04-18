import React, { useState, useEffect } from 'react';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { Plus, Edit, Trash2, Gift, Percent, DollarSign, Sparkles, Calendar, Clock, CheckCircle, XCircle, TrendingUp, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const OfferManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/offers');
      setOffers(response.data.data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      discount_type: formData.get('discount_type'),
      discount_value: parseFloat(formData.get('discount_value')),
      min_purchase: parseFloat(formData.get('min_purchase')) || 0,
      max_discount: formData.get('max_discount') ? parseFloat(formData.get('max_discount')) : null,
      valid_from: formData.get('valid_from'),
      valid_until: formData.get('valid_until'),
      is_active: formData.get('is_active') === 'on',
    };

    try {
      const url = editingOffer ? `/offers/${editingOffer.offer_id}` : '/offers';
      const method = editingOffer ? 'put' : 'post';
      await api[method](url, data);
      toast.success(editingOffer ? 'Offer updated' : 'Offer created');
      setShowForm(false);
      setEditingOffer(null);
      loadOffers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save offer');
    }
  };

  const handleDelete = async (offerId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/offers/${offerId}`);
      toast.success('Offer deleted');
      loadOffers();
    } catch (error) {
      toast.error('Failed to delete offer');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const getDiscountIcon = (type) => {
    switch (type) {
      case 'percentage':
        return Percent;
      case 'fixed_amount':
        return DollarSign;
      case 'loyalty_points':
        return Sparkles;
      default:
        return Gift;
    }
  };

  const getDiscountStyles = (type) => {
    switch (type) {
      case 'percentage':
        return {
          gradient: 'from-amber-500 to-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
        };
      case 'fixed_amount':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
        };
      case 'loyalty_points':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
        };
      default:
        return {
          gradient: 'from-slate-700 to-slate-800',
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
        };
    }
  };

  const formatDiscount = (offer) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}%`;
    } else if (offer.discount_type === 'fixed_amount') {
      return formatCurrencyLKR(offer.discount_value);
    } else if (offer.discount_type === 'loyalty_points') {
      return `${offer.discount_value}x Points`;
    }
    return offer.discount_value;
  };

  const isOfferExpired = (offer) => {
    return new Date(offer.valid_until) < new Date();
  };

  const isOfferActive = (offer) => {
    return offer.is_active && !isOfferExpired(offer);
  };

  if (loading) return <Loading />;

  const activeOffers = offers.filter(o => isOfferActive(o)).length;
  const expiredOffers = offers.filter(o => isOfferExpired(o)).length;

  return (
    <div className="page-shell">

        <div className="flex justify-between items-center mb-6">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Offers Overview</p>
          <Button onClick={() => {
            setEditingOffer(null);
            setShowForm(true);
          }} size="sm" className="!bg-slate-800 hover:!bg-slate-900 shadow-lg">
            <Plus className="w-4 h-4 inline mr-2" />
            Create Offer
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Offers</p>
                <p className="text-2xl font-black text-slate-900">{offers.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                <Gift className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Offers</p>
                <p className="text-2xl font-black text-emerald-600">{activeOffers}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="card card-muted group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expired Offers</p>
                <p className="text-2xl font-black text-rose-600">{expiredOffers}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {offers.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Gift}
              title="No offers"
              message="Create promotional offers for customers"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {offers.map((offer) => {
              const DiscountIcon = getDiscountIcon(offer.discount_type);
              const styles = getDiscountStyles(offer.discount_type);
              const active = isOfferActive(offer);
              const expired = isOfferExpired(offer);

              return (
                <div
                  key={offer.offer_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${active ? styles.border : 'border-l-slate-300'
                    } ${active ? styles.bg : 'bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${styles.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <DiscountIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-slate-900">{offer.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${active
                              ? 'bg-emerald-100 text-emerald-700'
                              : expired
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                            {active ? 'Active' : expired ? 'Expired' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{offer.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Discount Value */}
                    <div className={`p-4 rounded-xl border-2 ${styles.border} ${styles.bg}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Discount</p>
                          <p className={`text-2xl font-black ${styles.text}`}>
                            {formatDiscount(offer)}
                          </p>
                        </div>
                        <TrendingUp className={`w-8 h-8 ${styles.text} opacity-50`} />
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {offer.min_purchase > 0 && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Min Purchase</p>
                          <p className="text-sm font-bold text-slate-900">{formatCurrencyLKR(offer.min_purchase)}</p>
                        </div>
                      )}
                      {offer.max_discount && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Discount</p>
                          <p className="text-sm font-bold text-slate-900">{formatCurrencyLKR(offer.max_discount)}</p>
                        </div>
                      )}
                    </div>

                    {/* Validity */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validity Period</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">From: {formatDateTime(offer.valid_from)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600">Until: {formatDateTime(offer.valid_until)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOffer(offer);
                          setShowForm(true);
                        }}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(offer)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Offer Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingOffer(null);
          }}
          title={editingOffer ? 'Edit Offer' : 'Create Offer'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-semibold text-amber-700">Create a new promotional offer</p>
              </div>
              <p className="text-xs text-amber-600">Fill in the details below to create an attractive offer for your customers</p>
            </div>

            <Input
              label="Offer Title"
              name="title"
              defaultValue={editingOffer?.title || ''}
              required
              placeholder="e.g., Summer Sale - 25% Off"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                className="input-field"
                defaultValue={editingOffer?.description || ''}
                placeholder="Describe the offer details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select name="discount_type" className="input-field" required defaultValue={editingOffer?.discount_type || ''}>
                  <option value="">Select type</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="loyalty_points">Loyalty Points</option>
                </select>
              </div>
              <Input
                label="Discount Value"
                type="number"
                step="0.01"
                name="discount_value"
                defaultValue={editingOffer?.discount_value || ''}
                required
                placeholder="Enter value"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Purchase (LKR)"
                type="number"
                step="0.01"
                min={0}
                name="min_purchase"
                defaultValue={editingOffer != null ? editingOffer.min_purchase : ''}
                placeholder="0"
              />
              <Input
                label="Max Discount (LKR) - Optional"
                type="number"
                step="0.01"
                min={0}
                name="max_discount"
                defaultValue={editingOffer != null ? editingOffer.max_discount ?? '' : ''}
                placeholder="Leave empty for no limit"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valid From"
                type="datetime-local"
                name="valid_from"
                defaultValue={editingOffer?.valid_from ? new Date(editingOffer.valid_from).toISOString().slice(0, 16) : ''}
                required
              />
              <Input
                label="Valid Until"
                type="datetime-local"
                name="valid_until"
                defaultValue={editingOffer?.valid_until ? new Date(editingOffer.valid_until).toISOString().slice(0, 16) : ''}
                required
              />
            </div>

            <div className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editingOffer?.is_active !== false}
                className="mr-3 w-4 h-4"
                id="is_active"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Activate this offer immediately
              </label>
            </div>

            <div className="flex space-x-4 pt-2">
              <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900">
                <Gift className="w-4 h-4 inline mr-2" />
                {editingOffer ? 'Update' : 'Create'} Offer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingOffer(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete offer"
          message={
            deleteTarget
              ? `Are you sure you want to delete offer "${deleteTarget.title}"?`
              : ''
          }
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onCancel={() => {
            if (deleteLoading) return;
            setDeleteTarget(null);
          }}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.offer_id)}
        />
      </div>
  );
};

export default OfferManagement;
