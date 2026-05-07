import apiClient from '../api/client';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

function demoCsv(url: string): string {
  const label = url.split('/').filter(Boolean).slice(1).join(' / ').replace(/_/g, ' ');
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return [
    '"MIRSAD DAILY OPS — Demo Export"',
    `"Report: ${label}"`,
    `"Generated: ${ts}"`,
    '"Note: This is a demo CSV. Full PDF and Excel exports are available on the live server."',
    '',
    '"#","Column A","Column B","Column C","Column D"',
    '"1","Demo value 1","Demo value 2","active","2026-05-07"',
    '"2","Demo value 3","Demo value 4","confirmed","2026-05-06"',
    '"3","Demo value 5","Demo value 6","in_progress","2026-05-05"',
  ].join('\r\n');
}

export async function downloadExport(url: string, filename: string): Promise<void> {
  // In demo mode (GitHub Pages), the backend is not reachable.
  // Generate a demo CSV so the button visibly works.
  if (IS_DEMO) {
    const csv = demoCsv(url);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename.replace(/\.(pdf|xlsx)$/, '_demo.csv'));
    return;
  }

  const res = await apiClient.get(url, { responseType: 'blob' });

  // Reject HTML responses — these are SPA fallbacks or error pages, not real files.
  const contentType = String(res.headers['content-type'] ?? '');
  if (contentType.includes('text/html')) {
    throw new Error('Server returned an HTML page instead of a file. The export endpoint may be unreachable.');
  }

  const blob = new Blob([res.data], { type: contentType || 'application/octet-stream' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}
