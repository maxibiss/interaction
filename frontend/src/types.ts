export type MedicationStatus = 'active' | 'inactive';
export type MedicationSource = 'manual' | 'pdf_import';

export interface Patient {
  patient_id: string;
  display_name: string;
  date_of_birth?: string | null;
  notes?: string | null;
  pdf_imported: boolean;
}

export interface Medication {
  medication_id: string;
  generic_name: string;
  brand_name?: string | null;
  din?: string | null;
  ndc?: string | null;
  strength?: string | null;
  form?: string | null;
  route?: string | null;
  sig?: string | null;
  frequency?: string | null;
  status: MedicationStatus;
  source: MedicationSource;
  raw_text?: string | null;
  confidence?: number | null;
  needs_review: boolean;
  notes?: string | null;
}

export type MedicationPayload = Omit<Medication, 'medication_id'>;

export interface ImportPdfResponse {
  raw_text: string;
  page_count: number;
  extraction_method: string;
  medications_added: Medication[];
}

export interface InteractionResponse {
  drugs_analyzed: string[];
  result: RxLabelGuardResult;
}

export interface RxResolution {
  inputName: string;
  rxcui?: string | null;
  genericName?: string | null;
  brandNames?: string[] | null;
  splSetId?: string | null;
  labelUrl?: string | null;
  resolved?: boolean;
}

export interface RxInteractionDetail {
  source?: string;
  targetName?: string;
  severity?: string;
  mechanism?: string;
  recommendation?: string;
  evidenceSnippet?: string;
  labelSection?: string;
  splSetId?: string | null;
}

export interface ParsedEvidencePayload {
  field?: string;
  pk?: string;
  rxcuiLow?: string;
  rxcuiHigh?: string;
  rxcuiA?: string;
  rxcuiB?: string;
  drugA?: string;
  drugB?: string;
  severity?: string;
  [key: string]: unknown;
}

export interface RxInteractionPair {
  drugA: string;
  drugB: string;
  maxSeverity?: string;
  interactions: RxInteractionDetail[];
}

export interface RxLabelGuardResult {
  mock?: boolean;
  drugs?: string[];
  interaction_count?: number;
  interactions?: Array<Record<string, unknown>>;
  resolutions?: RxResolution[] | string;
  pairs?: RxInteractionPair[] | string;
  disclaimer?: string;
  errors?: string[] | string;
  summary?: string | null;
  [key: string]: unknown;
}
