import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { ArrowLeft, PawPrint, Calendar, FileText, Pill, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const HealthRecordForm = () => {
  const { id } = useParams(); // optional record id for edit (future)
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_pet_id: '',
    appointment_id: '',
    diagnosis: '',
    prescription: '',
    treatment_notes: '',
    record_date: new Date().toISOString().split('T')[0],
  });
  const [pets, setPets] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadDoctorPets();
      if (cancelled) return;
      if (isEditMode) {
        await loadExistingRecord();
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const loadDoctorPets = async () => {
    try {
      // Appointments API returns flat fields: customer_pet_id, pet_name, species, breed
      const res = await api.get('/appointments');
      const appts = res.data.data || [];
      const uniquePetsMap = {};
      appts.forEach((a) => {
        if (a.customer_pet_id) {
          uniquePetsMap[a.customer_pet_id] = {
            customer_pet_id: a.customer_pet_id,
            name: a.pet_name,
            species: a.species,
            breed: a.breed,
          };
        }
      });
      setPets(Object.values(uniquePetsMap));
    } catch (error) {
      console.error('Error loading pets for health records:', error);
    }
  };

  const loadExistingRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/health-records/${id}`);
      const data = res.data.data;
      setForm({
        customer_pet_id: data.customer_pet_id,
        appointment_id: data.appointment_id || '',
        diagnosis: data.diagnosis || '',
        prescription: data.prescription || '',
        treatment_notes: data.treatment_notes || '',
        record_date: data.record_date ? String(data.record_date).slice(0, 10) : new Date().toISOString().split('T')[0],
      });
      // Ensure current record's pet is in the dropdown (may not be in appointments list)
      setPets((prev) => {
        const has = prev.some((p) => p.customer_pet_id === data.customer_pet_id);
        if (has) return prev;
        const pet = data.customer_pet || {};
        return [...prev, { customer_pet_id: data.customer_pet_id, name: pet.name || 'Pet', species: pet.species || '', breed: pet.breed || '' }];
      });
    } catch (error) {
      console.error('Error loading health record:', error);
      toast.error('Failed to load health record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_pet_id) {
      toast.error('Please select a pet');
      return;
    }

    if (!form.diagnosis && !form.prescription) {
      toast.error('Diagnosis or prescription is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        appointment_id: form.appointment_id || null,
        customer_pet_id: Number(form.customer_pet_id),
        diagnosis: form.diagnosis,
        prescription: form.prescription,
        treatment_notes: form.treatment_notes,
        record_date: form.record_date,
      };

      if (isEditMode) {
        await api.put(`/health-records/${id}`, payload);
        toast.success('Health record updated successfully');
      } else {
        await api.post('/health-records', payload);
        toast.success('Health record created successfully');
      }
      navigate('/doctor/health-records');
    } catch (error) {
      console.error('Error saving health record:', error);
      toast.error(error.response?.data?.message || 'Failed to save health record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell max-w-4xl">
        <div className="flex items-center gap-5 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20 text-white">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate('/doctor/health-records')}
                className="text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                Health Records
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isEditMode ? 'Edit' : 'New'}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {isEditMode ? 'Edit Record' : 'Create Record'}
            </h1>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-8 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <PawPrint className="w-4 h-4 inline mr-1" />
                  Pet
                </label>
                <select
                  value={form.customer_pet_id}
                  onChange={(e) => handleChange('customer_pet_id', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select pet</option>
                  {pets.map((pet) => (
                    <option key={pet.customer_pet_id} value={pet.customer_pet_id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Record Date
                </label>
                <input
                  type="date"
                  value={form.record_date}
                  onChange={(e) => handleChange('record_date', e.target.value)}
                  className="input-field !rounded-2xl !border-slate-200 focus:!ring-slate-900/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Diagnosis
              </label>
              <textarea
                value={form.diagnosis}
                onChange={(e) => handleChange('diagnosis', e.target.value)}
                rows={4}
                className="input-field !rounded-xl !py-3"
                placeholder="Enter diagnosis details..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Pill className="w-4 h-4 inline mr-1" />
                Prescription
              </label>
              <textarea
                value={form.prescription}
                onChange={(e) => handleChange('prescription', e.target.value)}
                rows={4}
                className="input-field !rounded-2xl !py-3 !border-slate-200 focus:!ring-slate-900/10"
                placeholder="Enter prescription details..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Treatment Notes
              </label>
              <textarea
                value={form.treatment_notes}
                onChange={(e) => handleChange('treatment_notes', e.target.value)}
                rows={4}
                className="input-field !rounded-xl !py-3"
                placeholder="Internal notes and follow-up guidance..."
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full !rounded-2xl !font-medium !bg-slate-900 hover:!bg-slate-800 !py-3"
                loading={saving}
                disabled={saving}
              >
                {isEditMode ? 'Save Changes' : 'Create Record'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default HealthRecordForm;

