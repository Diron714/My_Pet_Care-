import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { formatDate, formatTime } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { ArrowLeft, Calendar, Clock, PawPrint, User, DollarSign } from 'lucide-react';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/appointments/${id}`);
        setAppointment(res.data.data);
      } catch (err) {
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout>
        <div className="page-shell">
          <div className="text-center py-24 font-black text-slate-300 uppercase tracking-widest">
            Appointment Not Found
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-3">
            <button
              onClick={() => navigate('/customer/appointments')}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-all font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Appointments
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                Appointment #{appointment.appointment_number}
              </h1>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider ${getStatusColor(
                  appointment.status
                )}`}
              >
                {appointment.status}
              </span>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                  Appointment Schedule
                </p>
                <p className="text-lg font-black text-blue-900">
                  {formatDate(appointment.appointment_date)}
                </p>
                <p className="text-sm font-bold text-blue-700">
                  {formatTime(appointment.appointment_time)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Pet info */}
          <div className="space-y-6">
            <div className="card bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Pet
                  </p>
                  <p className="text-xl font-black text-emerald-900">
                    {appointment.customer_pet?.name}
                  </p>
                  <p className="text-sm text-emerald-700">
                    {appointment.customer_pet?.species} - {appointment.customer_pet?.breed}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Doctor
                  </p>
                  <p className="font-bold text-slate-900">
                    Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                  </p>
                  <p className="text-sm text-slate-600">{appointment.doctor?.specialization}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Date, time, fee, medical details */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                    Date
                  </p>
                </div>
                <p className="text-sm font-bold text-blue-900">
                  {formatDate(appointment.appointment_date)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                    Time
                  </p>
                </div>
                <p className="text-sm font-bold text-purple-900">
                  {formatTime(appointment.appointment_time)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                    Consultation Fee
                  </p>
                </div>
                <p className="text-lg font-black text-amber-700">
                  {formatCurrencyLKR(appointment.consultation_fee)}
                </p>
              </div>
            </div>

            {/* Doctor's medical notes (read-only for customer) */}
            {(appointment.diagnosis || appointment.prescription || appointment.doctor_notes) && (
              <div className="card">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Consultation Summary</h2>
                {appointment.diagnosis && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Diagnosis
                    </p>
                    <p className="text-sm text-slate-800 whitespace-pre-line">
                      {appointment.diagnosis}
                    </p>
                  </div>
                )}
                {appointment.prescription && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Prescription
                    </p>
                    <p className="text-sm text-slate-800 whitespace-pre-line">
                      {appointment.prescription}
                    </p>
                  </div>
                )}
                {appointment.doctor_notes && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Additional Notes
                    </p>
                    <p className="text-sm text-slate-800 whitespace-pre-line">
                      {appointment.doctor_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => navigate('/customer/appointments')}>Back to list</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AppointmentDetails;

