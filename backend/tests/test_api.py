from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.services.medication_parser import parse_medications_from_text
from app.services.patient_store import store
from app.services.rx_label_guard_client import RxLabelGuardClient


client = TestClient(app)


def test_create_patient_and_generated_id() -> None:
    response = client.post("/api/patients", json={"display_name": "PX"})

    assert response.status_code == 201
    body = response.json()
    assert body["patient_id"].startswith("PAT-")
    assert body["display_name"] == "PX"
    assert body["pdf_imported"] is False


def test_add_medication_with_generic_name() -> None:
    patient = client.post("/api/patients", json={"display_name": "Meds"}).json()

    response = client.post(
        f"/api/patients/{patient['patient_id']}/medications",
        json={"generic_name": "metformin", "strength": "500 mg"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["generic_name"] == "metformin"
    assert body["source"] == "manual"


def test_refuse_medication_without_generic_name() -> None:
    patient = client.post("/api/patients", json={"display_name": "Invalid med"}).json()

    response = client.post(f"/api/patients/{patient['patient_id']}/medications", json={"strength": "5 mg"})

    assert response.status_code == 422


def test_import_pdf_refused_when_already_imported() -> None:
    patient = client.post("/api/patients", json={"display_name": "PDF done"}).json()
    store.mark_pdf_imported(patient["patient_id"])

    response = client.post(
        f"/api/patients/{patient['patient_id']}/import-pdf",
        files={"file": ("profile.pdf", b"%PDF-1.4", "application/pdf")},
    )

    assert response.status_code == 400
    assert "déjà été importé" in response.json()["detail"]


def test_parse_simple_medication_lines() -> None:
    text = "\n".join(
        [
            "METFORMIN 500 MG COMPRIMÉ",
            "WARFARIN 5 MG PO DIE",
            "ATORVASTATIN 20 MG 1 CO PO HS",
        ]
    )

    medications = parse_medications_from_text(text)

    assert [med.generic_name for med in medications] == ["Metformin", "Warfarin", "Atorvastatin"]
    assert [med.strength for med in medications] == ["500 MG", "5 MG", "20 MG"]
    assert all(med.needs_review for med in medications)


def test_rx_label_guard_mock_mode() -> None:
    patient = client.post("/api/patients", json={"display_name": "Interactions"}).json()
    patient_id = patient["patient_id"]
    client.post(f"/api/patients/{patient_id}/medications", json={"generic_name": "warfarin"})
    client.post(f"/api/patients/{patient_id}/medications", json={"generic_name": "aspirin"})
    client.post(
        f"/api/patients/{patient_id}/medications",
        json={"generic_name": "atorvastatin", "status": "inactive"},
    )

    response = client.post(f"/api/patients/{patient_id}/interactions/check")

    assert response.status_code == 200
    body = response.json()
    assert body["drugs_analyzed"] == ["aspirin", "warfarin"]
    assert body["result"]["mock"] is True
    assert body["result"]["interaction_count"] == 1


def test_rx_label_guard_normalizes_stringified_fields() -> None:
    client_instance = RxLabelGuardClient.__new__(RxLabelGuardClient)

    payload = client_instance._normalize_result(
        {
            "resolutions": '[{"inputName":"Coumadin","resolved":true}]',
            "pairs": '[{"drugA":"Warfarin","drugB":"methotrexate","maxSeverity":"moderate"}]',
            "errors": "[]",
            "summary": "null",
        }
    )

    assert isinstance(payload["resolutions"], list)
    assert isinstance(payload["pairs"], list)
    assert payload["errors"] == []
    assert payload["summary"] is None
