import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reminderSchema } from '../../utils/validators';
import api from '../../services/api';
import { formatDate, formatTime } from '../../utils/formatters';
import { Clock, Plus, Edit, Trash2, Check, Calendar, Syringe, Pill, Utensils, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';

/** MySQL returns is_completed as 0/1; avoid `{n && <X/>}` which renders "0" when n is 0 */
const isCompleted = (r) => r.is_completed === true || r.is_completed === 1;

/** Calendar date in local timezone (avoids UTC parse shifts). */
function calendarDateFromReminder(raw) {
  if (raw == null) return null;
  const s = typeof raw === 'string' ? raw.slice(0, 10) : String(raw).slice(0, 10);
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/** Matches GET /reminders/upcoming: not completed and reminder_date >= today */
const isScheduledUpcoming = (r) => {
  if (isCompleted(r)) return false;
  const day = calendarDateFromReminder(r.reminder_date);
  if (!day) return false;
  return day >= startOfToday();
};

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(reminderSchema),
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reminders');
      setReminders(response.data.data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const url = editingReminder ? `/reminders/${editingReminder.reminder_id}` : '/reminders';
      const method = editingReminder ? 'put' : 'post';

      // Map form fields (camelCase) to API payload (snake_case)
      const payload = {
        reminder_type: data.reminderType,
        title: data.title,
        description: data.description,
        reminder_date: data.reminderDate,
        reminder_time: data.reminderTime || null,
      };

      const response = await api[method](url, payload);

      if (response.data.success) {
        toast.success(editingReminder ? 'Reminder updated' : 'Reminder created');
        setShowForm(false);
        setEditingReminder(null);
        reset();
        loadReminders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save reminder');
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setValue('reminderType', reminder.reminder_type);
    setValue('title', reminder.title);
    setValue('description', reminder.description);
    setValue('reminderDate', reminder.reminder_date);
    setValue('reminderTime', reminder.reminder_time);
    setShowForm(true);
  };

  const handleDelete = async (reminderId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/reminders/${reminderId}`);
      toast.success('Reminder deleted');
      loadReminders();
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Failed to delete reminder');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleComplete = async (reminderId) => {
    try {
      await api.put(`/reminders/${reminderId}/complete`);
      toast.success('Reminder marked as completed');
      loadReminders();
    } catch (error) {
      toast.error('Failed to complete reminder');
    }
  };

  const getReminderIcon = (type) => {
    switch (type) {
      case 'vaccination': return Syringe;
      case 'medication': return Pill;
      case 'food': return Utensils;
      case 'appointment': return Calendar;
      case 'other': return AlertCircle;
      default: return Clock;
    }
  };

  const getReminderColors = (type) => {
    switch (type) {
      case 'vaccination': return { gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'medication': return { gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'food': return { gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'appointment': return { gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'other': return { gradient: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
      default: return { gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const upcomingCount = reminders.filter((r) => isScheduledUpcoming(r)).length;
  const completedCount = reminders.filter((r) => isCompleted(r)).length;

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'upcoming') return isScheduledUpcoming(r);
    if (filter === 'completed') return isCompleted(r);
    return true;
  });

  const emptyStateCopy =
    filter === 'upcoming'
      ? {
          title: 'No upcoming reminders',
          message: 'Nothing scheduled for today or later. Past-due items that are still open appear under All.',
        }
      : filter === 'completed'
        ? {
            title: 'No completed reminders',
            message: 'Reminders you mark complete will show up here.',
          }
        : {
            title: 'No reminders',
            message: "Create reminders to stay on top of your pet's care",
          };

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Reminders</h2>
          </div>
          <Button onClick={() => {
            setEditingReminder(null);
            reset();
            setShowForm(true);
          }} className="!bg-slate-800 hover:!bg-slate-900 !rounded-xl">
            <Plus className="w-4 h-4 inline mr-2" />
            Add Reminder
          </Button>
        </div>

        {/* Statistics */}
        {reminders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                  <p className="text-2xl font-black text-slate-900">{reminders.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming</p>
                  <p className="text-2xl font-black text-blue-600">{upcomingCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="card card-muted">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { value: 'all', label: 'All', icon: Clock, color: 'slate' },
            { value: 'upcoming', label: 'Upcoming', icon: Calendar, color: 'blue' },
            { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'emerald' },
          ].map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 capitalize ${isActive
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-500/30'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                {f.label}
              </button>
            );
          })}
        </div>

        {loading && filteredReminders.length === 0 ? (
          <div className="card">
            <Loading />
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Clock}
              title={emptyStateCopy.title}
              message={emptyStateCopy.message}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReminders.map((reminder) => {
              const ReminderIcon = getReminderIcon(reminder.reminder_type);
              const colors = getReminderColors(reminder.reminder_type);
              return (
                <div
                  key={reminder.reminder_id}
                  className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${
                    isCompleted(reminder)
                      ? 'opacity-60 border-l-slate-400'
                      : {
                          vaccination: 'border-l-blue-500',
                          medication: 'border-l-purple-500',
                          food: 'border-l-amber-500',
                          appointment: 'border-l-emerald-500',
                          other: 'border-l-rose-500',
                        }[reminder.reminder_type] || 'border-l-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                        <ReminderIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{reminder.title}</h3>
                        <p className="text-xs text-slate-500 capitalize">{reminder.reminder_type}</p>
                      </div>
                    </div>
                    {isCompleted(reminder) ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </span>
                    ) : null}
                  </div>
                  {reminder.description && (
                    <div className={`p-3 ${colors.bg} rounded-xl border ${colors.border} mb-4`}>
                      <p className="text-sm text-slate-700">{reminder.description}</p>
                    </div>
                  )}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">Date:</span> {formatDate(reminder.reminder_date)}
                    </div>
                    {reminder.reminder_time && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold">Time:</span> {formatTime(reminder.reminder_time)}
                      </div>
                    )}
                  </div>
                  {!isCompleted(reminder) ? (
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reminder)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(reminder.reminder_id)}
                        className="flex-1"
                      >
                        <Check className="w-4 h-4 inline mr-1" />
                        Complete
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(reminder)}
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingReminder(null);
            reset();
          }}
          title={editingReminder ? 'Edit Reminder' : 'Add Reminder'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Reminder Type <span className="text-red-500">*</span>
              </label>
              <select {...register('reminderType')} className="input-field">
                <option value="">Select type</option>
                <option value="vaccination">Vaccination</option>
                <option value="medication">Medication</option>
                <option value="food">Food</option>
                <option value="appointment">Appointment</option>
                <option value="other">Other</option>
              </select>
              {errors.reminderType && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reminderType.message}
                </p>
              )}
            </div>

            <Input
              label="Title"
              {...register('title')}
              error={errors.title?.message}
              required
              placeholder="e.g., Vaccination Due"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-field"
                placeholder="Optional description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                {...register('reminderDate')}
                error={errors.reminderDate?.message}
                required
              />
              <Input
                label="Time (Optional)"
                type="time"
                {...register('reminderTime')}
                error={errors.reminderTime?.message}
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                {editingReminder ? 'Update' : 'Create'} Reminder
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingReminder(null);
                  reset();
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
          title="Delete reminder"
          message={
            deleteTarget
              ? `Are you sure you want to delete the reminder "${deleteTarget.title}"?`
              : ''
          }
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onCancel={() => {
            if (deleteLoading) return;
            setDeleteTarget(null);
          }}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.reminder_id)}
        />
      </div>
    </Layout>
  );
};

export default Reminders;
