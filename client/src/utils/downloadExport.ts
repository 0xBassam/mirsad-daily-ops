import apiClient from '../api/client';

export async function downloadExport(url: string, filename: string): Promise<void> {
  try {
    const res = await apiClient.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: String(res.headers['content-type'] ?? 'application/octet-stream') });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  } catch {
    throw new Error('Export failed');
  }
}
