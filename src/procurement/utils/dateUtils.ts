import { ProcurementStatus } from '../types/procurement';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a date string (YYYY-MM-DD or ISO) into "13 Sep 2026"
 * Req #60: Display dates professionally
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${day.toString().padStart(2, '0')} ${MONTH_NAMES[monthIndex]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate().toString().padStart(2, '0');
      const month = MONTH_NAMES[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr || '—';
  }
}

/**
 * Formats date and time into "13 Sep 2026, 04:30 PM"
 */
export function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const dateFormatted = formatDate(isoStr);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${dateFormatted}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  } catch {
    return isoStr || '—';
  }
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds specified number of calendar days to YYYY-MM-DD date string
 */
export function addDays(dateStr?: string, days: number = 0): string {
  if (!dateStr) return '';
  try {
    const cleanStr = dateStr.split('T')[0];
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      d.setDate(d.getDate() + days);
      const resYear = d.getFullYear();
      const resMonth = (d.getMonth() + 1).toString().padStart(2, '0');
      const resDay = d.getDate().toString().padStart(2, '0');
      return `${resYear}-${resMonth}-${resDay}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      const resYear = d.getFullYear();
      const resMonth = (d.getMonth() + 1).toString().padStart(2, '0');
      const resDay = d.getDate().toString().padStart(2, '0');
      return `${resYear}-${resMonth}-${resDay}`;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Calculates status for Daily Material & Daily Packaging Procurement items
 * Rule: Expected Material Receipt Date <= Actual Material Receipt Date ? 'on-time' : 'delayed'
 */
export function calculateMaterialStatus(expectedDate?: string, actualDate?: string): ProcurementStatus {
  if (actualDate && actualDate.trim() !== '') {
    if (expectedDate && expectedDate.trim() !== '') {
      return actualDate <= expectedDate ? 'on-time' : 'delayed';
    }
    return 'on-time';
  }
  if (expectedDate && expectedDate.trim() !== '') {
    const todayStr = getTodayDateString();
    return todayStr <= expectedDate ? 'on-time' : 'delayed';
  }
  return 'pending';
}

/**
 * Calculates item status based on target date, actual receipt date, and current date
 * Rule: actualDate <= targetDate ? 'on-time' : 'delayed'
 */
export function calculateStatus(targetDate?: string, actualDate?: string): ProcurementStatus {
  const checkTarget = targetDate && targetDate.trim() !== '' ? targetDate : '';

  if (actualDate && actualDate.trim() !== '') {
    if (checkTarget) {
      return actualDate <= checkTarget ? 'on-time' : 'delayed';
    }
    return 'on-time';
  }
  
  if (!checkTarget) return 'pending';

  const todayStr = getTodayDateString();
  return todayStr <= checkTarget ? 'on-time' : 'delayed';
}

/**
 * Calculates days remaining or days delayed
 */
export function getDaysDiffText(targetDate: string, actualDate?: string): { text: string; isDelayed: boolean } {
  if (actualDate) {
    return { text: 'Delivered', isDelayed: false };
  }
  if (!targetDate) return { text: 'No target date', isDelayed: false };

  const today = new Date(getTodayDateString());
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} delayed`, isDelayed: true };
  } else if (diffDays === 0) {
    return { text: 'Due today', isDelayed: false };
  } else {
    return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, isDelayed: false };
  }
}
