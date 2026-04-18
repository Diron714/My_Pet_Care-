import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { resetPasswordSchema } from '../../utils/validators';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, PawPrint, KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const email = location.state?.email || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch('newPassword');

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { strength, label: labels[strength] };
  };

  const onSubmit = async (data) => {
    if (!email) {
      toast.error('Identity missing.');
      navigate('/forgot-password');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email, data.otpCode, data.newPassword, data.confirmPassword);
      if (result.success) {
        toast.success('Access Restored!');
        navigate('/login');
      } else {
        toast.error(result.message || 'Reset failed');
      }
    } catch (error) {
      toast.error('System error');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      
      {/* Cinematic Background Glows */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] z-0" />
      <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-indigo-600/10 rounded-full blur-[80px] z-0" />
      
      {/* Pet Footprint Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none grid grid-cols-12 gap-8 rotate-12">
        {[...Array(80)].map((_, i) => (
          <PawPrint key={i} className="w-5 h-5 text-white" />
        ))}
      </div>

      {/* ULTRA-COMPACT & LOW HEIGHT CARD */}
      <div className="max-w-[330px] w-full animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[1.75rem] shadow-2xl p-5 lg:p-7 border border-white/20">
          
          <div className="flex items-center gap-3 mb-5 border-b border-slate-50 pb-4">
            <div className="p-2 bg-slate-900 rounded-lg shadow-lg">
              <KeyRound className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Reset Key</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verify: {email.split('@')[0]}...</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
               <div className="col-span-3">
                  <Input
                    label="OTP Code"
                    placeholder="••••••"
                    {...register('otpCode')}
                    error={errors.otpCode?.message}
                    required
                    maxLength={6}
                    className="!rounded-xl !border-slate-100 focus:!border-blue-500 !p-2.5 font-black text-slate-900 bg-slate-50/50 text-center text-sm tracking-[0.4em]"
                  />
               </div>
            </div>

            <div className="space-y-1">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                {...register('newPassword')}
                error={errors.newPassword?.message}
                required
                className="!rounded-xl !border-slate-100 focus:!border-blue-500 !p-2.5 font-semibold text-slate-900 bg-slate-50/50 text-xs"
              />
              {newPassword && (
                <div className="flex gap-0.5 h-1 rounded-full overflow-hidden bg-slate-100 mx-1">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 transition-all duration-500 ${
                        step <= passwordStrength.strength
                          ? passwordStrength.strength <= 2 ? 'bg-rose-500' : passwordStrength.strength <= 3 ? 'bg-amber-400' : 'bg-blue-500'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Confirm"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
              className="!rounded-xl !border-slate-100 focus:!border-blue-500 !p-2.5 font-semibold text-slate-900 bg-slate-50/50 text-xs"
            />

            <Button 
              type="submit" 
              className="w-full !py-3.5 !rounded-xl !bg-slate-900 hover:!bg-blue-600 !text-white !font-black !text-[10px] uppercase !tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group mt-2" 
              loading={loading}
            >
              Update <ArrowRight className="w-3.5 h-3.5 text-blue-400 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
          
          <div className="mt-4 flex justify-center items-center gap-2 opacity-20 border-t border-slate-50 pt-3">
            <ShieldCheck className="w-2.5 h-2.5 text-slate-900" />
            <span className="text-[5px] font-black text-slate-900 uppercase tracking-widest">
              ISO-27001 Global Security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;