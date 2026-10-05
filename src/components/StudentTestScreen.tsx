import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, ArrowLeft, ArrowRight, Send, WifiOff, Wifi, Eye, ShieldAlert, Award, FileText } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { Question, AttemptReviewItem } from '../types';

interface StudentTestScreenProps {
  testId: string;
  studentId: string;
  onExit: () => void;
}

interface TestRunState {
  attemptId: string;
  isResume: boolean;
  remainingSeconds: number;
  durationMinutes: number;
  windowExitCount: number;
  savedAnswers: Record<string, string>;
  test: {
    id: string;
    title: string;
    bookName: string;
    subject: string;
    passingPercentage: number;
  };
  questions: Question[];
}

export const StudentTestScreen: React.FC<StudentTestScreenProps> = ({
  testId,
  studentId,
  onExit
}) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [runState, setRunState] = useState<TestRunState | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingTime, setRemainingTime] = useState(0);
  const [windowExits, setWindowExits] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkBanner, setNetworkBanner] = useState<string | null>(null);
  const [exitAlertBanner, setExitAlertBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultData, setResultData] = useState<any | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // 1. Initialize or Resume Test Attempt
  useEffect(() => {
    let mounted = true;

    async function initTest() {
      try {
        setLoading(true);
        setErrorMsg('');

        const res = await apiRequest(`/api/student/tests/${testId}/start`, {
          method: 'POST',
          body: JSON.stringify({ studentId })
        });

        if (!mounted) return;

        // Restore local storage answers if available
        const localKey = `tp_answers_${res.attemptId}`;
        const localAnswers = localStorage.getItem(localKey);
        let mergedAnswers = { ...(res.savedAnswers || {}) };
        if (localAnswers) {
          try {
            mergedAnswers = { ...mergedAnswers, ...JSON.parse(localAnswers) };
          } catch (e) {}
        }

        setRunState(res);
        setAnswers(mergedAnswers);
        setRemainingTime(res.remainingSeconds);
        setWindowExits(res.windowExitCount || 0);

        if (res.isResume) {
          setExitAlertBanner("Testingiz davom etmoqda. Oxirgi to'xtagan joyingizdan davom eting.");
          setTimeout(() => setExitAlertBanner(null), 5000);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMsg(err.message || "Testni yuklashda xatolik yuz berdi");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initTest();

    return () => {
      mounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId, studentId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (!runState || resultData || remainingTime <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit when time runs out!
          if (!isSubmittingRef.current) {
            handleFinalSubmit(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [runState, resultData]);

  // 3. Online/Offline Network Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkBanner("Internet qayta ulandi. Ma'lumotlar sinxronlashtirilmoqda.");
      // Sync local answers with server
      if (runState?.attemptId) {
        apiRequest(`/api/student/attempts/${runState.attemptId}/progress`, {
          method: 'POST',
          body: JSON.stringify({ answers })
        }).catch(() => {});
      }
      setTimeout(() => setNetworkBanner(null), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkBanner("Internet aloqasi uzildi. Javoblaringiz qurilmada saqlanmoqda.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runState, answers]);

  // 4. Anti-Cheat: Visibilitychange Listener
  useEffect(() => {
    if (!runState || resultData) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Increment exit counter
        setWindowExits((prev) => prev + 1);
        setExitAlertBanner("Diqqat! Test vaqtida boshqa oynaga o'tish qayd etildi.");
        setTimeout(() => setExitAlertBanner(null), 5000);

        try {
          await apiRequest(`/api/student/attempts/${runState.attemptId}/visibility-exit`, {
            method: 'POST'
          });
        } catch (e) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runState, resultData]);

  // 5. Select Answer & Auto-Save
  const handleSelectOption = (questionId: string, optionLetter: string) => {
    if (resultData || submitting) return;

    const updated = { ...answers, [questionId]: optionLetter };
    setAnswers(updated);

    if (runState?.attemptId) {
      // 1. Instant local persistence
      localStorage.setItem(`tp_answers_${runState.attemptId}`, JSON.stringify(updated));

      // 2. Background server sync
      if (navigator.onLine) {
        apiRequest(`/api/student/attempts/${runState.attemptId}/progress`, {
          method: 'POST',
          body: JSON.stringify({ answers: updated })
        }).catch(() => {});
      }
    }
  };

  // 6. Final Submit
  const handleFinalSubmit = async (autoSubmitted = false) => {
    if (!runState || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await apiRequest(`/api/student/attempts/${runState.attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, autoSubmitted })
      });

      // Clear local storage cache
      localStorage.removeItem(`tp_answers_${runState.attemptId}`);
      setResultData(res.result);
    } catch (err: any) {
      setErrorMsg(err.message || "Testni yuborishda xatolik yuz berdi");
      isSubmittingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => (n < 10 ? '0' + n : n);
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !runState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Testni boshlab bo'lmadi</h3>
          <p className="text-xs text-slate-600">{errorMsg}</p>
          <button
            onClick={onExit}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Bosh sahifaga qaytish
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RESULT VIEW AFTER COMPLETION
  // ==========================================
  if (resultData) {
    const isPassed = resultData.isPassed;
    return (
      <div className="min-h-screen bg-slate-50 pb-16">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Result Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 text-center space-y-6">
            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-inner ${
              isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {isPassed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>

            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-2 ${
                isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {isPassed ? "✅ O'TDI" : "❌ O'TMADI"}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                {runState?.test.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {runState?.test.bookName} · {runState?.test.subject}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">To'plangan Ball</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {resultData.score} / {resultData.maxScore}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Natija Foizi</span>
                <span className={`text-xl font-bold font-mono ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {resultData.percentage}%
                </span>
                <span className="text-[10px] text-slate-400 block">(O'tish: {resultData.passingPercentage}%)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Sarflangan Vaqt</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {resultData.timeFormatted}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">Oynadan Chiqishlar</span>
                <span className={`text-xl font-bold font-mono ${resultData.windowExitCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {resultData.windowExitCount} marta
                </span>
              </div>
            </div>

            {resultData.autoSubmitted && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ Vaqt tugadi — test tizim tomonidan avtomatik yuborildi.
              </p>
            )}

            <button
              onClick={onExit}
              className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              Bosh sahifaga qaytish
            </button>
          </div>

          {/* Review items if enabled */}
          {resultData.showAnswersAfterResult && resultData.reviewItems && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Savollar va to'g'ri javoblar tahlili
              </h3>

              <div className="space-y-3">
                {resultData.reviewItems.map((item: AttemptReviewItem, idx: number) => {
                  const isItemCorrect = item.isCorrect;
                  return (
                    <div
                      key={item.questionId}
                      className={`p-5 rounded-2xl border bg-white shadow-xs ${
                        isItemCorrect ? 'border-emerald-200' : 'border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                          isItemCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {idx + 1}-savol · {isItemCorrect ? "To'g'ri (+1 ball)" : "Noto'g'ri (0 ball)"}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 mb-3">
                        {item.questionText}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        {item.options.map((opt) => {
                          const isSelected = item.selectedOption === opt.letter;
                          const isThisCorrect = opt.isCorrect;

                          let bgClass = "bg-slate-50 border-slate-200 text-slate-700";
                          if (isThisCorrect) {
                            bgClass = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-300";
                          } else if (isSelected && !isThisCorrect) {
                            bgClass = "bg-red-50 border-red-300 text-red-900 line-through";
                          }

                          return (
                            <div
                              key={opt.letter}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${bgClass}`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="font-bold">{opt.letter})</span>
                                <span>{opt.text}</span>
                              </span>
                              {isSelected && (
                                <span className="text-[10px] uppercase font-bold bg-white px-1.5 py-0.5 rounded shadow-xs">
                                  Sizning javob
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {item.explanation && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                          <strong className="font-semibold text-blue-950">Izoh: </strong>
                          {item.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE TEST TAKING VIEW
  // ==========================================
  if (!runState || !runState.questions || runState.questions.length === 0) {
    return null;
  }

  const currentQ = runState.questions[currentIdx];
  const isAnswered = Boolean(answers[currentQ.id]);
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = remainingTime <= 180; // less than 3 mins

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* 1. TOP STICKY TEST BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Test Name & Progress */}
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate">
              {runState.test.title}
            </h1>
            <p className="text-[11px] text-slate-500 truncate">
              Savol: <strong className="text-slate-800">{currentIdx + 1}</strong> / {runState.questions.length} · Javob berildi: <strong className="text-indigo-600 font-mono">{answeredCount}</strong>
            </p>
          </div>

          {/* Anti-cheat count badge & Timer */}
          <div className="flex items-center gap-2.5 shrink-0">
            {windowExits > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Chiqishlar: {windowExits}</span>
              </div>
            )}

            {/* Large countdown timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-extrabold tracking-wider border shadow-xs transition-colors ${
              isTimeCritical
                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                : 'bg-slate-900 border-slate-900 text-white'
            }`}>
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatTimer(remainingTime)}</span>
            </div>

            {/* Finish test button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Yakunlash
            </button>
          </div>
        </div>

        {/* Banners */}
        {networkBanner && (
          <div className={`mt-2 p-2 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-2 ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200 animate-bounce'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{networkBanner}</span>
          </div>
        )}

        {exitAlertBanner && (
          <div className="mt-2 p-2 bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold text-amber-900 text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>{exitAlertBanner}</span>
          </div>
        )}
      </header>

      {/* 2. QUESTION CONTENT */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Question Palette for Quick Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {runState.questions.map((q, idx) => {
            const hasAns = Boolean(answers[q.id]);
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold shrink-0 transition-all font-mono ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1'
                    : hasAns
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Current Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Savol {currentIdx + 1} / {runState.questions.length}
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {currentQ.points} ball
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQ.text}
          </h2>

          {/* Options Grid (Mobile-first, large tap targets) */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id] === opt.letter;
              return (
                <button
                  key={opt.id || opt.letter}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt.letter)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all min-h-[56px] select-none ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 text-indigo-950 font-bold shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {opt.letter}
                    </span>
                    <span className="text-sm">{opt.text}</span>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* 3. BOTTOM CONTROLS */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-200 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Oldingi</span>
          </button>

          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            {answeredCount} ta savolga javob berildi
          </span>

          {currentIdx < runState.questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(runState.questions.length - 1, prev + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              <span>Keyingi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              <span>Testni yakunlash</span>
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Testni yakunlaysizmi?
            </h3>
            <p className="text-xs text-slate-600">
              Siz {runState.questions.length} ta savoldan {answeredCount} tasiga javob berdingiz.
              {answeredCount < runState.questions.length && (
                <span className="block mt-1 font-semibold text-amber-600">
                  ⚠️ {runState.questions.length - answeredCount} ta savol belgilanmagan!
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Davom etish
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
              >
                {submitting ? "Yuborilmoqda..." : "Ha, yakunlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
