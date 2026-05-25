from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.models.interactions import InteractionCheckResult
from app.services.patient_store import store
from app.services.rx_label_guard_client import RxLabelGuardClient

router = APIRouter(prefix="/patients/{patient_id}/interactions", tags=["interactions"])


@router.post("/check", response_model=InteractionCheckResult)
async def check_interactions(patient_id: str) -> InteractionCheckResult:
    medications = store.list_medications(patient_id)
    drugs = sorted(
        {
            medication.generic_name.strip()
            for medication in medications
            if medication.status == "active" and medication.generic_name and medication.generic_name.strip()
        }
    )
    if not drugs:
        raise HTTPException(status_code=400, detail="Aucun médicament actif à analyser.")

    client = RxLabelGuardClient(get_settings())
    result = await client.check_interactions(drugs)
    return InteractionCheckResult(drugs_analyzed=drugs, result=result)
