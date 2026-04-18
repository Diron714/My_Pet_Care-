import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema } from '../../utils/validators';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import {
  Star,
  Plus,
  Package,
  Stethoscope,
  Lightbulb,
  MessageSquare,
  CheckCircle,
  Calendar,
  User,
  ShoppingBag,
  PenLine,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackType: '',
      itemId: 0,
      rating: '',
      comment: '',
    },
  });

  const selectedType = watch('feedbackType');

  useEffect(() => {
    if (!selectedType) return;
    if (selectedType === 'service') setValue('itemId', 0);
    else setValue('itemId', '');
  }, [selectedType, setValue]);

  useEffect(() => {
    loadFeedbacks();
    loadFeedbackOptions();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feedback');
      setFeedbacks(response.data.data || []);
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackOptions = async () => {
    try {
      setOptionsLoading(true);
      const [productsRes, doctorsRes] = await Promise.all([
        api.get('/products?available=true'),
        api.get('/doctors'),
      ]);
      setProductOptions(productsRes.data.data || []);
      setDoctorOptions(doctorsRes.data.data || []);
    } catch (error) {
      console.error('Error loading feedback options:', error);
    } finally {
      setOptionsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        feedback_type: data.feedbackType,
        item_id: data.itemId,
        rating: data.rating,
        comment: data.comment,
      };

      const response = await api.post('/feedback', payload);
      if (response.data.success) {
        toast.success('Feedback submitted successfully');
        setShowForm(false);
        reset({
          feedbackType: '',
          itemId: 0,
          rating: '',
          comment: '',
        });
        loadFeedbacks();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const getFeedbackTypeIcon = (type) => {
    switch (type) {
      case 'product': return Package;
      case 'service': return Lightbulb;
      case 'doctor': return Stethoscope;
      default: return MessageSquare;
    }
  };

  const getFeedbackTypeColors = (type) => {
    switch (type) {
      case 'product':
        return {
          gradient: 'from-blue-500 to-blue-600',
          borderAccent: 'border-l-blue-500',
        };
      case 'service':
        return {
          gradient: 'from-violet-500 to-violet-600',
          borderAccent: 'border-l-violet-500',
        };
      case 'doctor':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          borderAccent: 'border-l-emerald-500',
        };
      default:
        return {
          gradient: 'from-slate-500 to-slate-600',
          borderAccent: 'border-l-slate-400',
        };
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Star className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Feedback & Ratings</h2>
          </div>
          <Button
            onClick={() => {
              reset({
                feedbackType: '',
                itemId: 0,
                rating: '',
                comment: '',
              });
              setShowForm(true);
            }}
            className="!bg-slate-800 hover:!bg-slate-900 !rounded-xl"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Submit Feedback
          </Button>
        </div>

        {feedbacks.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Star}
              title="No feedback submitted"
              message="Share your experience with us"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {feedbacks.map((feedback) => {
              const TypeIcon = getFeedbackTypeIcon(feedback.feedback_type);
              const typeColors = getFeedbackTypeColors(feedback.feedback_type);
              return (
                <div
                  key={feedback.feedback_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${typeColors.borderAccent}`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`h-16 w-16 rounded-xl bg-gradient-to-br ${typeColors.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                    >
                      <TypeIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 capitalize">
                          {feedback.feedback_type} feedback
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${getStatusColor(
                            feedback.status
                          )}`}
                        >
                          {feedback.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <ShoppingBag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-semibold">Item:</span>
                          <span className="truncate">{feedback.item_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Star className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-semibold">Rating:</span>
                          <span className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < feedback.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                                  }`}
                              />
                            ))}
                            <span className="ml-1 text-slate-700">({feedback.rating}/5)</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          Submitted: {formatDate(feedback.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {feedback.comment && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-3">
                      <p className="text-sm text-slate-700 leading-relaxed">{feedback.comment}</p>
                    </div>
                  )}
                  {feedback.admin_response && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-slate-600" />
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Admin response
                        </p>
                      </div>
                      <p className="text-sm text-slate-800">{feedback.admin_response}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            reset({
              feedbackType: '',
              itemId: 0,
              rating: '',
              comment: '',
            });
          }}
          title="Submit Feedback"
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1 text-slate-500" />
                Feedback type <span className="text-red-500">*</span>
              </label>
              <select {...register('feedbackType')} className="input-field">
                <option value="">Select feedback type</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
                <option value="doctor">Doctor</option>
              </select>
              {errors.feedbackType && (
                <p className="mt-1 text-sm text-red-600">{errors.feedbackType.message}</p>
              )}
            </div>

            {selectedType && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {selectedType === 'doctor' && (
                    <Stethoscope className="w-4 h-4 inline mr-1 text-slate-500" />
                  )}
                  {selectedType === 'product' && (
                    <Package className="w-4 h-4 inline mr-1 text-slate-500" />
                  )}
                  {selectedType === 'service' && (
                    <Lightbulb className="w-4 h-4 inline mr-1 text-slate-500" />
                  )}
                  {selectedType === 'doctor'
                    ? 'Doctor'
                    : selectedType === 'product'
                      ? 'Product'
                      : 'Service'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <select key={selectedType} {...register('itemId')} className="input-field">
                  <option value="">
                    {selectedType === 'service' ? 'Select' : `Select ${selectedType}`}
                  </option>
                  {selectedType === 'service' && (
                    <option value={0}>Overall service experience</option>
                  )}
                  {selectedType === 'product' &&
                    productOptions.map((product) => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.name}
                      </option>
                    ))}
                  {selectedType === 'doctor' &&
                    doctorOptions.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                      </option>
                    ))}
                </select>
                {errors.itemId && (
                  <p className="mt-1 text-sm text-red-600">{errors.itemId.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Star className="w-4 h-4 inline mr-1 text-slate-500" />
                Rating <span className="text-red-500">*</span>
              </label>
              <select {...register('rating', { valueAsNumber: true })} className="input-field">
                <option value="">Select rating</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} {rating === 1 ? 'Star' : 'Stars'}
                  </option>
                ))}
              </select>
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <PenLine className="w-4 h-4 inline mr-1 text-slate-500" />
                Comment
              </label>
              <textarea
                {...register('comment')}
                rows={4}
                className="input-field"
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Submit Feedback
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  reset({
                    feedbackType: '',
                    itemId: 0,
                    rating: '',
                    comment: '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};

export default Feedback;
