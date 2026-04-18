import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters';
import { getStatusColor } from '../../utils/helpers';
import { Calendar, Clock, User, PawPrint, DollarSign, CheckCircle, XCircle, ArrowRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [filter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/appointments${params}`);
      setAppointments(response.data.data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (appointmentId) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, {
        status: 'accepted',
      });
      toast.success('Appointment accepted');
      loadAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept appointment');
    }
  };

  const handleReject = async (appointmentId) => {
    try {
      setRejectLoading(true);
      await api.put(`/appointments/${appointmentId}/status`, {
        status: 'rejected',
      });
      toast.success('Appointment rejected');
      loadAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setRejectLoading(false);
      setRejectTarget(null);
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, {
        status: 'completed',
      });
      toast.success('Appointment marked as completed');
      loadAppointments();
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'accepted':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      default:
        return Calendar;
    }
  };

  const filters = [
    { value: 'all', label: 'All', icon: Calendar, color: 'slate' },
    { value: 'pending', label: 'Pending', icon: Clock, color: 'amber' },
    { value: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'emerald' },
    { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'blue' },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'rose' },
  ];

  if (loading) return <Layout><Loading /></Layout>;

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const todayCount = appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length;

  return (
    <Layout>
      <div className="page-shell max-w-6xl">

        {/* Statistics */}
        {appointments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Appointments</p>
                  <p className="text-2xl font-semibold text-slate-900">{appointments.length}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Pending Requests</p>
                  <p className="text-2xl font-semibold text-amber-600">{pendingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Today's Appointments</p>
                  <p className="text-2xl font-semibold text-blue-600">{todayCount}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            const isCancelled = f.value === 'cancelled';
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                    ? isCancelled
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/35 ring-2 ring-red-500/40'
                      : 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isCancelled ? 'text-red-600' : 'text-slate-500'}`} />
                {f.label}
              </button>
            );
          })}
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-12">
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              message="You don't have any appointments yet"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {appointments.map((appointment) => {
              const StatusIcon = getStatusIcon(appointment.status);
              return (
                <div key={appointment.appointment_id} className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-7 h-7 text-slate-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          Appointment #{appointment.appointment_number}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {appointment.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">Customer:</span> {appointment.customer?.user?.first_name}{' '}
                          {appointment.customer?.user?.last_name}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <PawPrint className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">Pet:</span> {appointment.customer_pet?.name} ({appointment.customer_pet?.species})
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{formatDate(appointment.appointment_date)}</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Time</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">{formatTime(appointment.appointment_time)}</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Fee</p>
                            </div>
                            <p className="text-lg font-semibold text-emerald-800">{formatCurrencyLKR(appointment.consultation_fee)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Link to={`/doctor/appointments/${appointment.appointment_id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full !rounded-xl !border-slate-200 hover:!bg-slate-50">
                        <ArrowRight className="w-4 h-4 inline mr-1" />
                        View Details
                      </Button>
                    </Link>
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(appointment.appointment_id)}
                          className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 !rounded-xl"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectTarget(appointment)}
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {appointment.status === 'accepted' && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(appointment.appointment_id)}
                        className="flex-1 !bg-slate-900 hover:!bg-slate-800 !rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Reject confirmation dialog */}
        <ConfirmDialog
          isOpen={!!rejectTarget}
          title="Reject appointment"
          message={
            rejectTarget
              ? `Are you sure you want to reject appointment ${rejectTarget.appointment_number}?`
              : ''
          }
          confirmLabel="Yes, reject"
          confirmVariant="danger"
          loading={rejectLoading}
          onCancel={() => {
            if (rejectLoading) return;
            setRejectTarget(null);
          }}
          onConfirm={() => rejectTarget && handleReject(rejectTarget.appointment_id)}
        />
      </div>
    </Layout>
  );
};

export default Appointments;
