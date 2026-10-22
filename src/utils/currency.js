/**
 * Currency & Integer Paise Financial Arithmetic Utilities
 * 
 * Strict decimal-safe implementation:
 * Uses integer paise (1 Rupee = 100 Paise) for all additions,
 * subtractions, and balance derivations to prevent binary floating-point errors.
 */

/**
 * Convert any Rupee amount (number or numeric string) into integer Paise safely.
 * e.g. 1250.50 -> 125050
 */
export function toPaise(rupees) {
  if (rupees === null || rupees === undefined || isNaN(rupees)) {
    return 0;
  }
  const num = typeof rupees === 'string' ? parseFloat(rupees.replace(/,/g, '')) : Number(rupees);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Convert integer Paise back into decimal Rupees.
 * e.g. 125050 -> 1250.50
 */
export function toRupees(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return 0;
  }
  return Number((Number(paise) / 100).toFixed(2));
}

/**
 * Format a Rupee amount into standard Indian currency representation.
 * Follows the Indian numbering system: ₹ 1,23,45,678.00 (Lakhs & Crores).
 */
export function formatINR(rupees, options = {}) {
  const {
    showDecimals = true,
    includeSymbol = true,
    signDisplay = 'auto',
  } = options;

  const num = typeof rupees === 'number' ? rupees : parseFloat(rupees || 0);
  if (isNaN(num)) return includeSymbol ? '₹ 0.00' : '0.00';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
    signDisplay,
  });

  return formatter.format(num);
}

/**
 * Format directly from an integer Paise value.
 */
export function formatPaise(paise, options = {}) {
  return formatINR(toRupees(paise), options);
}

/**
 * Calculate financial totals safely using integer paise arithmetic.
 * Formula: Closing Balance = Opening Balance + Total Credits − Total Debits
 * 
 * @param {number} openingBalanceRupees - Initial opening balance in INR
 * @param {Array} transactions - Active (non-deleted) transactions
 * @returns {Object} Totals and balance calculated in both Paise and Rupees
 */
export function calculateTotals(openingBalanceRupees, transactions = []) {
  const openingPaise = toPaise(openingBalanceRupees);
  let totalCreditsPaise = 0;
  let totalDebitsPaise = 0;

  for (const tx of transactions) {
    if (tx.isDeleted) continue;
    // Prefer integer amountInPaise if stored, otherwise derive from amount
    const txPaise = tx.amountInPaise !== undefined && tx.amountInPaise !== null
      ? Math.round(Number(tx.amountInPaise))
      : toPaise(tx.amount);

    if (tx.transactionType === 'CREDIT') {
      totalCreditsPaise += txPaise;
    } else if (tx.transactionType === 'DEBIT') {
      totalDebitsPaise += txPaise;
    }
  }

  const closingBalancePaise = openingPaise + totalCreditsPaise - totalDebitsPaise;

  return {
    openingBalance: toRupees(openingPaise),
    openingBalancePaise: openingPaise,
    totalCredits: toRupees(totalCreditsPaise),
    totalCreditsPaise,
    totalDebits: toRupees(totalDebitsPaise),
    totalDebitsPaise,
    closingBalance: toRupees(closingBalancePaise),
    closingBalancePaise,
    transactionCount: transactions.filter(t => !t.isDeleted).length,
  };
}

/**
 * Attach running balances chronologically to a list of transactions.
 * Transactions are sorted chronologically (oldest first) to compute running balance,
 * then returned in the desired display order.
 */
export function computeRunningBalances(openingBalanceRupees, transactions = [], displayOrder = 'desc') {
  const openingPaise = toPaise(openingBalanceRupees);
  
  // Clone and sort chronologically (oldest first) for running balance
  const activeTxs = transactions.filter(t => !t.isDeleted);
  
  const sortedAsc = [...activeTxs].sort((a, b) => {
    // 1. Transaction Date
    const dateComp = (a.transactionDate || '').localeCompare(b.transactionDate || '');
    if (dateComp !== 0) return dateComp;

    // 2. CreatedAt Timestamp
    const aTime = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const bTime = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    if (aTime !== bTime) return aTime - bTime;

    // 3. Deterministic tiebreaker by ID
    return (a.id || '').localeCompare(b.id || '');
  });

  let currentRunningPaise = openingPaise;
  const withBalances = sortedAsc.map(tx => {
    const txPaise = tx.amountInPaise !== undefined && tx.amountInPaise !== null
      ? Math.round(Number(tx.amountInPaise))
      : toPaise(tx.amount);

    if (tx.transactionType === 'CREDIT') {
      currentRunningPaise += txPaise;
    } else {
      currentRunningPaise -= txPaise;
    }

    return {
      ...tx,
      runningBalancePaise: currentRunningPaise,
      runningBalance: toRupees(currentRunningPaise),
    };
  });

  if (displayOrder === 'desc') {
    return withBalances.reverse();
  }
  return withBalances;
}

/**
 * Convert number to Indian words for receipt/voucher validation check
 */
export function numberToIndianWords(num) {
  if (num === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'overflow';
    const nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArr) return '';
    let str = '';
    str += Number(nArr[1]) !== 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'Crore ' : '';
    str += Number(nArr[2]) !== 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'Lakh ' : '';
    str += Number(nArr[3]) !== 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'Thousand ' : '';
    str += Number(nArr[4]) !== 0 ? (a[Number(nArr[4])] || b[nArr[4][0]] + ' ' + a[nArr[4][1]]) + 'Hundred ' : '';
    str += Number(nArr[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
    return str.trim();
  }

  const rounded = Math.floor(Math.abs(num));
  const words = inWords(rounded);
  return words ? words + ' Rupees Only' : '';
}
