// StockSense ERP Export & Utility Engine
// Provides standard enterprise CSV export and data formatting

export function exportToCSV(filename, columns, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  // Format headers
  const headerKeys = columns.map(c => c.key);
  const headerLabels = columns.map(c => `"${(c.label || c.key).replace(/"/g, '""')}"`);

  // Format rows
  const csvRows = rows.map(row => {
    return headerKeys.map(key => {
      let val = row[key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',');
  });

  const csvContent = [headerLabels.join(','), ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

export function formatNumber(val) {
  return new Intl.NumberFormat('en-US').format(val || 0);
}
