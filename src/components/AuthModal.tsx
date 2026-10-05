import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, KeyRound, Phone, User as UserIcon, AlertCircle, ArrowRight, Sparkles, Bot } from 'lucide-react';
import { apiRequest, saveSession } from '../utils/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [firstName, setFirstName] = useState('Ali');
  const [lastName, setLastName] = useState('Valiyev');
  const [phone, setPhone] = useState('+998901234567');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [botUsername, setBotUsername] = useState('TestPlatformBot');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setErrorMsg("Barcha maydonlarni to'ldiring.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiRequest('/api/auth/student-request-code', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, phone })
      });

      setDemoCode(res.demoCode || '');
      if (res.botUsername) setBotUsername(res.botUsername);
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || "Kod so'rashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 6) {
      setErrorMsg("6 xonali tasdiqlash kodini to'liq kiriting.");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiRequest('/api/auth/student-verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code })
      });

      setSuccessMsg("Telegram tasdiqlandi!");
      saveSession(res.user, res.token);
      setTimeout(() => {
        onSuccess(res.user);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Kod noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: 'student' | 'teacher' | 'admin', phonePreset?: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiRequest('/api/auth/quick-login', {
        method: 'POST',
        body: JSON.stringify({ role, phone: phonePreset })
      });
      saveSession(res.user, res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Kirishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-indigo-300" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            TestPlatformasi Kirish
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Telefon raqam va Telegram orqali xavfsiz tasdiqlash
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ismingiz
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Masalan: Ali"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Familiyangiz
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Masalan: Valiyev"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefon raqamingiz (+998 formatida)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Faqat O'zbekiston (+998) raqamlari qabul qilinadi
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>{loading ? "Kod yuborilmoqda..." : "Kod olish (Telegram)"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* OTP VERIFICATION STEP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Bot className="w-4 h-4 text-blue-600" />
                  <span>Telegram orqali tasdiqlash</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Telegramda <strong className="text-blue-950">@{botUsername}</strong> botiga kiring va <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">/start</code> buyrug'ini bering.
                </p>
                {demoCode && (
                  <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                    <span className="text-blue-700">Yaratilgan sinov kodi:</span>
                    <button
                      type="button"
                      onClick={() => setCode(demoCode)}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded font-mono font-bold hover:bg-blue-700 transition-colors"
                    >
                      {demoCode} (Nusxalash)
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6 xonali tasdiqlash kodi
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="482731"
                    className="w-full pl-9 pr-3 py-2 text-center text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>{loading ? "Tekshirilmoqda..." : "Tasdiqlash & Kirish"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                ← Raqamni o'zgartirish
              </button>
            </form>
          )}

          {/* QUICK ROLES FOR TESTING */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tezkor sinov (Demo rollar bilan kirish):</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('student', '+998901234567')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 text-center transition-all"
              >
                O'quvchi (Ali)
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('teacher', '+998902223344')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 text-center transition-all"
              >
                O'qituvchi
              </button>
              <button
                type="button"
                onClick={() => handleQuickRole('admin', '+998901112233')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 text-center transition-all"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
