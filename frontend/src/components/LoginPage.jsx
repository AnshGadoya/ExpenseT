import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight, QrCode, Key, Check, ArrowLeft, Smartphone } from 'lucide-react';

export default function LoginPage() {
  const { login, verify2FA, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [stage, setStage] = useState('credentials'); // 'credentials' | '2fa'
  
  // Credentials State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
  });

  // 2FA State
  const [twoFactorData, setTwoFactorData] = useState({
    requires2FA: false,
    isSetupNeeded: false,
    tempToken: '',
    qrCode: '',
    secret: '',
    username: '',
  });

  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register(formData);
      } else {
        const response = await login(formData.username, formData.password);
        if (response?.requires2FA) {
          setTwoFactorData({
            requires2FA: true,
            isSetupNeeded: response.isSetupNeeded,
            tempToken: response.tempToken,
            qrCode: response.qrCode || '',
            secret: response.secret || '',
            username: response.username || formData.username,
          });
          setStage('2fa');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your Authenticator code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await verify2FA(twoFactorData.tempToken, code);
    } catch (err) {
      setError(err.message || 'Invalid 6-digit code. Please check your app and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtpCode(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const copySecret = () => {
    if (twoFactorData.secret) {
      navigator.clipboard.writeText(twoFactorData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fillQuickAdmin = () => {
    setFormData({
      username: 'admin',
      password: 'admin123',
      name: 'Gandhi Infosol Admin',
    });
    setIsRegisterMode(false);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-100 relative overflow-hidden p-4 font-sans">
      {/* Background Animated Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/30 mb-4">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              {stage === '2fa' ? (
                <Smartphone className="w-8 h-8 text-emerald-400" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
              )}
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Gandhi Infosol Finance
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            {stage === '2fa'
              ? '2-Factor Authentication Required'
              : isRegisterMode
              ? 'Create a new account to get started'
              : 'Sign in to access your business tracker'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STAGE 1: Username & Password Form */}
        {stage === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ansh Gadoya"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Create Account' : 'Continue to 2FA'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Quick Admin fill button */}
            {!isRegisterMode && (
              <div className="mt-6 pt-5 border-t border-slate-700/60 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={fillQuickAdmin}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  Quick fill default admin (`admin` / `admin123`)
                </button>
              </div>
            )}

            {/* Mode Toggle Footer */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                }}
                className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
              >
                {isRegisterMode ? (
                  <span>Already have an account? <strong className="text-indigo-400 underline">Sign In</strong></span>
                ) : (
                  <span>Don't have an account? <strong className="text-indigo-400 underline">Create one</strong></span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STAGE 2: 2-Factor Authentication (TOTP Google Authenticator) */}
        {stage === '2fa' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            
            {/* Initial QR Code Setup Guide (If 2FA is not yet configured) */}
            {twoFactorData.isSetupNeeded && (
              <div className="p-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <QrCode className="w-4 h-4" />
                  Scan with Google Authenticator
                </div>

                {/* QR Code Container */}
                {twoFactorData.qrCode && (
                  <div className="p-2 bg-white rounded-xl inline-block shadow-md">
                    <img src={twoFactorData.qrCode} alt="2FA QR Code" className="w-40 h-40 object-contain" />
                  </div>
                )}

                <p className="text-[11px] text-slate-300 leading-relaxed px-2">
                  Open <strong>Google Authenticator</strong> (or Apple Passwords / Authy) on your phone, tap <strong>+</strong>, and scan the QR code above.
                </p>

                {/* Secret Key Fallback */}
                {twoFactorData.secret && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 px-2">
                    <span className="text-[10px] text-slate-400 font-mono truncate">{twoFactorData.secret}</span>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 shrink-0 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy Key'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!twoFactorData.isSetupNeeded && (
              <div className="text-center space-y-1">
                <p className="text-xs font-medium text-slate-300">
                  Enter the live <strong className="text-emerald-400">6-digit code</strong> from your Google Authenticator app for account <strong className="text-white">{twoFactorData.username}</strong>:
                </p>
              </div>
            )}

            {/* 6 Individual OTP Digit Input Boxes */}
            <div>
              <div className="flex justify-between items-center gap-2 max-w-xs mx-auto">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 h-12 text-center text-xl font-bold bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 rounded-xl text-white outline-none transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Verify 2FA & Sign In</span>
                </>
              )}
            </button>

            {/* Back Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStage('credentials');
                  setError('');
                  setOtpCode(['', '', '', '', '', '']);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Username & Password
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
