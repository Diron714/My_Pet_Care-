import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Star } from 'lucide-react';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialization: '',
    rating: '',
    available: true,
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Our Doctors</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64">
            <div className="card">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Specialization</label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All</option>
                    <option value="General">General</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Rating</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pr-8"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {doctors.length === 0 ? (
              <EmptyState title="No doctors found" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.map((doctor) => (
                  <Link key={doctor.doctor_id} to={`/customer/doctors/${doctor.doctor_id}`}>
                    <div className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                          {doctor.user?.first_name?.[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            Dr. {doctor.user?.first_name} {doctor.user?.last_name}
                          </h3>
                          <p className="text-gray-600">{doctor.specialization}</p>
                          <div className="flex items-center mt-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="ml-1 text-sm">{doctor.rating?.toFixed(1) || '0.0'}</span>
                            <span className="ml-2 text-sm text-gray-600">({doctor.total_reviews} reviews)</span>
                          </div>
                          <p className="text-primary-600 font-bold mt-2">
                            {formatCurrency(doctor.consultation_fee)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
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

