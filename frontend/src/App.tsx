import { useEffect, useMemo, useState } from 'react';
import { api } from './api/client';
import { InteractionResults } from './components/InteractionResults';
import { MedicationTable } from './components/MedicationTable';
import { PatientDetails } from './components/PatientDetails';
import { PatientList } from './components/PatientList';
import { PdfImport } from './components/PdfImport';
import type { Medication, MedicationPayload, Patient } from './types';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState('');

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.patient_id === selectedId),
    [patients, selectedId],
  );

  async function loadPatients(nextSelectedId?: string) {
    const list = await api.listPatients();
    setPatients(list);
    setSelectedId(nextSelectedId ?? selectedId ?? list[0]?.patient_id);
  }

  async function loadMedications(patientId: string) {
    setMedications(await api.listMedications(patientId));
  }

  useEffect(() => {
    loadPatients().catch((err) => setError(err instanceof Error ? err.message : 'Erreur chargement patients.'));
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMedications(selectedId).catch((err) => setError(err instanceof Error ? err.message : 'Erreur chargement médicaments.'));
    } else {
      setMedications([]);
    }
  }, [selectedId]);

  async function createPatient() {
    try {
      const patient = await api.createPatient();
      await loadPatients(patient.patient_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création patient.');
    }
  }

  async function updatePatient(payload: Partial<Patient>) {
    if (!selectedPatient) return;
    const previous = selectedPatient;
    setPatients((items) => items.map((item) => item.patient_id === previous.patient_id ? { ...item, ...payload } : item));
    try {
      const updated = await api.updatePatient(previous.patient_id, payload);
      setPatients((items) => items.map((item) => item.patient_id === updated.patient_id ? updated : item));
    } catch (err) {
      setPatients((items) => items.map((item) => item.patient_id === previous.patient_id ? previous : item));
      setError(err instanceof Error ? err.message : 'Erreur mise à jour patient.');
    }
  }

  async function deletePatient() {
    if (!selectedPatient || !window.confirm(`Supprimer ${selectedPatient.display_name} ?`)) return;
    try {
      await api.deletePatient(selectedPatient.patient_id);
      const remaining = patients.filter((patient) => patient.patient_id !== selectedPatient.patient_id);
      setPatients(remaining);
      setSelectedId(remaining[0]?.patient_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression patient.');
    }
  }

  async function addMedication(payload: Partial<MedicationPayload>) {
    if (!selectedId) return;
    if (!payload.generic_name?.trim()) {
      setError('Le nom générique est obligatoire.');
      return;
    }
    await api.createMedication(selectedId, payload);
    await loadMedications(selectedId);
  }

  async function updateMedication(medicationId: string, payload: Partial<MedicationPayload>) {
    if (!selectedId) return;
    if ('generic_name' in payload && !payload.generic_name?.trim()) {
      setError('Le nom générique est obligatoire.');
      return;
    }
    try {
      const previous = medications;
      setMedications((items) => items.map((item) => item.medication_id === medicationId ? { ...item, ...payload } : item));
      const updated = await api.updateMedication(selectedId, medicationId, payload);
      setMedications((items) => items.map((item) => item.medication_id === medicationId ? updated : item));
      setError('');
      void previous;
    } catch (err) {
      await loadMedications(selectedId);
      setError(err instanceof Error ? err.message : 'Erreur mise à jour médicament.');
    }
  }

  async function deleteMedication(medicationId: string) {
    if (!selectedId) return;
    await api.deleteMedication(selectedId, medicationId);
    await loadMedications(selectedId);
  }

  async function importPdf(file: File) {
    if (!selectedId) throw new Error('Aucun patient sélectionné.');
    const result = await api.importPdf(selectedId, file);
    await loadPatients(selectedId);
    await loadMedications(selectedId);
    return result;
  }

  return (
    <div className="appShell">
      <PatientList patients={patients} selectedId={selectedId} onCreate={createPatient} onSelect={setSelectedId} />
      <main className="mainPane">
        <div className="topBar">
          <div>
            <strong>Profils pharmacologiques</strong>
            <span>PoC local FastAPI + React</span>
          </div>
          <span className="clinicalWarning compact">PoC seulement — validation professionnelle requise.</span>
        </div>
        {error && <button className="error dismiss" onClick={() => setError('')}>{error}</button>}
        {selectedPatient ? (
          <>
            <PatientDetails patient={selectedPatient} onChange={updatePatient} onDelete={deletePatient} />
            <MedicationTable medications={medications} onAdd={addMedication} onUpdate={updateMedication} onDelete={deleteMedication} />
            <PdfImport patient={selectedPatient} onImport={importPdf} />
            <InteractionResults onCheck={() => selectedId ? api.checkInteractions(selectedId) : Promise.reject(new Error('Aucun patient sélectionné.'))} />
          </>
        ) : (
          <section className="section emptyState">Créez ou sélectionnez un patient pour commencer.</section>
        )}
      </main>
    </div>
  );
}
