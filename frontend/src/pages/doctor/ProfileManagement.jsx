import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import { User, Edit, Save, X, Stethoscope, GraduationCap, Briefcase, DollarSign, Star, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Format currency as LKR
const formatCurrencyLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount || 0);
};

const ProfileManagement = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/profile');
      const data = response.data.data;
      setProfile(data);
      if (data) {
        setValue('specialization', data.specialization);
        setValue('qualifications', data.qualifications);
        setValue('experience_years', data.experience_years);
        setValue('consultation_fee', data.consultation_fee);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImageDataUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = { ...data };
      if (imageDataUrl) payload.image_url = imageDataUrl;
      const response = await api.put('/doctors/profile', payload);
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setEditMode(false);
        setImageDataUrl(null);
        loadProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!profile) return <Layout><div className="text-center py-12">Profile not found</div></Layout>;

  return (
    <Layout>
      <div className="page-shell max-w-4xl">

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Header */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-8">
            <div className="flex items-center gap-6">
              {(imageDataUrl || profile.image_url) ? (
                <div className="h-32 w-32 rounded-3xl overflow-hidden border-2 border-slate-200/80 shadow-sm">
                  <img
                    src={imageDataUrl || getImageSrc(profile.image_url)}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
              ) : (
                <div className="h-32 w-32 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <User className="w-16 h-16 text-slate-500" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Dr. Profile</h2>
                {profile.rating != null && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(profile.rating || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-slate-700">
                      {Number(profile.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-slate-500">({profile.total_reviews || 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-slate-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Profile Information</h2>
              </div>
              {!editMode && (
                <Button onClick={() => setEditMode(true)} className="!rounded-xl !font-medium !bg-slate-900 hover:!bg-slate-800">
                  <Edit className="w-4 h-4 inline mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
            {editMode ? (
              <div className="space-y-4">
                <Input
                  label="Specialization"
                  {...register('specialization', { required: 'Specialization is required' })}
                  error={errors.specialization?.message}
                  required
                  placeholder="e.g., Veterinary Medicine"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Qualifications <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('qualifications', { required: 'Qualifications are required' })}
                    rows={4}
                    className="input-field !rounded-2xl !py-3 !border-slate-200 focus:!ring-slate-900/10"
                    placeholder="Enter your educational qualifications..."
                  />
                  {errors.qualifications && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.qualifications.message}
                    </p>
                  )}
                </div>
                <Input
                  label="Experience (Years)"
                  type="number"
                  {...register('experience_years', {
                    required: 'Experience is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Experience cannot be negative' },
                  })}
                  error={errors.experience_years?.message}
                  required
                  placeholder="Years of experience"
                />
                <Input
                  label="Consultation Fee (LKR)"
                  type="number"
                  step="0.01"
                  {...register('consultation_fee', {
                    required: 'Consultation fee is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Fee cannot be negative' },
                  })}
                  error={errors.consultation_fee?.message}
                  required
                  placeholder="Consultation fee in LKR"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Profile Image
                  </label>
                  <input type="file" accept="image/*" className="input-field !rounded-2xl !py-3 !border-slate-200 focus:!ring-slate-900/10" onChange={handleImageChange} />
                  <p className="text-xs text-slate-500 mt-1">Upload a professional profile photo (optional)</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1 !rounded-2xl !font-medium !bg-slate-900 hover:!bg-slate-800 !py-3" loading={saving}>
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      loadProfile();
                    }}
                    className="!rounded-2xl !font-medium !border-slate-200 hover:!bg-slate-50"
                  >
                    <X className="w-4 h-4 inline mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Specialization</p>
                  </div>
                  <p className="font-semibold text-slate-900 text-lg">{profile.specialization}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</p>
                  </div>
                  <p className="font-semibold text-slate-900 text-lg">{profile.experience_years} years</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Consultation Fee</p>
                  </div>
                  <p className="font-semibold text-slate-900 text-lg">
                    {formatCurrencyLKR(profile.consultation_fee)}
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</p>
                  </div>
                  <p className="font-semibold text-slate-900 text-lg">
                    {profile.rating != null ? Number(profile.rating).toFixed(1) : '0.0'} ({profile.total_reviews || 0} reviews)
                  </p>
                </div>
                <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Qualifications</p>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{profile.qualifications || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProfileManagement;
