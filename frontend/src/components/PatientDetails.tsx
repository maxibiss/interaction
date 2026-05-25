import type { Patient } from '../types';

interface Props {
  patient: Patient;
  onChange: (payload: Partial<Patient>) => void;
  onDelete: () => void;
}

export function PatientDetails({ patient, onChange, onDelete }: Props) {
  return (
    <section className="section">
      <div className="sectionTitle">
        <h2>Informations patient</h2>
        <button className="danger" onClick={onDelete}>Supprimer</button>
      </div>
      <div className="formGrid">
        <label>
          Nom affiché
          <input
            value={patient.display_name}
            onChange={(event) => onChange({ display_name: event.target.value })}
          />
        </label>
        <label>
          Date de naissance
          <input
            type="date"
            value={patient.date_of_birth ?? ''}
            onChange={(event) => onChange({ date_of_birth: event.target.value || null })}
          />
        </label>
        <label className="wide">
          Notes
          <textarea
            value={patient.notes ?? ''}
            onChange={(event) => onChange({ notes: event.target.value })}
            rows={3}
          />
        </label>
      </div>
    </section>
  );
}
