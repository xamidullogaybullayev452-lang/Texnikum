import * as XLSX from 'xlsx';
import { TestAttempt } from '../types';

export function exportResultsToExcel(attempts: TestAttempt[], filenamePrefix = 'Test_Natijalari') {
  if (!attempts || attempts.length === 0) {
    alert("Eksport qilish uchun ma'lumot mavjud emas.");
    return;
  }

  // Format rows according to Section 20 requirements:
  // O'quvchi, Familiya, Telefon, Guruh, Test, Sana, Ball, Maksimal ball, Foiz, Natija, Sarflangan vaqt, Oynadan chiqishlar
  const rows = attempts.map(att => {
    const names = (att.studentName || '').split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    const minutes = Math.floor((att.timeSpentSeconds || 0) / 60);
    const seconds = (att.timeSpentSeconds || 0) % 60;
    const timeFormatted = `${minutes} daq ${seconds < 10 ? '0' : ''}${seconds} son`;

    const d = att.submittedAt ? new Date(att.submittedAt) : (att.startTime ? new Date(att.startTime) : new Date());
    const dateFormatted = d.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      "O'quvchi": firstName,
      "Familiya": lastName,
      "Telefon": att.studentPhone || '',
      "Guruh": att.groupName || '',
      "Test": att.testTitle || '',
      "Sana": dateFormatted,
      "Ball": att.score,
      "Maksimal ball": att.maxScore,
      "Foiz": `${att.percentage}%`,
      "Natija": att.status === 'passed' ? "O'TDI" : "O'TMADI",
      "Sarflangan vaqt": timeFormatted,
      "Oynadan chiqishlar": att.windowExitCount
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 15 }, // Ism
    { wch: 18 }, // Familiya
    { wch: 16 }, // Telefon
    { wch: 12 }, // Guruh
    { wch: 32 }, // Test
    { wch: 18 }, // Sana
    { wch: 8 },  // Ball
    { wch: 14 }, // Maksimal ball
    { wch: 10 }, // Foiz
    { wch: 12 }, // Natija
    { wch: 18 }, // Vaqt
    { wch: 18 }  // Oynadan chiqishlar
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Natijalar');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}_${timestamp}.xlsx`);
}
