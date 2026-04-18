import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Clock, Mail, CheckCircle2 } from 'lucide-react';

const OTPVerification = () => {
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);

  const email = location.state?.email || '';
  const otpType = location.state?.otpType || 'email_verification';

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    pasted.forEach((digit, i) => { newOtp[i] = digit; });
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(email, otpCode, otpType);
      if (result.success) {
        toast.success('Email verified successfully!');
        navigate('/login');
      } else {
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // Resend OTP logic
    toast.success('OTP resent to your email');
    setTimer(600);
    setCanResend(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-10 px-6 relative overflow-hidden">
      {/* Cinematic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[420px] h-[420px] bg-primary-500/10 rounded-full blur-[110px] z-0" />

      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl p-8 lg:p-10 border border-white/20">
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center justify-center rounded-2xl bg-slate-900 p-3.5 shadow-xl shadow-emerald-900/30">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Verify Device
              </h2>
              <p className="mt-1 text-[13px] text-slate-500 font-medium leading-relaxed">
                Enter the 6‑digit security code sent to{' '}
                <span className="font-semibold text-slate-800">{email}</span>.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-semibold text-slate-500">
              <Mail className="w-3.5 h-3.5" />
              <span>Secure email verification in progress</span>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-11 h-12 rounded-2xl border-2 border-slate-300 bg-white text-center text-lg font-black tracking-[0.2em] text-slate-900 placeholder:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white outline-none transition-all shadow-sm"
              />
            ))}
          </div>

          <div className="flex items-center justify-between mb-5 text-xs text-slate-500">
            <div className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              {timer > 0 ? (
                <span className="font-semibold">
                  Code expires in <span className="text-slate-900">{formatTime(timer)}</span>
                </span>
              ) : (
                <span className="font-semibold text-rose-500">Code expired</span>
              )}
            </div>
            <button
              onClick={handleResend}
              disabled={!canResend}
              className="text-[11px] font-bold uppercase tracking-[0.18em] disabled:text-slate-300 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Resend Code
            </button>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.3em] py-4 shadow-2xl shadow-emerald-900/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Confirm Access'}
            {!loading && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <p className="mt-5 text-center text-[11px] text-slate-500 leading-relaxed">
            Didn&apos;t receive the code? Please check your spam folder or try{' '}
            <button
              onClick={handleResend}
              disabled={!canResend}
              className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-300"
            >
              resending
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;

