import type { Patient } from '../types';

interface Props {
  patients: Patient[];
  selectedId?: string;
  onCreate: () => void;
  onSelect: (patientId: string) => void;
}

export function PatientList({ patients, selectedId, onCreate, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <h1>Patients</h1>
        <button className="primary" onClick={onCreate}>Créer</button>
      </div>
      <div className="patientList">
        {patients.map((patient) => (
          <button
            key={patient.patient_id}
            className={`patientItem ${patient.patient_id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(patient.patient_id)}
          >
            <span>{patient.display_name}</span>
            <small>{patient.patient_id}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
