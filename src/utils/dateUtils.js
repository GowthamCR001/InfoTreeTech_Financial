/**
 * Date formatting, parsing, and deterministic ordering utilities
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format YYYY-MM-DD to human readable string (e.g. "22 Oct 2026")
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const shortMonth = MONTH_NAMES[monthIndex]?.substring(0, 3) || parts[1];
      return `${day.toString().padStart(2, '0')} ${shortMonth} ${year}`;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format Firestore Timestamp or ISO date to display timestamp (e.g. "22 Oct 2026, 10:15 AM")
 */
export function formatDisplayDateTime(val) {
  if (!val) return '—';
  try {
    let date;
    if (val.seconds) {
      date = new Date(val.seconds * 1000);
    } else if (typeof val === 'string' || typeof val === 'number') {
      date = new Date(val);
    } else if (val instanceof Date) {
      date = val;
    }
    if (!date || isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * Extract Year and Month from a date string (YYYY-MM-DD)
 */
export function extractYearMonth(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: String(now.getMonth() + 1).padStart(2, '0'),
      monthName: MONTH_NAMES[now.getMonth()],
      yearMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    };
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const monthInt = parseInt(parts[1], 10);
  return {
    year,
    month: String(monthInt).padStart(2, '0'),
    monthName: MONTH_NAMES[monthInt - 1] || '',
    yearMonth: `${year}-${String(monthInt).padStart(2, '0')}`,
  };
}

/**
 * Get current date string formatted as YYYY-MM-DD (local time)
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically sort transactions:
 * 1. Transaction Date (descending or ascending)
 * 2. CreatedAt Timestamp
 * 3. Transaction ID
 */
export function sortTransactions(transactions = [], order = 'desc') {
  return [...transactions].sort((a, b) => {
    const dateComp = (a.transactionDate || '').localeCompare(b.transactionDate || '');
    if (dateComp !== 0) {
      return order === 'desc' ? -dateComp : dateComp;
    }

    const aTime = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    if (aTime !== bTime) {
      return order === 'desc' ? bTime - aTime : aTime - bTime;
    }

    const idComp = (a.id || '').localeCompare(b.id || '');
    return order === 'desc' ? -idComp : idComp;
  });
}
