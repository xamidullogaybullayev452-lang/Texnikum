import React from 'react';
import { X, BookOpen, Users, UserPlus, CheckCircle2, FileUp, Sparkles, Eye, Download, RotateCcw } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: "Guruh yaratish",
      icon: Users,
      desc: "Sidebar orqali 'Guruhlar' bo'limiga o'ting va 'Yangi guruh yaratish' tugmasini bosing. Guruh nomi (masalan: 8-A, 9-B yoki Matematika 1-guruh) va tavsifini kiriting."
    },
    {
      num: 2,
      title: "O'quvchi qo'shish",
      icon: UserPlus,
      desc: "Guruh kartochkasidagi 'O'quvchilar' tugmasi orqali o'quvchilarni guruhga biriktiring. O'quvchilar o'z telefon raqamlari orqali avtomatik ravishda tizimga birikadi."
    },
    {
      num: 3,
      title: "Test yaratish",
      icon: BookOpen,
      desc: "'Testlar' bo'limiga o'tib 'Yangi test yaratish' tugmasini bosing. Test nomi, kitob, mavzu, vaqt (daqiqa), o'tish foizi (masalan 70%) va savollarni aralashtirish sozlamalarini belgilang."
    },
    {
      num: 4,
      title: "Word fayldan savol yuklash",
      icon: FileUp,
      desc: ".docx fayl yoki matn ko'rinishida savollarni yuklang. Format: 1. Savol? A) ... *B) to'g'ri javob... Yulduzcha (*) belgisi to'g'ri variantni avtomatik aniqlaydi."
    },
    {
      num: 5,
      title: "Savollarni tekshirish (Ko'rib chiqish)",
      icon: Sparkles,
      desc: "Tizim savollarni darhol bazaga saqlamasdan 'Ko'rib chiqish' oynasida ko'rsatadi. Yetishmayotgan variantlar yoki to'g'ri javob belgilanmagan savollar qizil rangda ogohlantiriladi."
    },
    {
      num: 6,
      title: "Testni guruhga ochish",
      icon: CheckCircle2,
      desc: "Barcha savollar to'ldirilgach, test holatini 'Qoralama' dan 'Ochiq' holatiga o'tkazing. Shunda guruhdagi barcha o'quvchilar testni o'z sahifalarida ko'rishadi."
    },
    {
      num: 7,
      title: "Natijalarni tahlil qilish",
      icon: Eye,
      desc: "'Natijalar' bo'limida har bir o'quvchining balli, foizi, sarflagan vaqti va eng muhimi test vaqtida oynadan chiqishlar (tab switching) soni qayd etiladi."
    },
    {
      num: 8,
      title: "Excel (.xlsx) yuklab olish",
      icon: Download,
      desc: "Guruh yoki test bo'yicha saralangan natijalarni bir tugma bilan rasmiy .xlsx fayl formatida yuklab oling. Faylda barcha talab qilingan ustunlar mavjud."
    },
    {
      num: 9,
      title: "Qayta topshirishga ruxsat berish",
      icon: RotateCcw,
      desc: "Agar o'quvchida texnik muammo bo'lsa yoki o'qituvchi yana bir imkoniyat bermoqchi bo'lsa, 'Natijani o'chirish' tugmasini bosib tasdiqlang. O'quvchi testni boshidan qayta topshira oladi."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                O'qituvchi uchun foydalanish qo'llanmasi
              </h3>
              <p className="text-xs text-slate-500">
                Test platformasidan to'liq va samarali foydalanish bo'yicha 9 bosqichli ko'rsatma
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {steps.map(s => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0">
                  {s.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span>{s.title}</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
          >
            Tushundim, yopish
          </button>
        </div>
      </div>
    </div>
  );
};
