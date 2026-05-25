from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.core.errors import bad_request
from app.models.medication import Medication
from app.services.medication_parser import parse_medications_from_text
from app.services.patient_store import store
from app.services.pdf_extractor import extract_pdf_text

router = APIRouter(prefix="/patients/{patient_id}", tags=["pdf"])


@router.post("/import-pdf")
async def import_pdf(patient_id: str, file: UploadFile = File(...)) -> dict:
    patient = store.get_patient(patient_id)
    if patient.pdf_imported:
        raise bad_request("Un PDF a déjà été importé pour ce patient.")
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise bad_request("Le fichier importé doit être un PDF.")

    file_bytes = await file.read()
    raw_text, page_count = extract_pdf_text(file_bytes)
    parsed = parse_medications_from_text(raw_text)
    added: list[Medication] = store.add_medications(patient_id, parsed)
    store.mark_pdf_imported(patient_id)

    return {
        "raw_text": raw_text,
        "page_count": page_count,
        "extraction_method": "pymupdf_native_text",
        "medications_added": added,
    }
