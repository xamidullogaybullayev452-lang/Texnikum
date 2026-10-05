import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  Settings,
  Plus,
  Trash2,
  Edit,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  UserX,
  PieChart,
  FileUp,
  Database,
  Send,
  Eye,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { exportResultsToExcel } from '../utils/excel';
import { WordImportModal } from './WordImportModal';
import { GuideModal } from './GuideModal';
import { User, Group, Test, Question, TestAttempt, QuestionStat } from '../types';

interface TeacherDashboardProps {
  user: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'groups' | 'tests' | 'results' | 'unsubmitted' | 'stats' | 'database'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<any>({});
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [testsList, setTestsList] = useState<Test[]>([]);
  const [resultsList, setResultsList] = useState<TestAttempt[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);

  // Modals & sub-views
  const [wordModalTest, setWordModalTest] = useState<{ id: string; title: string } | null>(null);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState<Test | null>(null);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [selectedTestForStats, setSelectedTestForStats] = useState<string>('');
  const [questionStatsData, setQuestionStatsData] = useState<QuestionStat[]>([]);
  const [selectedTestForUnsubmitted, setSelectedTestForUnsubmitted] = useState<string>('');
  const [unsubmittedData, setUnsubmittedData] = useState<any | null>(null);

  // Group Form State
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ id: '', name: '', description: '' });

  // Test Form State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testFormData, setTestFormData] = useState({
    id: '',
    title: '',
    bookName: '',
    subject: 'Matematika',
    groupId: '',
    durationMinutes: 30,
    maxAttempts: 1,
    passingPercentage: 70,
    shuffleQuestions: true,
    shuffleOptions: true,
    showAnswersAfterResult: true,
    showExplanations: true,
    status: 'open' as 'draft' | 'open' | 'closed'
  });

  // Question Form State (Single Question)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qFormData, setQFormData] = useState({
    text: '',
    type: 'single_choice' as 'single_choice' | 'true_false',
    points: 1,
    explanation: '',
    options: [
      { letter: 'A', text: '', isCorrect: true },
      { letter: 'B', text: '', isCorrect: false },
      { letter: 'C', text: '', isCorrect: false },
      { letter: 'D', text: '', isCorrect: false }
    ]
  });

  // Results Filter State
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterTest, setFilterTest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete result confirmation
  const [deleteConfirmAttempt, setDeleteConfirmAttempt] = useState<TestAttempt | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [statsRes, grpRes, testsRes, resRes, studentsRes] = await Promise.all([
        apiRequest('/api/admin/stats'),
        apiRequest('/api/groups'),
        apiRequest('/api/tests'),
        apiRequest('/api/results'),
        apiRequest('/api/admin/students')
      ]);

      setStats(statsRes);
      setGroupsList(grpRes.groups || []);
      setTestsList(testsRes.tests || []);
      setResultsList(resRes.results || []);
      setStudentsList(studentsRes.students || []);

      if (testsRes.tests && testsRes.tests.length > 0) {
        if (!selectedTestForStats) setSelectedTestForStats(testsRes.tests[0].id);
        if (!selectedTestForUnsubmitted) setSelectedTestForUnsubmitted(testsRes.tests[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered Results
  const filteredResults = resultsList.filter(item => {
    if (filterGroup !== 'all' && item.groupId !== filterGroup) return false;
    if (filterTest !== 'all' && item.testId !== filterTest) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (item.studentName && item.studentName.toLowerCase().includes(q)) ||
                    (item.studentPhone && item.studentPhone.includes(q)) ||
                    (item.testTitle && item.testTitle.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Load Questions when a test is selected
  const handleSelectTestQuestions = async (t: Test) => {
    setSelectedTestForQuestions(t);
    try {
      const res = await apiRequest(`/api/tests/${t.id}/questions`);
      setQuestionsList(res.questions || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Unsubmitted Data
  const handleLoadUnsubmitted = async (tId: string) => {
    setSelectedTestForUnsubmitted(tId);
    try {
      const res = await apiRequest(`/api/tests/${tId}/unsubmitted`);
      setUnsubmittedData(res);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Question Stats
  const handleLoadQuestionStats = async (tId: string) => {
    setSelectedTestForStats(tId);
    try {
      const res = await apiRequest(`/api/tests/${tId}/statistics`);
      setQuestionStatsData(res.statistics || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedTestForStats) {
      handleLoadQuestionStats(selectedTestForStats);
    }
  }, [selectedTestForStats]);

  useEffect(() => {
    if (selectedTestForUnsubmitted) {
      handleLoadUnsubmitted(selectedTestForUnsubmitted);
    }
  }, [selectedTestForUnsubmitted]);

  // Group Create/Edit Submit
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (groupFormData.id) {
        await apiRequest(`/api/groups/${groupFormData.id}`, {
          method: 'PUT',
          body: JSON.stringify(groupFormData)
        });
        showToast("Guruh muvaffaqiyatli tahrirlandi.");
      } else {
        await apiRequest('/api/groups', {
          method: 'POST',
          body: JSON.stringify({ ...groupFormData, teacherId: user.id })
        });
        showToast("Yangi guruh yaratildi.");
      }
      setShowGroupModal(false);
      setGroupFormData({ id: '', name: '', description: '' });
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Group Delete
  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" guruhini o'chirmoqchimisiz?`)) return;
    try {
      await apiRequest(`/api/groups/${id}`, { method: 'DELETE' });
      showToast("Guruh o'chirildi.");
      loadAllData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Test Create/Edit Submit
  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (testFormData.id) {
        await apiRequest(`/api/tests/${testFormData.id}`, {
          method: 'PUT',
          body: JSON.stringify(testFormData)
        });
        showToast("Test muvaffaqiyatli tahrirlandi.");
      } else {
        await apiRequest('/api/tests', {
          method: 'POST',
          body: JSON.stringify({ ...testFormData, teacherId: user.id })
        });
        showToast("Yangi test yaratildi.");
      }
      setShowTestModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Test Delete
  const handleDeleteTest = async (id: string, title: string) => {
    if (!confirm(`Haqiqatan ham "${title}" testini o'chirmoqchimisiz?`)) return;
    try {
      await apiRequest(`/api/tests/${id}`, { method: 'DELETE' });
      showToast("Test o'chirildi.");
      loadAllData();
      if (selectedTestForQuestions?.id === id) setSelectedTestForQuestions(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Save Single Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForQuestions) return;

    try {
      await apiRequest(`/api/tests/${selectedTestForQuestions.id}/questions`, {
        method: 'POST',
        body: JSON.stringify(qFormData)
      });
      showToast("Savol testga qo'shildi.");
      setShowQuestionModal(false);
      handleSelectTestQuestions(selectedTestForQuestions);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Result (Section 21: Natijani o'chirish va qayta topshirish)
  const handleConfirmDeleteResult = async () => {
    if (!deleteConfirmAttempt) return;
    try {
      await apiRequest(`/api/results/${deleteConfirmAttempt.id}`, { method: 'DELETE' });
      showToast(`${deleteConfirmAttempt.studentName} ning natijasi o'chirildi. Qayta topshirish mumkin.`);
      setDeleteConfirmAttempt(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Test Telegram Notification
  const handleTestTelegramNotification = async () => {
    try {
      const res = await apiRequest('/api/auth/student-request-code', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Sinov',
          lastName: 'O\'quvchi',
          phone: '+998901234567'
        })
      });
      showToast(`Telegram xabar yuborildi! (Sinov kodi: ${res.demoCode})`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-xs"
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Logo / Teacher Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm">
                  TP
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  O'qituvchi Paneli
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {user.firstName} {user.lastName} ({user.subject || 'O\'qituvchi'})
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('groups'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'groups'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Guruhlar</span>
            </button>

            <button
              onClick={() => { setActiveTab('tests'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'tests'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Testlar</span>
            </button>

            <button
              onClick={() => { setActiveTab('results'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'results'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Natijalar</span>
            </button>

            <button
              onClick={() => { setActiveTab('unsubmitted'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'unsubmitted'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>Kimlar hali ishlamagan?</span>
            </button>

            <button
              onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'stats'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Savollar statistikasi</span>
            </button>

            <button
              onClick={() => { setActiveTab('database'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'database'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase & Sozlamalar</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 space-y-1">
          <button
            onClick={() => setGuideOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Qo'llanma (9 bosqich)</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-slate-900 capitalize">
              {activeTab === 'dashboard' && 'Boshqaruv paneli'}
              {activeTab === 'groups' && 'Guruhlarni boshqarish'}
              {activeTab === 'tests' && 'Testlar va Savollar'}
              {activeTab === 'results' && 'O\'quvchilar natijalari'}
              {activeTab === 'unsubmitted' && 'Hali test ishlamagan o\'quvchilar'}
              {activeTab === 'stats' && 'Savollar tahlili va statistikasi'}
              {activeTab === 'database' && 'Supabase ma\'lumotlar bazasi va tizim sozlamalari'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuideOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Qo'llanma</span>
            </button>
          </div>
        </header>

        {/* Content body */}
        <div className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6">
          {/* ========================================================
              TAB 1: DASHBOARD
             ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards Grid (Section 5) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Jami O'quvchilar
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-slate-900">
                      {stats.totalStudents || 0}
                    </span>
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">faol</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Jami Guruhlar
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-slate-900">
                      {groupsList.length}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">guruh</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Jami Testlar
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-slate-900">
                      {testsList.length}
                    </span>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">ochiq</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Bugungi Testlar
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-indigo-600">
                      {stats.todayAttempts || 0}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">topshirildi</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    O'rtacha Natija
                  </span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-extrabold font-mono text-emerald-600">
                      {stats.averageScore || 0}%
                    </span>
                    <span className="text-xs text-slate-500 font-mono">umumiy</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Results */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Submissions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      So'nggi topshirilgan testlar
                    </h3>
                    <button
                      onClick={() => setActiveTab('results')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Barchasini ko'rish →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                        <tr>
                          <th className="py-2">O'quvchi</th>
                          <th className="py-2">Test</th>
                          <th className="py-2 text-right">Ball / Foiz</th>
                          <th className="py-2 text-center">Natija</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {resultsList.slice(0, 5).map(att => (
                          <tr key={att.id} className="hover:bg-slate-50">
                            <td className="py-2.5 font-semibold text-slate-900">
                              {att.studentName}
                              <span className="block text-[10px] text-slate-400 font-normal">{att.groupName}</span>
                            </td>
                            <td className="py-2.5 text-slate-600 truncate max-w-[150px]">
                              {att.testTitle}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold">
                              {att.score}/{att.maxScore} <span className="text-slate-400 font-normal">({att.percentage}%)</span>
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {att.status === 'passed' ? "O'TDI" : "O'TMADI"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick actions box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Tezkor amallar
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setTestFormData({
                          id: '',
                          title: '',
                          bookName: '',
                          subject: 'Matematika',
                          groupId: groupsList[0]?.id || '',
                          durationMinutes: 30,
                          maxAttempts: 1,
                          passingPercentage: 70,
                          shuffleQuestions: true,
                          shuffleOptions: true,
                          showAnswersAfterResult: true,
                          showExplanations: true,
                          status: 'open'
                        });
                        setShowTestModal(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 text-xs font-semibold transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plus className="w-4 h-4 text-indigo-600" />
                        <span>Yangi test yaratish</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-400" />
                    </button>

                    <button
                      onClick={() => {
                        setGroupFormData({ id: '', name: '', description: '' });
                        setShowGroupModal(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span>Yangi guruh ochish</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => exportResultsToExcel(resultsList, 'Barcha_Natijalar')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-emerald-600" />
                        <span>Barcha natijalarni Excelga yuklash</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: GURUHLAR (Section 6)
             ======================================================== */}
          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Guruhlar ro'yxati</h2>
                  <p className="text-xs text-slate-500">Mavjud o'quv guruhlarini yaratish va o'quvchilarni biriktirish</p>
                </div>
                <button
                  onClick={() => {
                    setGroupFormData({ id: '', name: '', description: '' });
                    setShowGroupModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi guruh yaratish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupsList.map(grp => (
                  <div key={grp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          {grp.studentCount || 0} ta o'quvchi
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setGroupFormData({ id: grp.id, name: grp.name, description: grp.description });
                              setShowGroupModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(grp.id, grp.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {grp.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {grp.description || "Tavsif kiritilmagan"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>O'qituvchi: {grp.teacherName || user.firstName}</span>
                      <button
                        onClick={() => {
                          setFilterGroup(grp.id);
                          setActiveTab('results');
                        }}
                        className="text-indigo-600 font-semibold hover:underline"
                      >
                        Natijalari →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: TESTLAR & SAVOLLAR (Sections 7, 8, 9)
             ======================================================== */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              {/* If viewing questions for a specific test */}
              {selectedTestForQuestions ? (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <button
                        onClick={() => setSelectedTestForQuestions(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 mb-1 flex items-center gap-1"
                      >
                        ← Testlar ro'yxatiga qaytish
                      </button>
                      <h2 className="text-lg font-bold text-slate-900">
                        {selectedTestForQuestions.title}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {selectedTestForQuestions.subject} · {selectedTestForQuestions.groupName} · {questionsList.length} ta savol
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setWordModalTest({ id: selectedTestForQuestions.id, title: selectedTestForQuestions.title })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors"
                      >
                        <FileUp className="w-4 h-4 text-emerald-600" />
                        <span>Word (.docx) import</span>
                      </button>
                      <button
                        onClick={() => {
                          setQFormData({
                            text: '',
                            type: 'single_choice',
                            points: 1,
                            explanation: '',
                            options: [
                              { letter: 'A', text: '', isCorrect: true },
                              { letter: 'B', text: '', isCorrect: false },
                              { letter: 'C', text: '', isCorrect: false },
                              { letter: 'D', text: '', isCorrect: false }
                            ]
                          });
                          setShowQuestionModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Savol qo'shish</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Cards List */}
                  <div className="space-y-3">
                    {questionsList.map((q, idx) => (
                      <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-800 rounded-md">
                              №{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {q.points} ball · {q.type === 'single_choice' ? 'Tanlovli' : 'Ha / Yo\'q'}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              if (confirm("Bu savolni o'chirmoqchimisiz?")) {
                                await apiRequest(`/api/questions/${q.id}`, { method: 'DELETE' });
                                handleSelectTestQuestions(selectedTestForQuestions);
                                loadAllData();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {q.text}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map(opt => (
                            <div
                              key={opt.letter}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-200'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span><strong className="mr-1">{opt.letter})</strong> {opt.text}</span>
                              {opt.isCorrect && <span className="text-[10px] text-emerald-700 font-bold">To'g'ri (✓)</span>}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <strong>Izoh:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Tests List */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Barcha testlar</h2>
                      <p className="text-xs text-slate-500">Testlarni sozlash, savollarni kiritish va o'quvchilarga ochish</p>
                    </div>
                    <button
                      onClick={() => {
                        setTestFormData({
                          id: '',
                          title: '',
                          bookName: '',
                          subject: 'Matematika',
                          groupId: groupsList[0]?.id || '',
                          durationMinutes: 30,
                          maxAttempts: 1,
                          passingPercentage: 70,
                          shuffleQuestions: true,
                          shuffleOptions: true,
                          showAnswersAfterResult: true,
                          showExplanations: true,
                          status: 'open'
                        });
                        setShowTestModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Yangi test yaratish</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testsList.map(t => (
                      <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {t.subject} · {t.groupName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              t.status === 'open'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'draft'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {t.status === 'open' ? 'Ochiq' : t.status === 'draft' ? 'Qoralama' : 'Yopiq'}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900">
                            {t.title}
                          </h3>
                          {t.bookName && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Kitob: {t.bookName}
                            </p>
                          )}

                          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Savollar</span>
                              <span className="font-bold text-slate-900 font-mono">{t.questionCount || 0} ta</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Vaqt</span>
                              <span className="font-bold text-slate-900 font-mono">{t.durationMinutes} daq</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">O'tish</span>
                              <span className="font-bold text-emerald-700 font-mono">{t.passingPercentage}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleSelectTestQuestions(t)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Savollarni ko'rish / qo'shish
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setWordModalTest({ id: t.id, title: t.title })}
                              title="Word fayldan import qilish"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <FileUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setTestFormData({
                                  id: t.id,
                                  title: t.title,
                                  bookName: t.bookName,
                                  subject: t.subject,
                                  groupId: t.groupId,
                                  durationMinutes: t.durationMinutes,
                                  maxAttempts: t.maxAttempts,
                                  passingPercentage: t.passingPercentage,
                                  shuffleQuestions: t.shuffleQuestions,
                                  shuffleOptions: t.shuffleOptions,
                                  showAnswersAfterResult: t.showAnswersAfterResult,
                                  showExplanations: t.showExplanations,
                                  status: t.status
                                });
                                setShowTestModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(t.id, t.title)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 4: NATIJALAR (Sections 17, 20, 21)
             ======================================================== */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">O'quvchilar test natijalari</h2>
                  <p className="text-xs text-slate-500">Ballar, sarflangan vaqt va oynadan chiqishlar hisoboti</p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => exportResultsToExcel(filteredResults, 'Test_Natijalari')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel (.xlsx) yuklab olish</span>
                  </button>
                </div>
              </div>

              {/* Multi-Filters Bar (Section 17) */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Guruh:</label>
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="all">Barcha guruhlar</option>
                    {groupsList.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Test:</label>
                  <select
                    value={filterTest}
                    onChange={(e) => setFilterTest(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="all">Barcha testlar</option>
                    {testsList.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Natija holati:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="all">Hammasi</option>
                    <option value="passed">Faqat o'tganlar (O'TDI)</option>
                    <option value="failed">O'tolmaganlar (O'TMADI)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Qidiruv (Ism/Telefon):</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Results Table (Section 17) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">O'quvchi</th>
                        <th className="px-4 py-3">Guruh</th>
                        <th className="px-4 py-3">Test</th>
                        <th className="px-4 py-3">Sana</th>
                        <th className="px-4 py-3 text-right">Ball</th>
                        <th className="px-4 py-3 text-right">Foiz</th>
                        <th className="px-4 py-3 text-center">Natija</th>
                        <th className="px-4 py-3 text-right">Vaqt</th>
                        <th className="px-4 py-3 text-center">Oynadan chiqishlar</th>
                        <th className="px-4 py-3 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredResults.length > 0 ? (
                        filteredResults.map(att => {
                          const isPassed = att.status === 'passed';
                          const minutes = Math.floor((att.timeSpentSeconds || 0) / 60);
                          const seconds = (att.timeSpentSeconds || 0) % 60;
                          const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                          const d = att.submittedAt ? new Date(att.submittedAt) : new Date();

                          return (
                            <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {att.studentName}
                                <span className="block text-[10px] text-slate-400 font-mono">{att.studentPhone}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {att.groupName}
                              </td>
                              <td className="px-4 py-3 text-slate-700 truncate max-w-[180px]">
                                {att.testTitle}
                              </td>
                              <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                                {d.toLocaleDateString('uz-UZ')} {d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                {att.score} / {att.maxScore}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold">
                                <span className={isPassed ? 'text-emerald-700' : 'text-red-700'}>
                                  {att.percentage}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                  isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isPassed ? "O'TDI" : "O'TMADI"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">
                                {timeStr}
                              </td>
                              <td className="px-4 py-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                  att.windowExitCount > 0 ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-500'
                                }`}>
                                  {att.windowExitCount} marta
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setDeleteConfirmAttempt(att)}
                                  title="Natijani o'chirish va qayta topshirishga ruxsat berish"
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                            Mos natijalar topilmadi.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: HALI TEST ISHLAMAGANLAR (Section 18)
             ======================================================== */}
          {activeTab === 'unsubmitted' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Kimlar hali test ishlamagan?</h2>
                  <p className="text-xs text-slate-500">Guruhdagi hali test topshirmagan o'quvchilarni aniqlash</p>
                </div>

                <div className="w-full sm:w-72">
                  <select
                    value={selectedTestForUnsubmitted}
                    onChange={(e) => setSelectedTestForUnsubmitted(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    {testsList.map(t => (
                      <option key={t.id} value={t.id}>{t.title} ({t.groupName})</option>
                    ))}
                  </select>
                </div>
              </div>

              {unsubmittedData && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Guruh O'quvchilari</span>
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {unsubmittedData.totalStudents} ta
                      </span>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Topshirganlar</span>
                      <span className="text-xl font-bold font-mono text-emerald-800">
                        {unsubmittedData.submittedCount} ta
                      </span>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                      <span className="text-amber-800 text-[10px] uppercase font-bold block">Hali Ishlamaganlar</span>
                      <span className="text-xl font-bold font-mono text-amber-900">
                        {unsubmittedData.unsubmittedCount} ta
                      </span>
                    </div>
                  </div>

                  {/* Unsubmitted Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                      <h3 className="text-sm font-bold text-slate-900">
                        Topshirmagan o'quvchilar ro'yxati ({unsubmittedData.unsubmittedCount} ta)
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">O'quvchi</th>
                            <th className="px-4 py-3">Telefon</th>
                            <th className="px-4 py-3">Guruh</th>
                            <th className="px-4 py-3 text-right">Holat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {unsubmittedData.unsubmittedStudents.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {s.firstName} {s.lastName}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">
                                {s.phone}
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-medium">
                                {s.groupName}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-full">
                                  Topshirmagan
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: SAVOLLAR STATISTIKASI (Section 19)
             ======================================================== */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Savollar tahlili va statistikasi</h2>
                  <p className="text-xs text-slate-500">Qaysi savollar qiyin bo'lganini va variantlar taqsimotini ko'rish</p>
                </div>

                <div className="w-full sm:w-72">
                  <select
                    value={selectedTestForStats}
                    onChange={(e) => setSelectedTestForStats(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold shadow-xs"
                  >
                    {testsList.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions Statistics Cards */}
              <div className="space-y-4">
                {questionStatsData.map((stat) => (
                  <div key={stat.questionId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md">
                          {stat.questionNumber}-savol
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-2">
                          {stat.questionText}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-500 font-mono shrink-0">
                        Jami: {stat.totalAnswers} ta javob
                      </span>
                    </div>

                    {/* Progress bars for correct / incorrect */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-emerald-700">To'g'ri: {stat.correctPercent}%</span>
                        <span className="text-red-700">Noto'g'ri: {stat.incorrectPercent}%</span>
                      </div>
                      <div className="w-full h-3 bg-red-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${stat.correctPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Options Distribution (Section 19: A — 10%, B — 70%, C — 15%, D — 5%) */}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Variantlar bo'yicha tanlanish taqsimoti:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(stat.optionDistribution).map(([opt, pct]) => (
                          <div key={opt} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                            <span className="font-bold text-slate-700">{opt} varianti:</span>
                            <span className="font-mono font-bold text-indigo-600">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: SUPABASE & SOZLAMALAR (Section 23)
             ======================================================== */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-600" />
                      <span>Supabase PostgreSQL Ma'lumotlar Bazasi</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supabase jadvallari, 500 o'quvchi uchun optimallashtirilgan indekslar va RLS xavfsizlik qoidalari
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestTelegramNotification}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram xabarni sinash</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-600">Jadvallar holati:</span>
                    <span className="text-emerald-700 font-bold">users, students, teachers, groups, group_members, tests, questions, question_options, test_attempts, answers (100% tayyor)</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-600">Yuqori yuklama indekslari:</span>
                    <span className="text-indigo-600 font-bold">idx_test_attempts_student_test, idx_questions_test, idx_answers_attempt</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Supabase SQL Migratsiya Skripti (/supabase/schema.sql):
                  </h3>
                  <textarea
                    readOnly
                    rows={10}
                    value={`-- Supabase SQL Editorga joylashtirish uchun tayyor:
CREATE TABLE IF NOT EXISTS public.users (...);
CREATE TABLE IF NOT EXISTS public.tests (...);
CREATE TABLE IF NOT EXISTS public.questions (...);
CREATE TABLE IF NOT EXISTS public.question_options (...);
CREATE TABLE IF NOT EXISTS public.test_attempts (...);
CREATE TABLE IF NOT EXISTS public.answers (...);
-- RLS siyosatlari va avtomatik baholash triggerlari yoqilgan.`}
                    className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          MODALS & POPUPS
         ======================================================== */}

      {/* WORD IMPORT MODAL */}
      {wordModalTest && (
        <WordImportModal
          testId={wordModalTest.id}
          testTitle={wordModalTest.title}
          isOpen={Boolean(wordModalTest)}
          onClose={() => setWordModalTest(null)}
          onSuccess={(count) => {
            showToast(`${count} ta savol muvaffaqiyatli saqlandi!`);
            loadAllData();
          }}
        />
      )}

      {/* GUIDE MODAL */}
      <GuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />

      {/* GROUP FORM MODAL */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              {groupFormData.id ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
            </h3>

            <form onSubmit={handleSaveGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guruh nomi</label>
                <input
                  type="text"
                  required
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="Masalan: 8-A, 9-B yoki Matematika 1-guruh"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                  placeholder="Guruh haqida qo'shimcha ma'lumot..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
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

      {/* TEST FORM MODAL (Section 7) */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <h3 className="text-base font-bold text-slate-900">
              {testFormData.id ? "Testni tahrirlash" : "Yangi test yaratish"}
            </h3>

            <form onSubmit={handleSaveTest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test nomi</label>
                <input
                  type="text"
                  required
                  value={testFormData.title}
                  onChange={(e) => setTestFormData({ ...testFormData, title: e.target.value })}
                  placeholder="Masalan: Algebra — Chiziqli tenglamalar"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fan</label>
                  <input
                    type="text"
                    required
                    value={testFormData.subject}
                    onChange={(e) => setTestFormData({ ...testFormData, subject: e.target.value })}
                    placeholder="Matematika"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kitob nomi</label>
                  <input
                    type="text"
                    value={testFormData.bookName}
                    onChange={(e) => setTestFormData({ ...testFormData, bookName: e.target.value })}
                    placeholder="Algebra 8-sinf"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Guruh</label>
                <select
                  required
                  value={testFormData.groupId}
                  onChange={(e) => setTestFormData({ ...testFormData, groupId: e.target.value })}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="">Guruhni tanlang...</option>
                  {groupsList.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vaqt (daqiqa)</label>
                  <input
                    type="number"
                    min={1}
                    value={testFormData.durationMinutes}
                    onChange={(e) => setTestFormData({ ...testFormData, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">O'tish foizi</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={testFormData.passingPercentage}
                    onChange={(e) => setTestFormData({ ...testFormData, passingPercentage: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urinishlar soni</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={testFormData.maxAttempts}
                    onChange={(e) => setTestFormData({ ...testFormData, maxAttempts: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Checkbox Settings (Section 7) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testFormData.shuffleQuestions}
                    onChange={(e) => setTestFormData({ ...testFormData, shuffleQuestions: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Savollarni aralashtirish</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testFormData.shuffleOptions}
                    onChange={(e) => setTestFormData({ ...testFormData, shuffleOptions: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Variantlarni aralashtirish</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testFormData.showAnswersAfterResult}
                    onChange={(e) => setTestFormData({ ...testFormData, showAnswersAfterResult: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Natijadan keyin to'g'ri javoblarni ko'rsatish</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testFormData.showExplanations}
                    onChange={(e) => setTestFormData({ ...testFormData, showExplanations: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Izohlarni ko'rsatish</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test holati</label>
                <select
                  value={testFormData.status}
                  onChange={(e: any) => setTestFormData({ ...testFormData, status: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="open">Ochiq (O'quvchilar ko'ra oladi)</option>
                  <option value="draft">Qoralama (Hozircha yopiq)</option>
                  <option value="closed">Yopiq</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
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

      {/* SINGLE QUESTION MODAL (Section 8) */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 my-8">
            <h3 className="text-base font-bold text-slate-900">
              Yangi savol qo'shish
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Savol matni</label>
                <textarea
                  required
                  rows={3}
                  value={qFormData.text}
                  onChange={(e) => setQFormData({ ...qFormData, text: e.target.value })}
                  placeholder="Savolni kiriting..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Savol turi</label>
                  <select
                    value={qFormData.type}
                    onChange={(e: any) => {
                      const type = e.target.value;
                      if (type === 'true_false') {
                        setQFormData({
                          ...qFormData,
                          type,
                          options: [
                            { letter: 'Ha', text: 'To\'g\'ri (Ha)', isCorrect: true },
                            { letter: 'Yo‘q', text: 'Noto\'g\'ri (Yo‘q)', isCorrect: false }
                          ]
                        });
                      } else {
                        setQFormData({
                          ...qFormData,
                          type,
                          options: [
                            { letter: 'A', text: '', isCorrect: true },
                            { letter: 'B', text: '', isCorrect: false },
                            { letter: 'C', text: '', isCorrect: false },
                            { letter: 'D', text: '', isCorrect: false }
                          ]
                        });
                      }
                    }}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="single_choice">Bitta to'g'ri javob (A, B, C, D)</option>
                    <option value="true_false">To'g'ri / Noto'g'ri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ball</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={qFormData.points}
                    onChange={(e) => setQFormData({ ...qFormData, points: Number(e.target.value) })}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Variantlar (to'g'ri variantni belgilang):
                </label>
                {qFormData.options.map((opt, oIdx) => (
                  <div key={opt.letter} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={opt.isCorrect}
                      onChange={() => {
                        const updated = qFormData.options.map((o, idx) => ({
                          ...o,
                          isCorrect: idx === oIdx
                        }));
                        setQFormData({ ...qFormData, options: updated });
                      }}
                      className="text-indigo-600"
                    />
                    <span className="w-6 text-xs font-bold text-slate-600">{opt.letter})</span>
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...qFormData.options];
                        updated[oIdx].text = e.target.value;
                        setQFormData({ ...qFormData, options: updated });
                      }}
                      placeholder={`Variant ${opt.letter} matni...`}
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  value={qFormData.explanation}
                  onChange={(e) => setQFormData({ ...qFormData, explanation: e.target.value })}
                  placeholder="To'g'ri javob sababi yoki tushuntirish..."
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Savolni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE RESULT CONFIRMATION MODAL (Section 21) */}
      {deleteConfirmAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Natijani o'chirish va qayta topshirishga ruxsat berasizmi?
            </h3>
            <p className="text-xs text-slate-600">
              <strong>{deleteConfirmAttempt.studentName}</strong> ning <em>"{deleteConfirmAttempt.testTitle}"</em> testidagi natijasi butunlay o'chiriladi va o'quvchiga yangi urinish ochiladi.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAttempt(null)}
                className="py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteResult}
                className="py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
