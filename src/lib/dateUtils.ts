/**
 * Date Utilities ensuring local timezone accuracy.
 * Prevents UTC timezone shift bugs where `toISOString().split('T')[0]`
 * shifts backward/forward by 1 day in UTC+ or UTC- timezones.
 */

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getDayName(date: Date, lang: 'id' | 'en' = 'id'): string {
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNamesId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const names = lang === 'id' ? dayNamesId : dayNamesEn;
  return names[date.getDay()];
}

export function getFullDayName(date: Date, lang: 'id' | 'en' = 'id'): string {
  const fullNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fullNamesId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const names = lang === 'id' ? fullNamesId : fullNamesEn;
  return names[date.getDay()];
}
