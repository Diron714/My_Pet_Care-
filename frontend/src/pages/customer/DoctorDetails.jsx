import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import { Star, Calendar, MessageSquare, Stethoscope, Award, Clock, User, ArrowLeft, CheckCircle, GraduationCap, Heart } from 'lucide-react';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const DoctorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorDetails();
  }, [id]);

  const loadDoctorDetails = async () => {
    try {
      setLoading(true);
      const [doctorRes, scheduleRes, reviewsRes] = await Promise.all([
        api.get(`/doctors/${id}`),
        api.get(`/doctors/${id}/schedule`),
        api.get(`/feedback/item/doctor/${id}`),
      ]);
      setDoctor(doctorRes.data.data);
      setSchedule(scheduleRes.data.data || []);
      const feedbackData = reviewsRes.data.data || {};
      setReviews(feedbackData.feedbacks || []);
    } catch (error) {
      console.error('Error loading doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!doctor) return <Layout><div className="text-center py-12">Doctor not found</div></Layout>;

  return (
    <Layout>
      <div className="page-shell">
        <Link to="/customer/doctors" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Doctors
        </Link>

        {/* Doctor Header Card */}
        <div className="card mb-6 overflow-hidden">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Doctor Image */}
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-emerald-200 shadow-xl">
              {doctor.image_url ? (
                <img
                  src={getImageSrc(doctor.image_url)}
                  alt={`Dr. ${doctor.first_name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = PLACEHOLDER_IMAGE;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Stethoscope className="w-20 h-20 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2">
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h1>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <p className="font-bold text-emerald-700">{doctor.specialization}</p>
                      </div>
                    </div>
                    {doctor.is_available && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(doctor.rating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xl font-bold text-slate-900">
                  {Number(doctor.rating || 0).toFixed(1)}
                </span>
                <span className="text-slate-500">({doctor.total_reviews || 0} reviews)</span>
              </div>

              {/* Consultation Fee */}
              <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-slate-200 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Consultation Fee</p>
                    <p className="text-2xl font-black text-slate-800">{formatCurrencyLKR(doctor.consultation_fee)}</p>
                  </div>
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`/customer/appointments/book?doctorId=${id}`)}
                  className="flex-1 !bg-slate-800 hover:!bg-slate-900"
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Book Appointment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/customer/chat')}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Contact support
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Doctor */}
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-slate-600" />
                <h2 className="text-xl font-bold text-slate-900">About Doctor</h2>
              </div>
              <div className="space-y-4">
                {doctor.bio && (
                  <p className="text-slate-700 leading-relaxed">{doctor.bio}</p>
                )}
                {doctor.qualifications && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-slate-900">Qualifications</h3>
                    </div>
                    <p className="text-slate-700">{doctor.qualifications}</p>
                  </div>
                )}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Experience</h3>
                  </div>
                  <p className="text-2xl font-black text-blue-700">{doctor.experience_years || 0} years</p>
                </div>
              </div>
            </div>

            {/* Schedule Overview */}
            {schedule.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-5 h-5 text-slate-600" />
                  <h2 className="text-xl font-bold text-slate-900">Available Schedule</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {schedule.filter(s => s.is_active).map((slot) => (
                    <div key={slot.schedule_id} className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 text-center">
                      <p className="font-bold text-emerald-900 capitalize mb-1">{slot.day_of_week}</p>
                      <p className="text-sm text-emerald-700">{slot.start_time} - {slot.end_time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-slate-600" />
                  <h2 className="text-xl font-bold text-slate-900">Patient Reviews ({reviews.length})</h2>
                </div>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.feedback_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold">
                            {review.customer?.user?.first_name?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {review.customer?.user?.first_name} {review.customer?.user?.last_name}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(review.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-slate-700 leading-relaxed pl-13">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Quick Info</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialization</p>
                  </div>
                  <p className="font-bold text-slate-900">{doctor.specialization}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Experience</p>
                  </div>
                  <p className="text-2xl font-black text-blue-700">{doctor.experience_years || 0} years</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-amber-600" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</p>
                  </div>
                  <p className="text-2xl font-black text-amber-700">
                    {Number(doctor.rating || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Based on {doctor.total_reviews || 0} reviews</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Consultation Fee</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-700">{formatCurrencyLKR(doctor.consultation_fee)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDetails;
