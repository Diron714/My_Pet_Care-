import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { registerSchema } from '../../utils/validators';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  UserPlus, 
  ArrowRight, 
  Globe, 
  CheckCircle2
} from 'lucide-react';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

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
    setLoading(true);
    try {
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'customer',
      });

      if (result.success) {
        toast.success('Registration successful! Please verify your email.');
        navigate('/otp-verification', { state: { email: data.email, otpType: 'email_verification' } });
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#d0c7b3] via-[#d9d1c0] to-[#c6bda8] px-3 py-8 md:px-10">
      <div className="relative w-full max-w-6xl rounded-[36px] md:rounded-[44px] overflow-hidden bg-white shadow-[0_36px_90px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col md:flex-row md:h-[680px]">
          {/* Left: image / illustration panel (reuse login style) */}
          <div className="md:w-1/2 bg-[#ece9e4] flex items-center px-4 md:px-6 py-4 md:py-6">
            <div className="w-full h-full rounded-[26px] md:rounded-[30px] overflow-hidden shadow-sm shadow-slate-300">
              <img
                src="/c.jpg"
                alt="Register illustration"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: registration form */}
          <div className="md:w-[50%] px-7 md:px-10 py-6 md:py-8 bg-white flex items-center">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  MY PET CARE+
                </p>
                <h1 className="text-[22px] md:text-[24px] font-semibold text-slate-900 mb-1">
                  Create your account
                </h1>
                <p className="text-[11px] text-slate-500">
                  Join My Pet Care+ to manage your pets, appointments, and health records.
                </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                {...register('firstName')}
                error={errors.firstName?.message}
                className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !px-5 !py-2.5 font-medium text-slate-900"
                required
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                {...register('lastName')}
                error={errors.lastName?.message}
                className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !px-5 !py-2.5 font-medium text-slate-900"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              error={errors.email?.message}
              className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !px-5 !py-2.5 font-medium text-slate-900"
              required
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+94 7X XXX XXXX"
              {...register('phone')}
              error={errors.phone?.message}
              className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !px-5 !py-2.5 font-medium text-slate-900"
              required
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !px-5 !py-2.5 font-medium text-slate-900"
                required
              />
              {password && (
                <div className="px-1 pt-1">
                  <div className="flex gap-1 h-1 rounded-full overflow-hidden bg-slate-200">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 transition-all duration-700 ${
                          step <= passwordStrength.strength
                            ? passwordStrength.strength <= 2 ? 'bg-rose-500' : passwordStrength.strength <= 3 ? 'bg-amber-400' : 'bg-blue-500'
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase mt-2 block tracking-widest">{passwordStrength.label} Security Level</span>
                </div>
              )}
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !px-5 !py-2.5 font-medium text-slate-900"
              required
            />

            <Button 
              type="submit" 
              className="w-full !rounded-full !bg-violet-600 hover:!bg-violet-700 !text-white !font-semibold !py-3 shadow-md shadow-violet-300 flex items-center justify-center gap-2 !transition-transform active:!scale-[0.98]" 
              loading={loading}
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

              <div className="mt-5 text-center text-[11px] text-slate-500">
                <span>Already have an account? </span>
                <Link to="/login" className="font-semibold text-violet-700 hover:text-violet-800">
                  Log in
              </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;