from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    display_name: str = Field(min_length=1)
    date_of_birth: Optional[str] = None
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1)
    date_of_birth: Optional[str] = None
    notes: Optional[str] = None


class Patient(PatientBase):
    patient_id: str
    pdf_imported: bool = False
