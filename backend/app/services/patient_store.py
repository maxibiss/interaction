from __future__ import annotations

from app.core.errors import not_found
from app.models.medication import Medication, MedicationCreate, MedicationUpdate
from app.models.patient import Patient, PatientCreate, PatientUpdate


class PatientStore:
    def __init__(self) -> None:
        self._patients: dict[str, Patient] = {}
        self._medications: dict[str, list[Medication]] = {}
        self._patient_counter = 0
        self._medication_counter = 0
        self.seed()

    def _seed_templates(self) -> list[tuple[str, str]]:
        return [
            ("Patient 1", "Profil fictif de demonstration."),
            ("Patient 2", "Patient fictif pour tests."),
            ("Patient 3", "Profil sans import PDF."),
        ]

    def seed(self) -> None:
        for name, notes in self._seed_templates():
            self.create_patient(PatientCreate(display_name=name, notes=notes))

    def ensure_seeded(self) -> None:
        if not self._patients:
            self.seed()

    def _next_patient_id(self) -> str:
        self._patient_counter += 1
        return f"PAT-{self._patient_counter:03d}"

    def _next_medication_id(self) -> str:
        self._medication_counter += 1
        return f"MED-{self._medication_counter:04d}"

    def list_patients(self) -> list[Patient]:
        self.ensure_seeded()
        return list(self._patients.values())

    def create_patient(self, payload: PatientCreate) -> Patient:
        patient = Patient(patient_id=self._next_patient_id(), **payload.model_dump())
        self._patients[patient.patient_id] = patient
        self._medications[patient.patient_id] = []
        return patient

    def get_patient(self, patient_id: str) -> Patient:
        patient = self._patients.get(patient_id)
        if not patient:
            raise not_found("Patient introuvable.")
        return patient

    def update_patient(self, patient_id: str, payload: PatientUpdate) -> Patient:
        patient = self.get_patient(patient_id)
        data = patient.model_dump()
        data.update(payload.model_dump(exclude_unset=True))
        updated = Patient(**data)
        self._patients[patient_id] = updated
        return updated

    def delete_patient(self, patient_id: str) -> None:
        self.get_patient(patient_id)
        del self._patients[patient_id]
        del self._medications[patient_id]

    def list_medications(self, patient_id: str) -> list[Medication]:
        self.get_patient(patient_id)
        return self._medications[patient_id]

    def add_medication(self, patient_id: str, payload: MedicationCreate) -> Medication:
        self.get_patient(patient_id)
        medication = Medication(medication_id=self._next_medication_id(), **payload.model_dump())
        self._medications[patient_id].append(medication)
        return medication

    def add_medications(self, patient_id: str, medications: list[MedicationCreate]) -> list[Medication]:
        return [self.add_medication(patient_id, medication) for medication in medications]

    def update_medication(self, patient_id: str, medication_id: str, payload: MedicationUpdate) -> Medication:
        medications = self.list_medications(patient_id)
        for index, medication in enumerate(medications):
            if medication.medication_id == medication_id:
                data = medication.model_dump()
                data.update(payload.model_dump(exclude_unset=True))
                updated = Medication(**data)
                medications[index] = updated
                return updated
        raise not_found("Medicament introuvable.")

    def delete_medication(self, patient_id: str, medication_id: str) -> None:
        medications = self.list_medications(patient_id)
        for index, medication in enumerate(medications):
            if medication.medication_id == medication_id:
                medications.pop(index)
                return
        raise not_found("Medicament introuvable.")

    def mark_pdf_imported(self, patient_id: str) -> Patient:
        patient = self.get_patient(patient_id)
        updated = patient.model_copy(update={"pdf_imported": True})
        self._patients[patient_id] = updated
        return updated


store = PatientStore()
