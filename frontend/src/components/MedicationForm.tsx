import { useState } from 'react';
import type { MedicationPayload } from '../types';

interface Props {
  onSubmit: (payload: Partial<MedicationPayload>) => Promise<void>;
}

const emptyMedication: Partial<MedicationPayload> = {
  generic_name: '',
  brand_name: '',
  din: '',
  ndc: '',
  strength: '',
  form: '',
  route: '',
  frequency: '',
  sig: '',
  status: 'active',
  source: 'manual',
  needs_review: false,
  notes: '',
};

export function MedicationForm({ onSubmit }: Props) {
  const [draft, setDraft] = useState<Partial<MedicationPayload>>(emptyMedication);
  const [error, setError] = useState('');

  async function submit() {
    if (!draft.generic_name?.trim()) {
      setError('Le nom générique est obligatoire.');
      return;
    }
    setError('');
    await onSubmit({ ...draft, generic_name: draft.generic_name.trim(), source: 'manual' });
    setDraft(emptyMedication);
  }

  return (
    <div className="addForm">
      <input placeholder="Nom générique" value={draft.generic_name ?? ''} onChange={(e) => setDraft({ ...draft, generic_name: e.target.value })} />
      <input placeholder="Marque" value={draft.brand_name ?? ''} onChange={(e) => setDraft({ ...draft, brand_name: e.target.value })} />
      <input placeholder="Force" value={draft.strength ?? ''} onChange={(e) => setDraft({ ...draft, strength: e.target.value })} />
      <input placeholder="Fréquence" value={draft.frequency ?? ''} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })} />
      <button className="primary" onClick={submit}>Ajouter</button>
      {error && <div className="inlineError">{error}</div>}
    </div>
  );
}
