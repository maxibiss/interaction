import type { ImportPdfResponse, InteractionResponse, Medication, MedicationPayload, Patient } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Erreur ${response.status}`;
    const rawBody = await response.text();
    if (rawBody) {
      try {
        const body = JSON.parse(rawBody) as { detail?: unknown };
        message = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail ?? body);
      } catch {
        message = rawBody;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  listPatients: () => request<Patient[]>('/api/patients'),
  createPatient: () => request<Patient>('/api/patients', {
    method: 'POST',
    body: JSON.stringify({ display_name: 'Nouveau patient' }),
  }),
  updatePatient: (patientId: string, payload: Partial<Patient>) => request<Patient>(`/api/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }),
  deletePatient: (patientId: string) => request<void>(`/api/patients/${patientId}`, { method: 'DELETE' }),
  listMedications: (patientId: string) => request<Medication[]>(`/api/patients/${patientId}/medications`),
  createMedication: (patientId: string, payload: Partial<MedicationPayload>) =>
    request<Medication>(`/api/patients/${patientId}/medications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMedication: (patientId: string, medicationId: string, payload: Partial<MedicationPayload>) =>
    request<Medication>(`/api/patients/${patientId}/medications/${medicationId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteMedication: (patientId: string, medicationId: string) =>
    request<void>(`/api/patients/${patientId}/medications/${medicationId}`, { method: 'DELETE' }),
  importPdf: (patientId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ImportPdfResponse>(`/api/patients/${patientId}/import-pdf`, { method: 'POST', body: form });
  },
  checkInteractions: (patientId: string) =>
    request<InteractionResponse>(`/api/patients/${patientId}/interactions/check`, { method: 'POST' }),
};
