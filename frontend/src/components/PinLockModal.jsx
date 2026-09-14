import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  X, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api';

export default function PinLockModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('verify'); // 'verify' | 'setup'
  const [hasPin, setHasPin] = useState(null);
  const [checkingPin, setCheckingPin] = useState(true);

  // Verification state
  const [pin, setPin] = useState(['', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Setup / Reset state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');
  const [isSubmittingSetup, setIsSubmittingSetup] = useState(false);

  const inputRefs = useRef([]);
  const setupNewPinRefs = useRef([]);
  const setupConfirmPinRefs = useRef([]);

  // Check PIN status when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCheckingPin(true);
    setVerifyError('');
    setSetupError('');
    setSetupSuccess('');
    setPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setPassword('');

    api.getPinStatus()
      .then((res) => {
        if (!isMounted) return;
        setHasPin(res.hasPin);
        if (!res.hasPin) {
          setMode('setup');
        } else {
          setMode('verify');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setVerifyError('Failed to check PIN status');
      })
      .finally(() => {
        if (isMounted) setCheckingPin(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Focus first PIN input when in verify mode
  useEffect(() => {
    if (isOpen && mode === 'verify' && !checkingPin) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, mode, checkingPin]);

  // Handle Verify PIN input
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPins = [...pin];
    newPins[index] = value.slice(-1);
    setPin(newPins);
    setVerifyError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 4 digits are entered, automatically verify
    const enteredPin = newPins.join('');
    if (enteredPin.length === 4 && newPins.every((d) => d !== '')) {
      triggerVerify(enteredPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerVerify = async (pinValue) => {
    setIsVerifying(true);
    setVerifyError('');

    try {
      await api.verifyPin(pinValue);
      onSuccess?.();
      onClose();
    } catch (err) {
      setIsShaking(true);
      setVerifyError(err.message || 'Incorrect PIN');
      setPin(['', '', '', '']);
      setTimeout(() => {
        setIsShaking(false);
        inputRefs.current[0]?.focus();
      }, 400);
    } finally {
      setIsVerifying(false);
    }
  };

  // Setup / Reset PIN handlers
  const handleSetupNewPinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const nextPins = [...newPin];
    nextPins[index] = value.slice(-1);
    setNewPin(nextPins);
    setSetupError('');
    if (value && index < 3) {
      setupNewPinRefs.current[index + 1]?.focus();
    } else if (value && index === 3) {
      setupConfirmPinRefs.current[0]?.focus();
    }
  };

  const handleSetupConfirmPinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const nextPins = [...confirmPin];
    nextPins[index] = value.slice(-1);
    setConfirmPin(nextPins);
    setSetupError('');
    if (value && index < 3) {
      setupConfirmPinRefs.current[index + 1]?.focus();
    }
  };

  const handleSavePin = async (e) => {
    e?.preventDefault();
    setSetupError('');
    setSetupSuccess('');

    const newPinStr = newPin.join('');
    const confirmPinStr = confirmPin.join('');

    if (!password) {
      setSetupError('Please enter your account password to authenticate.');
      return;
    }

    if (newPinStr.length !== 4) {
      setSetupError('New PIN must be exactly 4 digits.');
      return;
    }

    if (newPinStr !== confirmPinStr) {
      setSetupError('Confirmation PIN does not match.');
      return;
    }

    setIsSubmittingSetup(true);

    try {
      await api.setPin({ pin: newPinStr, password });
      setSetupSuccess('PIN successfully set! You can now unlock filters.');
      setHasPin(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (err) {
      setSetupError(err.message || 'Failed to update PIN');
    } finally {
      setIsSubmittingSetup(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transition-all ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {mode === 'verify' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {mode === 'verify' ? 'Unlock Historical Filters' : hasPin ? 'Change 4-Digit PIN' : 'Create 4-Digit Security PIN'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'verify' ? 'Enter your 4-digit PIN to access extended date ranges' : 'Secured by account password verification'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {checkingPin ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Checking security status...</p>
            </div>
          ) : mode === 'verify' ? (
            /* VERIFY PIN MODE */
            <div className="space-y-6">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  <ShieldCheck className="w-3.5 h-3.5" /> 4-Digit PIN Required
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Please enter your 4-digit security PIN to view Last Month, This Year, All Time & Custom filters.
                </p>
              </div>

              {/* 4 Pin Input Boxes */}
              <div className="flex justify-center gap-3">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-13 h-14 text-center text-2xl font-black rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                ))}
              </div>

              {verifyError && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying PIN...</span>
                </div>
              )}

              {/* Action buttons / switch to reset */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode('setup');
                    setVerifyError('');
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {hasPin ? 'Forgot or Change PIN?' : 'Set up a new PIN'}
                </button>
              </div>
            </div>
          ) : (
            /* SETUP / RESET PIN MODE */
            <form onSubmit={handleSavePin} className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  For security, enter your <strong>current login account password</strong> to create or update your 4-digit PIN.
                </span>
              </div>

              {/* Current Account Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSetupError('');
                    }}
                    placeholder="Enter your login password"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 pr-10 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New 4-digit PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New 4-Digit PIN
                </label>
                <div className="flex justify-between gap-2.5">
                  {newPin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (setupNewPinRefs.current[idx] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleSetupNewPinChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !newPin[idx] && idx > 0) {
                          setupNewPinRefs.current[idx - 1]?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-black rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  ))}
                </div>
              </div>

              {/* Confirm 4-digit PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm 4-Digit PIN
                </label>
                <div className="flex justify-between gap-2.5">
                  {confirmPin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (setupConfirmPinRefs.current[idx] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleSetupConfirmPinChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !confirmPin[idx] && idx > 0) {
                          setupConfirmPinRefs.current[idx - 1]?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-black rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  ))}
                </div>
              </div>

              {setupError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              {setupSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{setupSuccess}</span>
                </div>
              )}

              {/* Submit & Back buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                {hasPin && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('verify');
                      setSetupError('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Back to PIN Entry
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingSetup}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm hover:shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingSetup ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving PIN...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Activate PIN</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
