/**
 * Financial CSV Exporter for Transactions & Reports
 */
import { formatINR } from './currency';
import { formatDisplayDate, formatDisplayDateTime } from './dateUtils';

export function exportTransactionsToCSV(transactions, options = {}) {
  const {
    filename = `company-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    companyName = 'Company Financials',
    filters = {},
  } = options;

  const headers = [
    'Transaction ID',
    'Date',
    'Month-Year',
    'Type',
    'Description',
    'Contact Name',
    'Contact Number',
    'Credit (INR)',
    'Debit (INR)',
    'Running Balance (INR)',
    'Payment Method',
    'Reference Number',
    'Notes',
    'Created By',
    'Created Timestamp'
  ];

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map(tx => {
    const isCredit = tx.transactionType === 'CREDIT';
    const creditAmt = isCredit ? (tx.amount || 0).toFixed(2) : '0.00';
    const debitAmt = !isCredit ? (tx.amount || 0).toFixed(2) : '0.00';
    const runningBal = tx.runningBalance !== undefined ? tx.runningBalance.toFixed(2) : '';

    return [
      escapeCSV(tx.id || ''),
      escapeCSV(tx.transactionDate || ''),
      escapeCSV(tx.month ? `${tx.year || ''}-${tx.month}` : ''),
      escapeCSV(tx.transactionType || ''),
      escapeCSV(tx.description || ''),
      escapeCSV(tx.contactName || ''),
      escapeCSV(tx.contactNumber || ''),
      escapeCSV(creditAmt),
      escapeCSV(debitAmt),
      escapeCSV(runningBal),
      escapeCSV(tx.paymentMethod || ''),
      escapeCSV(tx.referenceNumber || ''),
      escapeCSV(tx.notes || ''),
      escapeCSV(tx.createdByName || tx.createdByEmail || tx.createdBy || ''),
      escapeCSV(formatDisplayDateTime(tx.createdAt)),
    ].join(',');
  });

  // Include Company and metadata header block
  const metadataBlock = [
    `# ${escapeCSV(companyName)} - Transaction Register Export`,
    `# Generated At: ${escapeCSV(new Date().toLocaleString('en-IN'))}`,
    `# Total Records: ${transactions.length}`,
    ''
  ].join('\n');

  const csvContent = metadataBlock + [headers.join(','), ...rows].join('\n');

  // Trigger browser download with BOM for Excel UTF-8 support
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
