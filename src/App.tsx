import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  HelpCircle,
  Sparkles,
  Wifi,
  WifiOff,
  SwitchCamera
} from 'lucide-react';
import { getStoredSession, clearSession } from './utils/api';
import { User } from './types';
import { AuthModal } from './components/AuthModal';
import { StudentView } from './components/StudentView';
import { StudentTestScreen } from './components/StudentTestScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminPanel } from './components/AdminPanel';
import { GuideModal } from './components/GuideModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkToast, setNetworkToast] = useState<string | null>(null);

  // Load stored 30-day session on launch
  useEffect(() => {
    const session = getStoredSession();
    if (session && session.user) {
      setUser(session.user);
    } else {
      setShowAuthModal(true);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setNetworkToast("Internet qayta ulandi. Ma'lumotlar sinxronlashtirilmoqda.");
      setTimeout(() => setNetworkToast(null), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkToast("Internet aloqasi uzildi. Javoblaringiz qurilmada saqlanmoqda.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setActiveTestId(null);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (loggedUser: User) => {
    setUser(loggedUser);
    setShowAuthModal(false);
    setActiveTestId(null);
  };

  // If a student is taking an active test, render full-screen dedicated test runner
  if (user && activeTestId) {
    return (
      <StudentTestScreen
        testId={activeTestId}
        studentId={user.id}
        onExit={() => setActiveTestId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Network offline/online toast */}
      {networkToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 ${
          isOnline ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-bounce'
        }`}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{networkToast}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark (Display font, Zone 1) */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              TP
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                TestPlatformasi
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2 font-medium">
                Onlayn Test & Baholash
              </span>
            </div>
          </div>

          {/* User Status & Actions (Zone 3) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Role badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.firstName} {user.lastName}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : user.role === 'teacher'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'O\'qituvchi' : 'O\'quvchi'}
                  </span>
                </div>

                {/* Guide button */}
                <button
                  onClick={() => setGuideOpen(true)}
                  title="Qo'llanma"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                {/* Switch Account */}
                <button
                  onClick={() => setShowAuthModal(true)}
                  title="Boshqa profilga o'tish"
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  title="Tizimdan chiqish"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Kirish (Telegram)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BODY CONTENT BY ROLE */}
      <main className="flex-1">
        {user ? (
          user.role === 'admin' ? (
            <AdminPanel user={user} />
          ) : user.role === 'teacher' ? (
            <TeacherDashboard user={user} />
          ) : (
            <StudentView
              user={user}
              onStartTest={(testId) => setActiveTestId(testId)}
            />
          )
        ) : (
          <div className="py-24 text-center px-4 space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Test Platformasiga xush kelibsiz
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Testlarni topshirish yoki guruhlarni boshqarish uchun tizimga kiring.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Kirish oynasini ochish</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 TestPlatformasi · Barcha huquqlar himoyalangan</span>
          <span className="font-mono text-[11px] text-slate-400">
            Supabase PostgreSQL · Telegram Bot OTP · Server-side Grading
          </span>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={showAuthModal}
        onSuccess={handleAuthSuccess}
        onClose={() => setShowAuthModal(false)}
      />

      <GuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}
