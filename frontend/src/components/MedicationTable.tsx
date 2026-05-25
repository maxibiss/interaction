import type { Medication, MedicationPayload } from '../types';
import { MedicationForm } from './MedicationForm';

interface Props {
  medications: Medication[];
  onAdd: (payload: Partial<MedicationPayload>) => Promise<void>;
  onUpdate: (medicationId: string, payload: Partial<MedicationPayload>) => Promise<void>;
  onDelete: (medicationId: string) => Promise<void>;
}

const fields: Array<keyof MedicationPayload> = [
  'generic_name',
  'brand_name',
  'din',
  'ndc',
  'strength',
  'form',
  'route',
  'frequency',
];

const labels: Record<string, string> = {
  generic_name: 'Générique',
  brand_name: 'Marque',
  din: 'DIN',
  ndc: 'NDC',
  strength: 'Force',
  form: 'Forme',
  route: 'Voie',
  frequency: 'Fréquence',
};

export function MedicationTable({ medications, onAdd, onUpdate, onDelete }: Props) {
  return (
    <section className="section">
      <div className="sectionTitle">
        <h2>Profil pharmacologique</h2>
        <span className="muted">{medications.length} médicament(s)</span>
      </div>
      <MedicationForm onSubmit={onAdd} />
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              {fields.map((field) => <th key={field}>{labels[field]}</th>)}
              <th>Statut</th>
              <th>Source</th>
              <th>Révision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((medication) => (
              <tr key={medication.medication_id}>
                {fields.map((field) => (
                  <td key={field}>
                    <input
                      className={field === 'generic_name' && !medication.generic_name.trim() ? 'invalid' : ''}
                      value={(medication[field] as string | null | undefined) ?? ''}
                      onChange={(event) => onUpdate(medication.medication_id, { [field]: event.target.value })}
                    />
                  </td>
                ))}
                <td>
                  <select
                    value={medication.status}
                    onChange={(event) => onUpdate(medication.medication_id, { status: event.target.value as Medication['status'] })}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                  <span className={`badge ${medication.status === 'active' ? 'ok' : 'quiet'}`}>
                    {medication.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td>
                  <span className="badge">{medication.source === 'pdf_import' ? 'PDF' : 'Manuel'}</span>
                </td>
                <td>
                  {medication.needs_review ? <span className="badge warn">À réviser</span> : <span className="muted">Validé</span>}
                </td>
                <td>
                  <button className="ghost" onClick={() => onUpdate(medication.medication_id, { needs_review: !medication.needs_review })}>Révision</button>
                  <button className="danger" onClick={() => onDelete(medication.medication_id)}>Supprimer</button>
                </td>
              </tr>
            ))}
            {medications.length === 0 && (
              <tr>
                <td colSpan={12} className="empty">Aucun médicament dans ce profil.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
