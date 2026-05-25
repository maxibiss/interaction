from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.models.medication import Medication, MedicationCreate, MedicationUpdate
from app.services.patient_store import store

router = APIRouter(prefix="/patients/{patient_id}/medications", tags=["medications"])


@router.get("", response_model=list[Medication])
def list_medications(patient_id: str) -> list[Medication]:
    return store.list_medications(patient_id)


@router.post("", response_model=Medication, status_code=status.HTTP_201_CREATED)
def create_medication(patient_id: str, payload: MedicationCreate) -> Medication:
    payload.source = "manual"
    return store.add_medication(patient_id, payload)


@router.patch("/{medication_id}", response_model=Medication)
def update_medication(patient_id: str, medication_id: str, payload: MedicationUpdate) -> Medication:
    return store.update_medication(patient_id, medication_id, payload)


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(patient_id: str, medication_id: str) -> Response:
    store.delete_medication(patient_id, medication_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
