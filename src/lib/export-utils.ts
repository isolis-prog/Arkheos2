import Papa from 'papaparse';

export function exportToCsv<T extends object>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
) {
  if (data.length === 0) return;

  let exportData: Record<string, unknown>[];

  if (columns) {
    // Map data to use custom headers
    exportData = data.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      columns.forEach((col) => {
        mappedRow[col.header] = row[col.key];
      });
      return mappedRow;
    });
  } else {
    exportData = data as Record<string, unknown>[];
  }

  const csv = Papa.unparse(exportData);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export async function exportToExcel<T extends object>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
) {
  if (data.length === 0) return;

  // Dynamic import for xlsx to reduce initial bundle size
  const XLSX = await import('xlsx');

  let exportData: Record<string, unknown>[];

  if (columns) {
    exportData = data.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      columns.forEach((col) => {
        mappedRow[col.header] = row[col.key];
      });
      return mappedRow;
    });
  } else {
    exportData = data as Record<string, unknown>[];
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(exportData[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...exportData.map((row) => String(row[key] ?? '').length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
