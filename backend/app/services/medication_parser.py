from __future__ import annotations

import re

from app.models.medication import MedicationCreate


STRENGTH_RE = re.compile(r"\b(\d+(?:[.,]\d+)?\s*(?:mg|mcg|g|ml|iu|ui|%|units?|unités?))\b", re.IGNORECASE)
SKIP_RE = re.compile(r"(patient|date|pharmacie|prescripteur|ordonnance|rx|profil)", re.IGNORECASE)


def parse_medications_from_text(text: str) -> list[MedicationCreate]:
    medications: list[MedicationCreate] = []
    seen: set[str] = set()

    for raw_line in text.splitlines():
        line = " ".join(raw_line.strip().split())
        if not line or len(line) < 5 or SKIP_RE.search(line):
            continue

        strength_match = STRENGTH_RE.search(line)
        if not strength_match:
            continue

        name = line[: strength_match.start()].strip(" -:;,")
        name = re.sub(r"^\d+\s+", "", name).strip()
        if not name or len(name) < 3:
            continue

        key = f"{name.lower()}|{strength_match.group(1).lower()}|{line.lower()}"
        if key in seen:
            continue
        seen.add(key)

        medications.append(
            MedicationCreate(
                generic_name=name.title(),
                strength=strength_match.group(1).upper().replace(",", "."),
                source="pdf_import",
                raw_text=line,
                confidence=0.72,
                needs_review=True,
            )
        )

    return medications
