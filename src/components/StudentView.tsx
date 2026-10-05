import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, Play, CheckCircle2, XCircle, ArrowRight, User as UserIcon, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { User, TestAttempt } from '../types';

interface StudentViewProps {
  user: User;
  onStartTest: (testId: string) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ user, onStartTest }) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'profile'>('tests');
  const [tests, setTests] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [testsRes, profileRes] = await Promise.all([
        apiRequest(`/api/student/tests?studentId=${user.id}`),
        apiRequest(`/api/student/profile?studentId=${user.id}`)
      ]);
      setTests(testsRes.tests || []);
      setProfileData(profileRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
            O'quvchi portali
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Salom, {user.firstName} {user.lastName}! 👋
          </h1>
          <p className="text-xs text-indigo-200 mt-1">
            Guruh: <strong className="text-white">{profileData?.student?.groups?.join(', ') || '8-A'}</strong> · Telefon: <span className="font-mono text-indigo-100">{user.phone}</span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl backdrop-blur-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'tests'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            Ochiq testlar
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            Profil & Tarix
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Testlar yuklanmoqda...</p>
        </div>
      ) : activeTab === 'tests' ? (
        /* TESTS LIST TAB */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Guruhdagi faol testlar ({tests.length})</span>
            </h2>
            <button
              onClick={fetchStudentData}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Yangilash
            </button>
          </div>

          {tests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Hozirda yangi testlar yo'q</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                O'qituvchingiz yangi test ochganda shu sahifada paydo bo'ladi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((t) => {
                const canTake = t.canTakeTest;
                const isResume = t.hasInProgress;

                return (
                  <div
                    key={t.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          {t.subject}
                        </span>
                        {isResume ? (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full animate-pulse">
                            Jarayonda
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500">
                            {t.groupName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {t.title}
                      </h3>
                      {t.bookName && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kitob: {t.bookName}
                        </p>
                      )}

                      {/* Info grid */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Savollar</span>
                          <span className="font-bold text-slate-800 font-mono">{t.questionCount || 0} ta</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Vaqt</span>
                          <span className="font-bold text-slate-800 font-mono">{t.durationMinutes} daq</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">O'tish foizi</span>
                          <span className="font-bold text-emerald-700 font-mono">{t.passingPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        Urinishlar: <strong className="text-slate-800">{t.attemptsCount}</strong> / {t.maxAttempts}
                      </span>

                      {canTake ? (
                        <button
                          onClick={() => onStartTest(t.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                            isResume
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isResume ? "Davom etish" : "Testni boshlash"}</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                          Topshirilgan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* STUDENT PROFILE & TEST HISTORY TAB */
        <div className="space-y-6">
          {/* Profile Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Telefon: <span className="font-mono text-slate-800">{user.phone}</span> · Guruh: <span className="font-semibold text-indigo-700">{profileData?.student?.groups?.join(', ') || '8-A'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Jami Testlar</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {profileData?.attempts?.length || 0}
                </span>
              </div>
              <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Muvaffaqiyatli</span>
                <span className="text-base font-bold font-mono text-emerald-800">
                  {profileData?.attempts?.filter((a: any) => a.status === 'passed').length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Line Chart for Score Trend (Section 16: X o'qi Sanalar, Y o'qi Foiz) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Natijalarning vaqt bo'yicha dinamikasi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  X o'qi: Sanalar · Y o'qi: To'plangan foiz (%)
                </p>
              </div>
            </div>

            {profileData?.scoreTrend && profileData.scoreTrend.length > 0 ? (
              <div className="pt-4">
                {/* Responsive SVG Line Chart */}
                <div className="w-full h-48 sm:h-56 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="180" x2="500" y2="180" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Generate points */}
                    {(() => {
                      const trend = profileData.scoreTrend;
                      const stepX = 500 / Math.max(1, trend.length - 1);
                      const points = trend.map((item: any, i: number) => {
                        const x = trend.length === 1 ? 250 : i * stepX;
                        // Y axis: 0% is 180, 100% is 20
                        const y = 180 - (item.percentage / 100) * 160;
                        return { x, y, item };
                      });

                      const pathD = points.length === 1
                        ? `M 0 ${points[0].y} L 500 ${points[0].y}`
                        : points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                      const areaD = points.length === 1
                        ? `M 0 180 L 0 ${points[0].y} L 500 ${points[0].y} L 500 180 Z`
                        : `${pathD} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                      return (
                        <>
                          {/* Gradient fill */}
                          <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={areaD} fill="url(#chartGradient)" />
                          <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                          {/* Data points */}
                          {points.map((p: any, idx: number) => (
                            <g key={idx}>
                              <circle cx={p.x} cy={p.y} r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                              <text
                                x={p.x}
                                y={p.y - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="bold"
                                fill="#1e1b4b"
                                className="font-mono"
                              >
                                {p.item.percentage}%
                              </text>
                              <text
                                x={p.x}
                                y="196"
                                textAnchor="middle"
                                fontSize="9"
                                fill="#64748b"
                                className="font-mono"
                              >
                                {p.item.date}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Tarixiy natijalar mavjud emas. Birinchi testni topshirgach grafik shakllanadi.
              </p>
            )}
          </div>

          {/* Test History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Topshirilgan testlar tarixi
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Sana</th>
                    <th className="px-4 py-3 text-right">Ball</th>
                    <th className="px-4 py-3 text-right">Foiz</th>
                    <th className="px-4 py-3 text-center">Natija</th>
                    <th className="px-4 py-3 text-right">Sarflangan vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profileData?.attempts && profileData.attempts.length > 0 ? (
                    profileData.attempts.map((att: TestAttempt) => {
                      const isPassed = att.status === 'passed';
                      const minutes = Math.floor((att.timeSpentSeconds || 0) / 60);
                      const seconds = (att.timeSpentSeconds || 0) % 60;
                      const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                      const d = att.submittedAt ? new Date(att.submittedAt) : new Date();

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {att.testTitle || 'Test'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono">
                            {d.toLocaleDateString('uz-UZ')} {d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
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
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Topshirilgan testlar mavjud emas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
