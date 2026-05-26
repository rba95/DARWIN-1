import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Garde le reste de tes fonctions (downloadDat, previewDat) identiques
export type ExportFormat = 'docx' | 'pdf' | 'odt';

export async function downloadDat(data: unknown, format: ExportFormat = 'docx') {
  const response = await api.post(`/generate?format=${format}`, data, {
    responseType: 'blob',
  });
  return response.data;
}

export async function previewDat(data: unknown): Promise<string> {
  const response = await api.post('/generate?format=pdf', data, {
    responseType: 'blob',
  });
  return new Promise((resolve) => {
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    resolve(url);
  });
}

export default api;