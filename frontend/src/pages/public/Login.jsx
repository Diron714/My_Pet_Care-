import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../utils/validators';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { PawPrint, ShieldCheck, Heart, Sparkles, ArrowRight, Globe } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Prevent body scroll so no scrollbar appears on login page
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success && result.user) {
        const role = result.user.role;

        // If this is an admin-created user logging in for the first time,
        // redirect them to the OTP/email verification screen instead of dashboard.
        if (result.mustVerifyEmail) {
          toast.success('Login successful! Please verify your email to continue.');
          setTimeout(() => {
            navigate('/otp-verification', {
              state: {
                email: result.user.email,
                otpType: 'email_verification',
              },
            });
          }, 500);
        } else {
          toast.success('Login successful!');
          setTimeout(() => {
            const r = String(role || '').toLowerCase();
            if (r === 'customer') navigate('/customer/dashboard');
            else if (r === 'doctor') navigate('/doctor/dashboard');
            else if (r === 'admin' || r === 'staff') navigate('/admin/dashboard');
            else navigate('/login');
          }, 500);
        }
      } else {
        const errorMsg = result.message || 'Login failed. Please check your credentials.';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#d0c7b3] via-[#d9d1c0] to-[#c6bda8] px-3 py-8 md:px-10">
      <div className="relative w-full max-w-6xl rounded-[36px] md:rounded-[44px] overflow-hidden bg-white shadow-[0_36px_90px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col md:flex-row md:h-[620px]">
          {/* Left: image panel */}
          <div className="md:w-1/2 bg-[#ece9e4] flex items-center px-4 md:px-6 py-4 md:py-6">
            <div className="w-full h-full rounded-[26px] md:rounded-[30px] overflow-hidden shadow-sm shadow-slate-300">
              <img
                src="/b.jpg"
                alt="Login illustration"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: login form */}
          <div className="md:w-[50%] px-7 md:px-10 py-6 md:py-8 bg-white flex items-center">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  MY PET CARE+
                </p>
                <h1 className="text-[22px] md:text-[24px] font-semibold text-slate-900 mb-1">
                  Login to your account
                </h1>
                <p className="text-[11px] text-slate-500">
                  Welcome back! Enter your details to log in to your account.
                </p>
          </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                    placeholder="Enter your email"
                {...register('email')}
                error={errors.email?.message}
                    className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !text-slate-900 placeholder:!text-slate-400 !px-5 !py-2.5"
                required
              />

              <Input
                label="Password"
                type="password"
                    placeholder="Enter your password"
                {...register('password')}
                error={errors.password?.message}
                    className="!rounded-full !border-slate-200 !bg-slate-50 focus:!border-violet-500 focus:!ring-violet-300/70 !text-slate-900 placeholder:!text-slate-400 !px-5 !py-2.5"
                required
              />
            </div>

                <div className="flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>Remember login</span>
              </label>
              <Link
                to="/forgot-password"
                    className="text-violet-600 hover:text-violet-700 underline underline-offset-2"
              >
                    Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
                  className="w-full !rounded-full !bg-violet-600 hover:!bg-violet-700 !text-white !font-semibold !py-3 shadow-md shadow-violet-300 flex items-center justify-center gap-2 !transition-transform active:!scale-[0.98]"
              loading={loading}
            >
                  Log In
            </Button>
          </form>

              <div className="mt-5 text-center text-[11px] text-slate-500">
                <span>Don&apos;t have an account? </span>
                <Link to="/register" className="font-semibold text-violet-700 hover:text-violet-800">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;