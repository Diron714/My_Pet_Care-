import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { petProfileSchema } from '../../utils/validators';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, PawPrint, User, Calendar, Syringe, Utensils, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const PetProfileForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [vaccinations, setVaccinations] = useState([]);
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showFeedingForm, setShowFeedingForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [vaccinationForm, setVaccinationForm] = useState({
    vaccine_name: '',
    vaccination_date: '',
    next_due_date: '',
    notes: '',
  });
  const [feedingForm, setFeedingForm] = useState({
    food_type: '',
    feeding_time: '',
    quantity: '',
    notes: '',
  });
  const [savingVaccination, setSavingVaccination] = useState(false);
  const [savingFeeding, setSavingFeeding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(petProfileSchema),
  });

  useEffect(() => {
    if (isEdit) {
      loadPetData();
    }
  }, [id]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      const [petRes, vaccinationsRes, schedulesRes] = await Promise.all([
        api.get(`/customer-pets/${id}`),
        api.get(`/customer-pets/${id}/vaccinations`),
        api.get(`/customer-pets/${id}/feeding-schedules`),
      ]);

      const pet = petRes.data.data;
      if (pet) {
        setValue('name', pet.name);
        setValue('species', pet.species);
        setValue('breed', pet.breed);
        setValue('age', pet.age);
        setValue('gender', pet.gender);
        if (pet.image_url) {
          // Use full URL for display so the image loads from the API origin (backend)
          const displayUrl = pet.image_url.startsWith('data:') || pet.image_url.startsWith('http')
            ? pet.image_url
            : getImageSrc(pet.image_url);
          setImagePreview(displayUrl);
          setImageDataUrl(pet.image_url);
        }
      }

      setVaccinations(vaccinationsRes.data.data || []);
      setFeedingSchedules(schedulesRes.data.data || []);
    } catch (error) {
      console.error('Error loading pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const url = isEdit ? `/customer-pets/${id}` : '/customer-pets';
      const method = isEdit ? 'put' : 'post';
      const payload = {
        ...data,
        // Include image data URL if present so backend can persist it as image_url
        image_url: imageDataUrl || undefined,
      };
      const response = await api[method](url, payload);

      if (response.data.success) {
        toast.success(isEdit ? 'Pet profile updated' : 'Pet profile created');
        navigate('/customer/pet-profiles');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save pet profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      setImagePreview(result);
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddVaccination = async () => {
    if (!isEdit || !id) {
      toast.error('Save the pet profile before adding vaccinations.');
      return;
    }
    setSavingVaccination(true);
    try {
      await api.post(`/customer-pets/${id}/vaccinations`, vaccinationForm);
      toast.success('Vaccination added');
      setShowVaccinationForm(false);
      setVaccinationForm({
        vaccine_name: '',
        vaccination_date: '',
        next_due_date: '',
        notes: '',
      });
      await loadPetData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add vaccination');
    } finally {
      setSavingVaccination(false);
    }
  };

  const handleAddFeedingSchedule = async () => {
    if (!isEdit || !id) {
      toast.error('Save the pet profile before adding feeding schedules.');
      return;
    }
    setSavingFeeding(true);
    try {
      await api.post(`/customer-pets/${id}/feeding-schedules`, feedingForm);
      toast.success('Feeding schedule added');
      setShowFeedingForm(false);
      setFeedingForm({
        food_type: '',
        feeding_time: '',
        quantity: '',
        notes: '',
      });
      await loadPetData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add feeding schedule');
    } finally {
      setSavingFeeding(false);
    }
  };

  if (loading && isEdit) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {isEdit ? 'Edit Pet Profile' : 'Add New Pet Profile'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit ? 'Update your pet\'s care details' : 'Register your pet and manage records'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <PawPrint className="w-5 h-5 text-slate-600" />
              <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
            </div>
            <div className="space-y-4">
              <Input
                label="Pet Name"
                {...register('name')}
                error={errors.name?.message}
                required
                placeholder="Enter your pet's name"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Species <span className="text-red-500">*</span>
                  </label>
                  <select {...register('species')} className="input-field">
                    <option value="">Select species</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.species && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.species.message}
                    </p>
                  )}
                </div>
                <Input
                  label="Breed"
                  {...register('breed')}
                  error={errors.breed?.message}
                  required
                  placeholder="e.g., Golden Retriever"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age (months)"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  error={errors.age?.message}
                  required
                  placeholder="Age in months"
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select {...register('gender')} className="input-field">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Upload className="w-4 h-4 inline mr-1" />
                  Pet Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Upload a photo of your pet (optional). Supported formats: JPG, PNG.
                </p>
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Preview</p>
                    <div className="h-32 w-32 rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={imagePreview}
                        alt="Pet preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vaccination Details */}
          {isEdit && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-slate-600" />
                  <h2 className="text-xl font-bold text-slate-900">Vaccination Details</h2>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowVaccinationForm(true)}
                  className="!bg-slate-800 hover:!bg-slate-900"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Vaccination
                </Button>
              </div>
              {vaccinations.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <Syringe className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">No vaccinations recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vaccinations.map((vaccination) => (
                    <div key={vaccination.vaccination_id} className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-blue-900">{vaccination.vaccine_name}</p>
                        <p className="text-sm text-blue-700">
                          Date: {vaccination.vaccination_date}
                          {vaccination.next_due_date && ` | Next: ${vaccination.next_due_date}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Delete vaccination
                        }}
                        className="text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feeding Schedules */}
          {isEdit && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-slate-600" />
                  <h2 className="text-xl font-bold text-slate-900">Feeding Schedules</h2>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowFeedingForm(true)}
                  className="!bg-slate-800 hover:!bg-slate-900"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Schedule
                </Button>
              </div>
              {feedingSchedules.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <Utensils className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">No feeding schedules set</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedingSchedules.map((schedule) => (
                    <div key={schedule.schedule_id} className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-emerald-900">{schedule.food_type}</p>
                        <p className="text-sm text-emerald-700">
                          Time: {schedule.feeding_time} | Quantity: {schedule.quantity}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Delete schedule
                        }}
                        className="text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4">
            <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900" loading={loading}>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              {isEdit ? 'Update' : 'Create'} Pet Profile
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customer/pet-profiles')}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Add Vaccination Modal */}
        {showVaccinationForm && (
          <Modal
            isOpen={showVaccinationForm}
            onClose={() => setShowVaccinationForm(false)}
            title="Add Vaccination"
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddVaccination();
              }}
              className="space-y-4"
            >
              <Input
                label="Vaccine Name"
                value={vaccinationForm.vaccine_name}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccine_name: e.target.value })}
                required
                placeholder="e.g., Rabies, DHLPP"
              />
              <Input
                label="Vaccination Date"
                type="date"
                value={vaccinationForm.vaccination_date}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, vaccination_date: e.target.value })}
                required
              />
              <Input
                label="Next Due Date (optional)"
                type="date"
                value={vaccinationForm.next_due_date}
                onChange={(e) => setVaccinationForm({ ...vaccinationForm, next_due_date: e.target.value })}
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  value={vaccinationForm.notes}
                  onChange={(e) => setVaccinationForm({ ...vaccinationForm, notes: e.target.value })}
                  placeholder="Additional details about this vaccination"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900" loading={savingVaccination}>
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Save Vaccination
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowVaccinationForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Add Feeding Schedule Modal */}
        {showFeedingForm && (
          <Modal
            isOpen={showFeedingForm}
            onClose={() => setShowFeedingForm(false)}
            title="Add Feeding Schedule"
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddFeedingSchedule();
              }}
              className="space-y-4"
            >
              <Input
                label="Food Type"
                value={feedingForm.food_type}
                onChange={(e) => setFeedingForm({ ...feedingForm, food_type: e.target.value })}
                required
                placeholder="e.g., Dry food, Wet food"
              />
              <Input
                label="Feeding Time"
                type="time"
                value={feedingForm.feeding_time}
                onChange={(e) => setFeedingForm({ ...feedingForm, feeding_time: e.target.value })}
                required
              />
              <Input
                label="Quantity (optional)"
                value={feedingForm.quantity}
                onChange={(e) => setFeedingForm({ ...feedingForm, quantity: e.target.value })}
                placeholder="e.g., 1 cup"
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  value={feedingForm.notes}
                  onChange={(e) => setFeedingForm({ ...feedingForm, notes: e.target.value })}
                  placeholder="Additional details about this feeding schedule"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 !bg-slate-800 hover:!bg-slate-900" loading={savingFeeding}>
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Save Schedule
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFeedingForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default PetProfileForm;
