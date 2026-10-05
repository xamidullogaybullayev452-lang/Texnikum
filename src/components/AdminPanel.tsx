import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, GraduationCap, BookOpen, Layers, Activity, UserPlus, Trash2, Play, CheckCircle2, AlertCircle, RefreshCw, Cpu, Server } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { User, LoadTestResult } from '../types';

interface AdminPanelProps {
  user: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'students' | 'loadtest'>('overview');
  const [stats, setStats] = useState<any>({});
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Teacher Modal
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    firstName: '',
    lastName: '',
    phone: '+99890',
    subject: 'Matematika',
    telegramChatId: ''
  });

  // Load Test Simulation State (Section 28)
  const [runningLoadTest, setRunningLoadTest] = useState(false);
  const [loadTestResult, setLoadTestResult] = useState<LoadTestResult | null>(null);
  const [loadTestError, setLoadTestError] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, teachersRes, studentsRes] = await Promise.all([
        apiRequest('/api/admin/stats'),
        apiRequest('/api/admin/teachers'),
        apiRequest('/api/admin/students')
      ]);

      setStats(statsRes);
      setTeachers(teachersRes.teachers || []);
      setStudents(studentsRes.students || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/teachers', {
        method: 'POST',
        body: JSON.stringify(newTeacherData)
      });
      setShowAddTeacher(false);
      setNewTeacherData({ firstName: '', lastName: '', phone: '+99890', subject: 'Matematika', telegramChatId: '' });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham o'qituvchi "${name}"ni o'chirmoqchimisiz?`)) return;
    try {
      await apiRequest(`/api/admin/teachers/${id}`, { method: 'DELETE' });
      loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Run 500 Virtual Users Load Test (Section 28)
  const handleRunLoadTest = async () => {
    setRunningLoadTest(true);
    setLoadTestError('');
    setLoadTestResult(null);

    try {
      const res = await apiRequest('/api/admin/load-test', { method: 'POST' });
      setLoadTestResult(res.result);
    } catch (err: any) {
      setLoadTestError(err.message || "Yuklama testini bajarishda xatolik yuz berdi");
    } finally {
      setRunningLoadTest(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Bosh Administrator Paneli
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Administrator: {user.firstName} {user.lastName} · Barcha o'qituvchilar, o'quvchilar va tizim yuklamasini boshqarish
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl backdrop-blur-xs self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Statistika
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'teachers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            O'qituvchilar ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'students' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            O'quvchilar ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('loadtest')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'loadtest' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-300 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>500 Foydalanuvchi Testi</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Tizim ma'lumotlari yuklanmoqda...</p>
        </div>
      ) : activeTab === 'overview' ? (
        /* OVERVIEW TAB */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Jami O'quvchilar</span>
              <span className="text-3xl font-extrabold font-mono text-slate-900 mt-2 block">
                {stats.totalStudents || 0}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">O'qituvchilar</span>
              <span className="text-3xl font-extrabold font-mono text-indigo-600 mt-2 block">
                {teachers.length}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Guruhlar</span>
              <span className="text-3xl font-extrabold font-mono text-slate-900 mt-2 block">
                {stats.totalGroups || 0}
              </span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-[10px] font-bold uppercase block">Jami Testlar</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-600 mt-2 block">
                {stats.totalTests || 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Tizim va ma'lumotlar bazasi arxitekturasi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ushbu platforma bir vaqtning o'zida 500+ o'quvchi test topshirishi uchun Supabase PostgreSQL bazasi bilan bog'langan.
              Xavfsizlik talablariga muvofiq, test savollarining to'g'ri javoblari faqat server tomonida baholanadi (Server-side grading),
              boshqa oynaga o'tishlar <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">visibilitychange</code> orqali qayd etiladi va internet uzilganda lokal saqlash ishga tushadi.
            </p>
          </div>
        </div>
      ) : activeTab === 'teachers' ? (
        /* TEACHERS MANAGEMENT TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">O'qituvchilar ro'yxati</h2>
              <p className="text-xs text-slate-500">Tizimga yangi o'qituvchi qo'shish va huquqlarini boshqarish</p>
            </div>
            <button
              onClick={() => setShowAddTeacher(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>O'qituvchi qo'shish</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">O'qituvchi</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Fan</th>
                  <th className="px-4 py-3">Telegram ID</th>
                  <th className="px-4 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {t.firstName} {t.lastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {t.phone}
                    </td>
                    <td className="px-4 py-3 text-indigo-700 font-medium">
                      {t.subject || "Umumiy fanlar"}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {t.telegramChatId || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteTeacher(t.id, `${t.firstName} ${t.lastName}`)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'students' ? (
        /* STUDENTS DIRECTORY TAB */
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">O'quvchilar ro'yxati</h2>
            <p className="text-xs text-slate-500">Ro'yxatdan o'tgan barcha o'quvchilar va ularning guruhlari</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">O'quvchi</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Guruhlar</th>
                  <th className="px-4 py-3 text-right">Topshirgan testlari</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {s.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {s.groups && s.groups.length > 0 ? s.groups.join(', ') : 'Guruhga kiritilmagan'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">
                      {s.attemptsCount || 0} ta
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SECTION 28: 500 VIRTUAL USERS LOAD TEST RUNNER */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <span>500 Virtual Foydalanuvchi Yuklama Testi (Concurrent Load-Test)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  500 ta virtual o'quvchining bir vaqtda test tizimiga kirishi, savollarni qabul qilishi, javoblarni serverga jo'natishi va server-side baholash jarayonini sinovdan o'tkazish.
                </p>
              </div>

              <button
                onClick={handleRunLoadTest}
                disabled={runningLoadTest}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                {runningLoadTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>500 foydalanuvchi sinovi ketmoqda...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>500 ta o'quvchi sinovini boshlash</span>
                  </>
                )}
              </button>
            </div>

            {loadTestError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loadTestError}</span>
              </div>
            )}

            {/* RESULTS OUTPUT IN EXACT FORMAT REQUESTED (Section 28) */}
            {loadTestResult && (
              <div className="mt-6 p-6 bg-slate-900 text-slate-100 rounded-2xl shadow-xl space-y-4 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Yuklama testi muvaffaqiyatli yakunlandi
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Sinov vaqti: {loadTestResult.simulatedTimeMs} ms
                  </span>
                </div>

                {/* EXACT SPECIFICATION METRICS DISPLAY */}
                <div className="text-sm space-y-1.5 py-2 text-slate-200">
                  <p><strong className="text-indigo-400">Virtual users:</strong> {loadTestResult.virtualUsers}</p>
                  <p><strong className="text-emerald-400">Successful requests:</strong> {loadTestResult.successfulRequests}</p>
                  <p><strong className="text-red-400">Failed requests:</strong> {loadTestResult.failedRequests}</p>
                  <p><strong className="text-amber-400">Average response time:</strong> {loadTestResult.averageResponseTime} ms</p>
                  <p><strong className="text-cyan-400">95th percentile:</strong> {loadTestResult.p95ResponseTime} ms</p>
                  <p><strong className="text-purple-400">Error rate:</strong> {loadTestResult.errorRate}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 italic">
                  Eslatma: {loadTestResult.note}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD TEACHER MODAL */}
      {showAddTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Yangi o'qituvchi qo'shish
            </h3>

            <form onSubmit={handleCreateTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ism</label>
                <input
                  type="text"
                  required
                  value={newTeacherData.firstName}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, firstName: e.target.value })}
                  placeholder="Masalan: Nodir"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Familiya</label>
                <input
                  type="text"
                  required
                  value={newTeacherData.lastName}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, lastName: e.target.value })}
                  placeholder="Masalan: Rustamov"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon raqam (+998)</label>
                <input
                  type="tel"
                  required
                  value={newTeacherData.phone}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, phone: e.target.value })}
                  placeholder="+998901234567"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fani</label>
                <input
                  type="text"
                  required
                  value={newTeacherData.subject}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, subject: e.target.value })}
                  placeholder="Matematika"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
