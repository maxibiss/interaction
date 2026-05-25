from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


MedicationStatus = Literal["active", "inactive"]
MedicationSource = Literal["manual", "pdf_import"]


class MedicationBase(BaseModel):
    generic_name: str = Field(min_length=1)
    brand_name: Optional[str] = None
    din: Optional[str] = None
    ndc: Optional[str] = None
    strength: Optional[str] = None
    form: Optional[str] = None
    route: Optional[str] = None
    sig: Optional[str] = None
    frequency: Optional[str] = None
    status: MedicationStatus = "active"
    source: MedicationSource = "manual"
    raw_text: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    needs_review: bool = False
    notes: Optional[str] = None

    @model_validator(mode="after")
    def normalize_generic_name(self) -> "MedicationBase":
        self.generic_name = self.generic_name.strip()
        if not self.generic_name:
            raise ValueError("generic_name est obligatoire.")
        return self


class MedicationCreate(MedicationBase):
    source: MedicationSource = "manual"


class MedicationUpdate(BaseModel):
    generic_name: Optional[str] = Field(default=None, min_length=1)
    brand_name: Optional[str] = None
    din: Optional[str] = None
    ndc: Optional[str] = None
    strength: Optional[str] = None
    form: Optional[str] = None
    route: Optional[str] = None
    sig: Optional[str] = None
    frequency: Optional[str] = None
    status: Optional[MedicationStatus] = None
    source: Optional[MedicationSource] = None
    raw_text: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    needs_review: Optional[bool] = None
    notes: Optional[str] = None


class Medication(MedicationBase):
    medication_id: str
