import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import { Star, Calendar, Stethoscope, Search, Filter, RefreshCw, Award, Clock, User, XCircle } from 'lucide-react';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  // By default, show all doctors (including those not yet marked available)
  const [filters, setFilters] = useState({
    specialization: '',
    rating: '',
    available: false,
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadDoctors();
  }, [filters, search]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.rating) params.append('minRating', filters.rating);
      if (filters.available) params.append('available', 'true');
      if (search) params.append('search', search);

      const response = await api.get(`/doctors?${params.toString()}`);
      setDoctors(response.data.data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-shell">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-lg text-slate-800">Filters</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Specialization</label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    className="input-field !rounded-xl !py-3"
                  >
                    <option value="">All Specializations</option>
                    <option value="General">General</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Cardiology">Cardiology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Minimum Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                    className="input-field !rounded-xl !py-3"
                  >
                    <option value="">All Ratings</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFilters({ specialization: '', rating: '', available: false })}
                  className="w-full !rounded-xl !py-3"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Reset Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Doctors Grid */}
          <div className="flex-1">
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !rounded-xl !py-3 !pl-10 bg-slate-50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {loading && doctors.length === 0 ? (
              <div className="card">
                <Loading />
              </div>
            ) : doctors.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={Stethoscope}
                  title="No doctors found"
                  message="Try adjusting your filters or search terms"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.doctor_id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-500 overflow-hidden">
                    <div className="flex items-start gap-4">
                      {/* Doctor Image */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-emerald-200">
                        {doctor.image_url ? (
                          <img
                            src={getImageSrc(doctor.image_url)}
                            alt={`Dr. ${doctor.user?.first_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = PLACEHOLDER_IMAGE;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Stethoscope className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link to={`/customer/doctors/${doctor.doctor_id}`}>
                          <h3 className="font-bold text-xl text-slate-900 mb-1 hover:text-slate-800 transition-colors">
                            Dr. {doctor.first_name} {doctor.last_name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-700">{doctor.specialization}</p>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(Number(doctor.rating || 0))
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {Number(doctor.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-500">({doctor.total_reviews || 0} reviews)</span>
                        </div>

                        {/* Experience */}
                        <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{doctor.experience_years || 0} years experience</span>
                        </div>

                        {/* Fee */}
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 mb-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Consultation Fee</p>
                            <p className="text-lg font-black text-emerald-700">{formatCurrencyLKR(doctor.consultation_fee)}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Link to={`/customer/doctors/${doctor.doctor_id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <User className="w-4 h-4 inline mr-1" />
                              View Profile
                            </Button>
                          </Link>
                          <Link to={`/customer/appointments/book?doctorId=${doctor.doctor_id}`} className="flex-1">
                            <Button size="sm" className="w-full !bg-slate-800 hover:!bg-slate-900">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Book Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorList;
