import { useMemo, useState } from 'react';
import type {
  InteractionResponse,
  ParsedEvidencePayload,
  RxInteractionDetail,
  RxInteractionPair,
  RxLabelGuardResult,
  RxResolution,
} from '../types';

interface Props {
  onCheck: () => Promise<InteractionResponse>;
}

function parseArrayField<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function severityRank(value?: string): number {
  switch ((value ?? '').toLowerCase()) {
    case 'contraindicated':
      return 5;
    case 'major':
      return 4;
    case 'moderate':
      return 3;
    case 'minor':
      return 2;
    default:
      return 1;
  }
}

function severityTone(value?: string): string {
  switch ((value ?? '').toLowerCase()) {
    case 'contraindicated':
    case 'major':
      return 'danger';
    case 'moderate':
      return 'warn';
    case 'minor':
      return 'quiet';
    default:
      return '';
  }
}

function formatResolutionLabel(resolution: RxResolution): string {
  const target = resolution.genericName || resolution.inputName || 'Unknown drug';
  if (resolution.inputName && resolution.inputName.toLowerCase() !== target.toLowerCase()) {
    return `${resolution.inputName} -> ${target}`;
  }
  return target;
}

function normalizeResult(result: RxLabelGuardResult) {
  const resolutions = parseArrayField<RxResolution>(result.resolutions);
  const pairs = parseArrayField<RxInteractionPair>(result.pairs);
  const genericInteractions = Array.isArray(result.interactions) ? result.interactions : [];
  const errors = parseArrayField<string>(result.errors);
  return { resolutions, pairs, genericInteractions, errors };
}

function humanSourceLabel(source?: string): string {
  switch ((source ?? '').toUpperCase()) {
    case 'PAIRWISE':
      return 'Direct interaction';
    case 'DUPLICATE_THERAPY':
      return 'Therapeutic overlap';
    default:
      return source ?? 'Unspecified source';
  }
}

function tryParseEvidenceSnippet(snippet?: string): ParsedEvidencePayload | null {
  if (!snippet) return null;
  const trimmed = snippet.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as ParsedEvidencePayload;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function formatSourceMeta(interaction: RxInteractionDetail, parsedEvidence: ParsedEvidencePayload | null): string[] {
  const lines: string[] = [];
  if (interaction.targetName) lines.push(`Target: ${interaction.targetName}`);
  if (interaction.splSetId) lines.push(`SPL Set ID: ${interaction.splSetId}`);
  if (parsedEvidence?.pk) lines.push(`Record key: ${parsedEvidence.pk}`);
  if (parsedEvidence?.field) lines.push(`Evidence field: ${parsedEvidence.field}`);
  if (parsedEvidence?.rxcuiA || parsedEvidence?.rxcuiB) {
    lines.push(`RxCUI pair: ${parsedEvidence.rxcuiA ?? '?'} / ${parsedEvidence.rxcuiB ?? '?'}`);
  }
  if (parsedEvidence?.severity) {
    lines.push(`Embedded severity: ${parsedEvidence.severity}`);
  }
  return lines;
}

function InteractionPairCard({ pair, subdued = false }: { pair: RxInteractionPair; subdued?: boolean }) {
  return (
    <article className={`interactionCard ${subdued ? 'subdued' : ''}`}>
      <div className="interactionHeader">
        <strong>{pair.drugA} + {pair.drugB}</strong>
        <span className={`badge ${severityTone(pair.maxSeverity)}`}>{pair.maxSeverity ?? 'unknown'}</span>
      </div>
      <div className="interactionDetails">
        {pair.interactions.map((interaction: RxInteractionDetail, index: number) => (
          <InteractionDetailCard
            key={`${pair.drugA}-${pair.drugB}-${index}`}
            interaction={interaction}
            fallbackSeverity={pair.maxSeverity}
          />
        ))}        
      </div>
    </article>
  );
}

function InteractionDetailCard(
  { interaction, fallbackSeverity }: { interaction: RxInteractionDetail; fallbackSeverity?: string },
) {
  const parsedEvidence = tryParseEvidenceSnippet(interaction.evidenceSnippet);
  const sourceMeta = formatSourceMeta(interaction, parsedEvidence);
  const showTechnicalDetails = sourceMeta.length > 0 || Boolean(parsedEvidence);

  return (
    <div className="interactionItem">
      <div className="interactionMeta">
        <span className={`badge ${severityTone(interaction.severity)}`}>{interaction.severity ?? fallbackSeverity ?? 'unknown'}</span>
        {interaction.source && <span className="badge quiet">{humanSourceLabel(interaction.source)}</span>}
        {interaction.labelSection && <span className="badge quiet">{interaction.labelSection}</span>}
      </div>
      {interaction.mechanism && <div><strong>Mechanism:</strong> {interaction.mechanism}</div>}
      {interaction.recommendation && <div><strong>Recommendation:</strong> {interaction.recommendation}</div>}
      {interaction.evidenceSnippet && !parsedEvidence && (
        <div className="evidenceBlock"><strong>Evidence:</strong> {interaction.evidenceSnippet}</div>
      )}
      {showTechnicalDetails && (
        <details className="technicalBlock">
          <summary>Technical details</summary>
          <div className="technicalContent">
            {sourceMeta.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {parsedEvidence && (
              <pre>{JSON.stringify(parsedEvidence, null, 2)}</pre>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export function InteractionResults({ onCheck }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<InteractionResponse | null>(null);

  const normalized = useMemo(() => {
    if (!result) {
      return { resolutions: [], pairs: [], genericInteractions: [], errors: [] as string[] };
    }
    return normalizeResult(result.result);
  }, [result]);

  const highPriorityPairs = useMemo(
    () => normalized.pairs.filter((pair) => severityRank(pair.maxSeverity) >= severityRank('moderate')),
    [normalized.pairs],
  );

  const warningPairs = useMemo(
    () => normalized.pairs.filter((pair) => severityRank(pair.maxSeverity) < severityRank('moderate')),
    [normalized.pairs],
  );

  const coverageWarnings = useMemo(
    () => normalized.resolutions.filter((resolution) => resolution.resolved && (!resolution.splSetId || !resolution.labelUrl)),
    [normalized.resolutions],
  );

  async function run() {
    setLoading(true);
    setError('');
    try {
      setResult(await onCheck());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Interaction analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  const count = result?.result.interaction_count ?? normalized.pairs.length ?? normalized.genericInteractions.length;

  return (
    <section className="section">
      <div className="sectionTitle">
        <h2>Interaction analysis</h2>
        <button className="primary" disabled={loading} onClick={run}>{loading ? 'Running...' : 'Analyze interactions'}</button>
      </div>
      <p className="clinicalWarning">PoC only - do not use for clinical decision-making without professional validation.</p>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="results">
          <div className="resultMeta">
            <span><strong>Drugs analyzed:</strong> {result.drugs_analyzed.join(', ')}</span>
            <span><strong>Pairs with signals:</strong> {count}</span>
          </div>

          {normalized.resolutions.length > 0 && (
            <div className="interactionPanel">
              <h3>Drug resolution</h3>
              <div className="chipRow">
                {normalized.resolutions.map((resolution, index) => {
                  const extraBits = [resolution.rxcui ? `RxCUI ${resolution.rxcui}` : null].filter(Boolean).join(' - ');
                  return (
                    <span
                      key={`${resolution.inputName}-${index}`}
                      className={`badge ${resolution.resolved ? 'ok' : 'danger'}`}
                    >
                      {formatResolutionLabel(resolution)}{extraBits ? ` - ${extraBits}` : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {coverageWarnings.length > 0 && (
            <div className="notice">
              FDA label coverage not confirmed for: {coverageWarnings.map((item) => formatResolutionLabel(item)).join(', ')}.
            </div>
          )}

          {highPriorityPairs.length > 0 && (
            <div className="interactionPanel">
              <h3>Higher-priority findings</h3>
              {highPriorityPairs.map((pair, index) => (
                <InteractionPairCard key={`${pair.drugA}-${pair.drugB}-${index}`} pair={pair} />
              ))}
            </div>
          )}

          {warningPairs.length > 0 && (
            <div className="interactionPanel">
              <h3>Lower-priority warnings</h3>
              {warningPairs.map((pair, index) => (
                <InteractionPairCard key={`${pair.drugA}-${pair.drugB}-${index}`} pair={pair} subdued />
              ))}
            </div>
          )}

          {normalized.errors.length > 0 && (
            <div className="error">{normalized.errors.join(' ')}</div>
          )}

          {result.result.disclaimer && (
            <div className="disclaimerText">{result.result.disclaimer}</div>
          )}

          {normalized.pairs.length === 0 && normalized.genericInteractions.length > 0 && (
            <pre>{JSON.stringify(normalized.genericInteractions, null, 2)}</pre>
          )}

          {normalized.pairs.length === 0 && normalized.genericInteractions.length === 0 && (
            <pre>{JSON.stringify(result.result, null, 2)}</pre>
          )}
        </div>
      )}
    </section>
  );
}
