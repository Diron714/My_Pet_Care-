import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { forgotPasswordSchema } from '../../utils/validators';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, ArrowRight, Lock, PawPrint } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await forgotPassword(data.email);
      if (result.success) {
        toast.success('Security OTP transmitted');
        navigate('/reset-password', { state: { email: data.email } });
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-10 px-6 relative overflow-hidden">
      
      {/* Cinematic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] z-0" />
      
      {/* Pet Footprint Pattern Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none grid grid-cols-8 gap-16 rotate-12 scale-125">
        {[...Array(40)].map((_, i) => (
          <PawPrint key={i} className="w-8 h-8 text-white" />
        ))}
      </div>

      {/* COMPACT CARD - Reduced from max-w-md to max-w-sm */}
      <div className="max-w-sm w-full animate-in fade-in zoom-in-95 duration-700 relative z-10">
        
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 lg:p-10 border border-white/20">
          
          <div className="text-center mb-8">
            <div className="inline-block p-3.5 bg-slate-900 rounded-2xl mb-5 shadow-xl shadow-blue-900/20">
              <Lock className="w-7 h-7 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Reset Key</h2>
            <p className="text-slate-500 text-[13px] font-medium leading-relaxed px-2">
              Transmit a unique security code to your verified identity.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative group">
              <Input
                label="Email Identity"
                type="email"
                placeholder="identity@global-standard.com"
                {...register('email')}
                error={errors.email?.message}
                className="!rounded-2xl !border-slate-100 focus:!border-blue-500 !p-4 font-semibold text-slate-900 transition-all bg-slate-50/50 focus:bg-white shadow-sm text-sm"
                required
              />
              <Mail className="absolute right-4 top-[48px] w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            </div>

            <Button 
              type="submit" 
              className="w-full !py-5 !rounded-2xl !bg-slate-900 hover:!bg-blue-600 !text-white !font-black !text-sm uppercase !tracking-[0.3em] !shadow-2xl !shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group" 
              loading={loading}
            >
              Send OTP <ArrowRight className="w-5 h-5 text-blue-400 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <Link to="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-all font-black text-xs uppercase tracking-widest group">
              Login Gateway
              <PawPrint className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          
          <div className="mt-6 flex justify-center items-center gap-2 opacity-30 grayscale">
            <ShieldCheck className="w-3 h-3 text-slate-900" />
            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">
              ISO 27001 Security Standard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;