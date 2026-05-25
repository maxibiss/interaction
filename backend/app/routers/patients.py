from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.models.patient import Patient, PatientCreate, PatientUpdate
from app.services.patient_store import store

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[Patient])
def list_patients() -> list[Patient]:
    return store.list_patients()


@router.post("", response_model=Patient, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate) -> Patient:
    return store.create_patient(payload)


@router.get("/{patient_id}", response_model=Patient)
def get_patient(patient_id: str) -> Patient:
    return store.get_patient(patient_id)


@router.patch("/{patient_id}", response_model=Patient)
def update_patient(patient_id: str, payload: PatientUpdate) -> Patient:
    return store.update_patient(patient_id, payload)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: str) -> Response:
    store.delete_patient(patient_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
