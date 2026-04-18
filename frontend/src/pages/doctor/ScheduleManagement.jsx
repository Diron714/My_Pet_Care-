import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { Plus, Edit, Trash2, Clock, Calendar, CheckCircle, XCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/common/Input';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  /** When adding (not editing): apply same hours to one day, weekdays, weekend, or whole week */
  const [addDayScope, setAddDayScope] = useState('single');

  const weekdayValues = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const weekendValues = ['saturday', 'sunday'];
  const allDayValues = [...weekdayValues, ...weekendValues];

  const daysForAddScope = (scope) => {
    if (scope === 'weekdays') return weekdayValues;
    if (scope === 'weekend') return weekendValues;
    if (scope === 'all_week') return allDayValues;
    return null;
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/schedule');
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const start_time = formData.get('start_time');
    const end_time = formData.get('end_time');
    const durationRaw = formData.get('slot_duration');
    const durationParsed = parseInt(durationRaw, 10);
    const slot_duration =
      Number.isFinite(durationParsed) && durationParsed >= 15 ? durationParsed : 30;
    const is_active = formData.get('is_active') === 'on';

    try {
      if (editingSchedule) {
        const data = {
          day_of_week: formData.get('day_of_week'),
          start_time,
          end_time,
          slot_duration,
          is_active,
        };
        await api.put(`/doctors/schedule/${editingSchedule.schedule_id}`, data);
        toast.success('Schedule updated');
      } else {
        const bulkDays = daysForAddScope(addDayScope);
        if (bulkDays) {
          const results = await Promise.allSettled(
            bulkDays.map((day_of_week) =>
              api.post('/doctors/schedule', {
                day_of_week,
                start_time,
                end_time,
                slot_duration,
                is_active,
              })
            )
          );
          const ok = results.filter((r) => r.status === 'fulfilled').length;
          const fail = results.length - ok;
          if (ok > 0 && fail === 0) {
            toast.success(`Added ${ok} schedule slot${ok === 1 ? '' : 's'}`);
          } else if (ok > 0) {
            toast.success(`Added ${ok} slot(s); ${fail} failed`);
          } else {
            const err = results.find((r) => r.status === 'rejected')?.reason;
            toast.error(err?.response?.data?.message || 'Failed to save schedule');
            return;
          }
        } else {
          const day_of_week = formData.get('day_of_week');
          if (!day_of_week) {
            toast.error('Select a day');
            return;
          }
          await api.post('/doctors/schedule', {
            day_of_week,
            start_time,
            end_time,
            slot_duration,
            is_active,
          });
          toast.success('Schedule added');
        }
      }
      setShowForm(false);
      setEditingSchedule(null);
      setAddDayScope('single');
      loadSchedules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save schedule');
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/doctors/schedule/${scheduleId}`);
      toast.success('Schedule deleted');
      loadSchedules();
    } catch (error) {
      toast.error('Failed to delete schedule');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const daysOfWeek = [
    { value: 'monday', label: 'Monday', cardClass: 'bg-blue-50/80 border-blue-100', slotClass: 'bg-blue-100 border-blue-200' },
    { value: 'tuesday', label: 'Tuesday', cardClass: 'bg-purple-50/80 border-purple-100', slotClass: 'bg-purple-100 border-purple-200' },
    { value: 'wednesday', label: 'Wednesday', cardClass: 'bg-emerald-50/80 border-emerald-100', slotClass: 'bg-emerald-100 border-emerald-200' },
    { value: 'thursday', label: 'Thursday', cardClass: 'bg-amber-50/80 border-amber-100', slotClass: 'bg-amber-100 border-amber-200' },
    { value: 'friday', label: 'Friday', cardClass: 'bg-rose-50/80 border-rose-100', slotClass: 'bg-rose-100 border-rose-200' },
    { value: 'saturday', label: 'Saturday', cardClass: 'bg-violet-50/80 border-violet-100', slotClass: 'bg-violet-100 border-violet-200' },
    { value: 'sunday', label: 'Sunday', cardClass: 'bg-slate-50 border-slate-200', slotClass: 'bg-slate-100 border-slate-200' },
  ];

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell max-w-6xl">

        {/* Weekly Schedule View */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Weekly Schedule</h2>
            </div>
            <Button onClick={() => {
              setEditingSchedule(null);
              setAddDayScope('single');
              setShowForm(true);
            }} className="!rounded-xl !font-medium !bg-slate-900 hover:!bg-slate-800">
              <Plus className="w-4 h-4 inline mr-2" />
              Add Schedule Slot
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map((day) => {
              const daySchedules = schedules.filter((s) => s.day_of_week === day.value && s.is_active);
              return (
                <div key={day.value} className={`rounded-2xl border p-4 ${day.cardClass}`}>
                  <h3 className="font-semibold text-slate-900 capitalize mb-3 text-center text-sm">{day.label}</h3>
                  {daySchedules.length === 0 ? (
                    <div className="text-center py-4">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No slots</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div key={schedule.schedule_id} className={`p-2.5 rounded-xl border text-center ${day.slotClass}`}>
                          <p className="text-xs font-semibold text-slate-900">{schedule.start_time} - {schedule.end_time}</p>
                          <p className="text-[10px] text-slate-600">{schedule.slot_duration} min slots</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule List */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-6 border-b border-slate-200/80">
            <div className="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Filter className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">All Schedule Slots</h2>
          </div>
          {schedules.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Clock}
                title="No schedule slots"
                message="Add schedule slots to set your availability"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.schedule_id} className="hover:bg-slate-50 transition-colors">
                      <td>
                        <span className="font-semibold text-slate-900 capitalize">{schedule.day_of_week}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{schedule.start_time}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{schedule.end_time}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-700">{schedule.slot_duration} min</span>
                      </td>
                      <td>
                        <span className={`badge ${schedule.is_active ? 'badge-success' : 'badge-danger'} flex items-center gap-1 w-fit`}>
                          {schedule.is_active ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                            className="!rounded-xl !px-3 !py-1.5 !border-slate-200 hover:!bg-slate-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(schedule)}
                            className="!rounded-lg !px-3 !py-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingSchedule(null);
            setAddDayScope('single');
          }}
          title={editingSchedule ? 'Edit Schedule Slot' : 'Add Schedule Slot'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {!editingSchedule && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Apply to <span className="text-red-500">*</span>
                </label>
                <select
                  value={addDayScope}
                  onChange={(ev) => setAddDayScope(ev.target.value)}
                  className="input-field !rounded-2xl !py-3 !border-slate-200 focus:!ring-slate-900/10"
                >
                  <option value="single">Single day</option>
                  <option value="weekdays">Weekdays (Mon–Fri)</option>
                  <option value="weekend">Weekend (Sat–Sun)</option>
                  <option value="all_week">Every day (Mon–Sun)</option>
                </select>
                {addDayScope === 'single' && (
                  <p className="mt-2 text-xs text-slate-500">Choose the day below, then set your hours.</p>
                )}
                {addDayScope === 'weekdays' && (
                  <p className="mt-2 text-xs text-slate-500">
                    Same hours for Monday–Friday. Add a separate slot if Saturday or Sunday differ.
                  </p>
                )}
                {addDayScope === 'weekend' && (
                  <p className="mt-2 text-xs text-slate-500">
                    Same hours for Saturday and Sunday.
                  </p>
                )}
                {addDayScope === 'all_week' && (
                  <p className="mt-2 text-xs text-slate-500">
                    Same hours every day of the week.
                  </p>
                )}
              </div>
            )}

            {(editingSchedule || addDayScope === 'single') && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Day of Week <span className="text-red-500">*</span>
                </label>
                <select
                  name="day_of_week"
                  defaultValue={editingSchedule?.day_of_week || ''}
                  className="input-field !rounded-2xl !py-3 !border-slate-200 focus:!ring-slate-900/10"
                  required
                >
                  <option value="">Select day</option>
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                name="start_time"
                defaultValue={editingSchedule?.start_time || ''}
                required
              />
              <Input
                label="End Time"
                type="time"
                name="end_time"
                defaultValue={editingSchedule?.end_time || ''}
                required
              />
            </div>

            <Input
              label="Slot Duration (minutes)"
              type="number"
              name="slot_duration"
              defaultValue={
                editingSchedule != null && editingSchedule.slot_duration != null
                  ? editingSchedule.slot_duration
                  : ''
              }
              placeholder="0"
              min={0}
              step={15}
            />

            <div className="flex items-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editingSchedule?.is_active !== false}
                className="mr-3 w-4 h-4 rounded border-slate-300"
              />
              <label className="text-sm font-medium text-slate-700">Active Schedule</label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1 !rounded-2xl !font-medium !bg-slate-900 hover:!bg-slate-800 !py-3">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                {editingSchedule ? 'Update' : 'Add'} Schedule
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                  setAddDayScope('single');
                }}
                className="!rounded-2xl !font-medium !border-slate-200 hover:!bg-slate-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete schedule slot"
          message={
            deleteTarget
              ? `Are you sure you want to delete this schedule slot on ${deleteTarget.day_of_week}?`
              : ''
          }
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onCancel={() => {
            if (deleteLoading) return;
            setDeleteTarget(null);
          }}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.schedule_id)}
        />
      </div>
    </Layout>
  );
};

export default ScheduleManagement;
