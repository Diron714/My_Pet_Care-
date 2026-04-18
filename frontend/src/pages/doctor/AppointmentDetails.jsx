import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { formatDate, formatTime, formatPetAgeMonths } from '../../utils/formatters';
import { getStatusColor, getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Calendar,
  ClipboardList,
  Stethoscope,
  History,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Activity,
  Zap,
  PawPrint,
  Phone,
  Clock,
  DollarSign,
  Pill,
  AlertCircle
} from 'lucide-react';

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
  const [healthHistory, setHealthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [notes, setNotes] = useState({
    diagnosis: '',
    prescription: '',
    treatmentNotes: '',
  });
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    loadAppointmentDetails();
  }, [id]);

  const loadAppointmentDetails = async () => {
    try {
      setLoading(true);
      const appointmentRes = await api.get(`/appointments/${id}`);
      const appointmentData = appointmentRes.data.data;
      setAppointment(appointmentData);

      const historyRes = await api.get(`/health-records/pet/${appointmentData.customer_pet_id}`);
      setHealthHistory(historyRes.data.data || []);
      const initialNotes = {
        diagnosis: appointmentData.diagnosis ?? '',
        prescription: appointmentData.prescription ?? '',
        treatmentNotes: appointmentData.doctor_notes ?? '',
      };
      setNotes(initialNotes);

      const hasExistingNotes =
        (initialNotes.diagnosis && initialNotes.diagnosis.trim() !== '') ||
        (initialNotes.prescription && initialNotes.prescription.trim() !== '') ||
        (initialNotes.treatmentNotes && initialNotes.treatmentNotes.trim() !== '');
      setIsEditing(!hasExistingNotes);
    } catch (error) {
      console.error('Error loading appointment details:', error);
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await api.put(`/appointments/${id}/status`, {
        status: appointment.status,
        doctor_notes: notes.treatmentNotes || notes.diagnosis || notes.prescription || '',
      });

      // Also persist diagnosis & prescription into health records so they
      // reliably show up for both doctor and customer views on reload.
      if (notes.diagnosis || notes.prescription || notes.treatmentNotes) {
        await api.post('/health-records', {
          appointment_id: id,
          customer_pet_id: appointment.customer_pet_id,
          diagnosis: notes.diagnosis,
          prescription: notes.prescription,
          treatment_notes: notes.treatmentNotes,
        });
      }

      toast.success('Consultation notes synchronized');
      loadAppointmentDetails();
      setIsEditing(false);
    } catch (error) {
      toast.error('Synchronization failure');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    try {
      await api.put(`/appointments/${id}/status`, {
        status: 'accepted',
      });
      toast.success('Appointment accepted');
      loadAppointmentDetails();
    } catch (error) {
      toast.error('Failed to accept session');
    }
  };

  const handleReject = async () => {
    try {
      setRejectLoading(true);
      await api.put(`/appointments/${id}/status`, {
        status: 'rejected',
      });
      toast.success('Appointment rejected');
      navigate('/doctor/appointments');
    } catch (error) {
      toast.error('Failed to reject session');
    } finally {
      setRejectLoading(false);
      setRejectConfirmOpen(false);
    }
  };

  const handleComplete = async () => {
    try {
      await api.put(`/appointments/${id}/status`, {
        status: 'completed',
      });
      toast.success('Consultation officially completed');
      loadAppointmentDetails();
    } catch (error) {
      toast.error('Failed to finalize session');
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!appointment) return <Layout><div className="text-center py-24 font-black text-slate-300 uppercase tracking-widest">Appointment Not Located</div></Layout>;

  return (
    <Layout>
      <div className="page-shell max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  Appointments
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Details</span>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
                Session #{appointment.appointment_number}
              </h1>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">{formatDate(appointment.appointment_date)}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{formatTime(appointment.appointment_time)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* PATIENT INTELLIGENCE COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-slate-900 text-white p-8 shadow-xl shadow-slate-900/20 relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-40 h-40 bg-slate-700/40 rounded-full blur-3xl -mr-20 -mt-20" />

              <div className="flex items-center gap-2 mb-8">
                <User className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Subject Identity</h3>
              </div>

              <div className="space-y-6 relative z-10">
                {appointment.customer_pet?.image_url && (
                  <div className="relative h-32 w-32 rounded-2xl overflow-hidden border-2 border-white/20 mx-auto">
                    <img
                      src={getImageSrc(appointment.customer_pet.image_url)}
                      alt={appointment.customer_pet.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-2xl font-semibold tracking-tight leading-none mb-2 text-white">{appointment.customer_pet?.name}</p>
                  <p className="text-sm font-medium text-slate-400">
                    {appointment.customer_pet?.species} — {appointment.customer_pet?.breed}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Age</p>
                    <p className="text-sm font-semibold text-white leading-snug">
                      {formatPetAgeMonths(appointment.customer_pet?.age)}
                    </p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                    <p className="text-sm font-semibold text-emerald-400 leading-snug">Active</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Owner Specifications
                  </p>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-white leading-tight">
                      {appointment.customer?.user?.first_name} {appointment.customer?.user?.last_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{appointment.customer?.user?.phone || 'Not provided'}</span>
                    </div>
                    <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-400/20 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">Fee</span>
                        <span className="text-lg font-semibold text-white">{formatCurrencyLKR(appointment.consultation_fee)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Health History */}
            {healthHistory.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Recent Medical History</h2>
                </div>
                <div className="space-y-4">
                  {healthHistory.slice(0, 3).map((record) => (
                    <div key={record.record_id} className="relative pl-6 border-l-2 border-slate-200 group">
                      <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{formatDate(record.record_date)}</p>
                      <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-relaxed">
                        {record.diagnosis}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CONSULTATION SUITE */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-slate-700" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">Clinical Assessment</h2>
                </div>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Diagnosis Details
                  </label>
                  <textarea
                    disabled={!isEditing}
                    value={notes.diagnosis}
                    onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                    rows={4}
                    className="input-field !rounded-xl !py-4 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Enter professional clinical observations..."
                  />
                </div>

                <div className="group">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Prescription Specifications
                  </label>
                  <textarea
                    disabled={!isEditing}
                    value={notes.prescription}
                    onChange={(e) => setNotes({ ...notes, prescription: e.target.value })}
                    rows={4}
                    className="input-field !rounded-xl !py-4 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Document necessary medications and dosages..."
                  />
                </div>

                <div className="group">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Observation Notes
                  </label>
                  <textarea
                    disabled={!isEditing}
                    value={notes.treatmentNotes}
                    onChange={(e) => setNotes({ ...notes, treatmentNotes: e.target.value })}
                    rows={4}
                    className="input-field !rounded-xl !py-4 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Internal treatment and follow-up guidance..."
                  />
                </div>

                <div className="pt-4">
                  {isEditing ? (
                    <Button
                      onClick={handleSaveNotes}
                      disabled={saving}
                      className="w-full !bg-slate-800 hover:!bg-slate-900 !py-4"
                      loading={saving}
                    >
                      <ShieldCheck className="w-5 h-5 inline mr-2" />
                      Save Clinical Progress
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full !bg-slate-700 hover:!bg-slate-800 !py-4"
                    >
                      <ShieldCheck className="w-5 h-5 inline mr-2" />
                      Edit Clinical Progress
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* CONTROL MATRIX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {appointment.status === 'pending' && (
                <>
                  <Button onClick={handleAccept} className="!bg-emerald-600 hover:!bg-emerald-700 !py-4 !rounded-2xl !font-medium">
                    <CheckCircle2 className="w-5 h-5 inline mr-2" />
                    Accept Session
                  </Button>
                  <Button onClick={() => setRejectConfirmOpen(true)} variant="danger" className="!py-4">
                    <XCircle className="w-5 h-5 inline mr-2" />
                    Reject Session
                  </Button>
                </>
              )}

              {appointment.status === 'accepted' && (
                <Button onClick={handleComplete} className="col-span-full !bg-slate-900 hover:!bg-slate-800 !py-4 !rounded-2xl !font-medium">
                  <CheckCircle2 className="w-5 h-5 inline mr-2" />
                  Finalize Medical Process
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* Reject confirmation dialog */}
        <ConfirmDialog
          isOpen={rejectConfirmOpen}
          title="Reject session"
          message="Are you sure you want to reject this appointment?"
          confirmLabel="Yes, reject"
          confirmVariant="danger"
          loading={rejectLoading}
          onCancel={() => {
            if (rejectLoading) return;
            setRejectConfirmOpen(false);
          }}
          onConfirm={handleReject}
        />
      </div>
    </Layout>
  );
};

export default AppointmentDetails;
