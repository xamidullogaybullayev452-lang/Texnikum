import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle, FileText, X, ArrowRight, Save, RefreshCw } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { ParsedQuestionDraft } from '../../server';

interface WordImportModalProps {
  testId: string;
  testTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const WordImportModal: React.FC<WordImportModalProps> = ({
  testId,
  testTitle,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pastedText, setPastedText] = useState(`1. 2x + 6 = 16 tenglamaning yechimini toping.
A) 4
*B) 5
C) 6
D) 8
Izoh: 2x = 10, x = 5.

2. O'zbekiston poytaxti Toshkentmi?
*Ha) To'g'ri
Yo'q) Noto'g'ri
Izoh: Toshkent O'zbekiston Respublikasining poytaxti hisoblanadi.

3. Amir Temur qaysi yilda tavallud topgan?
*A) 1336-yil
B) 1342-yil
C) 1370-yil
D) 1405-yil`);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionDraft[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setErrorMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await apiRequest('/api/tests/parse-word', {
            method: 'POST',
            body: JSON.stringify({ base64Docx: base64 })
          });

          setParsedQuestions(res.questions);
          setStep('preview');
        } catch (err: any) {
          setErrorMsg(err.message || "Word faylini o'qishda xatolik yuz berdi");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg("Faylni yuklashda xatolik");
      setLoading(false);
    }
  };

  const handleParseText = async () => {
    if (!pastedText.trim()) {
      setErrorMsg("Iltimos, test matnini kiriting yoki fayl yuklang.");
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiRequest('/api/tests/parse-word', {
        method: 'POST',
        body: JSON.stringify({ textContent: pastedText })
      });

      setParsedQuestions(res.questions);
      setStep('preview');
    } catch (err: any) {
      setErrorMsg(err.message || "Matnni ajratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, newText: string) => {
    const updated = [...parsedQuestions];
    updated[qIdx].options[optIdx].text = newText;
    setParsedQuestions(updated);
  };

  const handleSetCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...parsedQuestions];
    updated[qIdx].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optIdx;
    });
    // Clear missing correct error if resolved
    updated[qIdx].errors = updated[qIdx].errors.filter(e => !e.includes("To'g'ri javob belgilanmagan"));
    setParsedQuestions(updated);
  };

  const handleSaveToTest = async () => {
    // Check if there are still critical errors
    const stillHasErrors = parsedQuestions.some(q => q.errors.length > 0);
    if (stillHasErrors) {
      if (!confirm("Ba'zi savollarda xatoliklar mavjud. Baribir davom etmoqchimisiz?")) {
        return;
      }
    }

    setSaving(true);
    try {
      const res = await apiRequest(`/api/tests/${testId}/batch-questions`, {
        method: 'POST',
        body: JSON.stringify({ questions: parsedQuestions })
      });
      onSuccess(res.addedCount);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Savollarni saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const hasAnyErrors = parsedQuestions.some(q => q.errors.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Word (.docx) / Matndan savollarni import qilish
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Test: <span className="font-semibold text-slate-800">{testTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'upload' ? (
            <div className="space-y-6">
              {/* File upload drag drop */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-800 mb-1">
                  Word (.docx) faylini tanlang
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
                  Savollar 1. Savol? A) ... *B) to'g'ri formatida tayyorlangan .docx faylni yuklang
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Fayl tanlash (.docx)</span>
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                {fileName && (
                  <p className="text-xs text-indigo-700 font-medium mt-3">
                    Tanlandi: {fileName}
                  </p>
                )}
              </div>

              {/* Or Paste text */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Yoki matnni to'g'ridan-to'g'ri joylashtiring (Paste):
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    * belgisi = to'g'ri javob
                  </span>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={8}
                  placeholder={`1. Savol matni?\nA) variant\n*B) to'g'ri variant\nC) variant\nD) variant\nIzoh: Izoh matni`}
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Format Hint Card */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4" />
                  Standart format talablari:
                </p>
                <p>• Har bir savol tartib raqami bilan boshlanishi kerak (masalan: 1., 2., 3.)</p>
                <p>• Variantlar A), B), C), D) yoki Ha / Yo'q ko'rinishida bo'ladi</p>
                <p>• To'g'ri javob oldiga <strong className="text-amber-950">*</strong> yulduzcha belgisi qo'yiladi (masalan: *B) To'g'ri javob)</p>
                <p>• Ixtiyoriy ravishda "Izoh: ..." qatorini kiritish mumkin</p>
              </div>
            </div>
          ) : (
            /* PREVIEW AND VALIDATION SCREEN */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-100 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {hasAnyErrors ? (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" /> {parsedQuestions.length} ta savol topildi (xatoliklar mavjud!)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle className="w-4 h-4" /> {parsedQuestions.length} ta savol muvaffaqiyatli tekshirildi
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Saqlashdan oldin barcha savollar va to'g'ri variantlarni tekshirib chiqing.
                  </p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Matnga qaytish
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {parsedQuestions.map((q, qIdx) => {
                  const hasErr = q.errors.length > 0;
                  return (
                    <div
                      key={qIdx}
                      className={`p-4 rounded-xl border transition-all ${
                        hasErr
                          ? 'border-red-300 bg-red-50/40 shadow-xs ring-1 ring-red-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                            hasErr ? 'bg-red-200 text-red-900' : 'bg-slate-200 text-slate-800'
                          }`}>
                            Savol №{q.number}
                          </span>
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {q.text}
                          </p>
                        </div>
                      </div>

                      {/* Error warnings if any */}
                      {hasErr && (
                        <div className="mb-3 p-2.5 bg-red-100/80 border border-red-300 rounded-lg text-xs font-medium text-red-800 flex flex-col gap-1">
                          {q.errors.map((err, eIdx) => (
                            <div key={eIdx} className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                              <span>⚠️ Xato topildi: {err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = opt.isCorrect;
                          return (
                            <div
                              key={optIdx}
                              onClick={() => handleSetCorrect(qIdx, optIdx)}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-300'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                                }`}>
                                  {opt.letter}
                                </span>
                                <input
                                  type="text"
                                  value={opt.text}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none py-0.5 truncate"
                                />
                              </div>
                              <span className="text-[10px] uppercase font-bold shrink-0">
                                {isCorrect ? "To'g'ri (✓)" : "Tanlash"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <p className="mt-2.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-200">
                          <strong className="text-slate-700 font-semibold">Izoh:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Bekor qilish
          </button>

          {step === 'upload' ? (
            <button
              type="button"
              onClick={handleParseText}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              <span>Matnni tahlil qilish & Ko'rib chiqish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">
                Jami: <strong className="text-slate-900">{parsedQuestions.length} ta savol</strong>
              </span>
              <button
                type="button"
                onClick={handleSaveToTest}
                disabled={saving || parsedQuestions.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saqlanmoqda..." : "Testga saqlash"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
