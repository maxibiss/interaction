import { useState } from 'react';
import type { ImportPdfResponse, Patient } from '../types';

interface Props {
  patient: Patient;
  onImport: (file: File) => Promise<ImportPdfResponse>;
}

export function PdfImport({ patient, onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportPdfResponse | null>(null);
  const [error, setError] = useState('');

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      setResult(await onImport(file));
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur import PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="sectionTitle">
        <h2>Import PDF</h2>
        {patient.pdf_imported && <span className="badge quiet">Import verrouillé</span>}
      </div>
      {patient.pdf_imported ? (
        <p className="notice">Un PDF a déjà été importé pour ce patient. Les modifications doivent maintenant être faites manuellement.</p>
      ) : (
        <div className="importRow">
          <input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <button className="primary" disabled={!file || loading} onClick={submit}>{loading ? 'Import...' : 'Importer'}</button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="importSummary">
          <strong>{result.medications_added.length} médicament(s) ajouté(s)</strong>
          <span>{result.page_count} page(s), méthode {result.extraction_method}</span>
        </div>
      )}
    </section>
  );
}
