from __future__ import annotations

import json

import httpx
from fastapi import HTTPException

from app.core.config import Settings


class RxLabelGuardClient:
    endpoint = "https://api.rxlabelguard.com/v1/interactions/check"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @staticmethod
    def _parse_json_string_field(value: object) -> object:
        if not isinstance(value, str):
            return value
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value

    def _normalize_result(self, payload: dict) -> dict:
        normalized = dict(payload)
        for key in ("resolutions", "pairs", "errors", "summary"):
            if key in normalized:
                normalized[key] = self._parse_json_string_field(normalized[key])
        return normalized

    async def check_interactions(self, drugs: list[str]) -> dict:
        if self.settings.rx_label_guard_mock:
            return {
                "mock": True,
                "drugs": drugs,
                "interaction_count": 1 if len(drugs) >= 2 else 0,
                "interactions": [
                    {
                        "drugs": drugs[:2],
                        "severity": "moderate",
                        "summary": "Exemple simulé: interaction potentielle à valider cliniquement.",
                        "evidence": ["Réponse mock locale Rx Label Guard."],
                    }
                ]
                if len(drugs) >= 2
                else [],
            }

        if not self.settings.rx_label_guard_api_key:
            raise HTTPException(status_code=500, detail="Clé API Rx Label Guard manquante côté backend.")

        try:
            async with httpx.AsyncClient(timeout=self.settings.rx_label_guard_timeout_seconds) as client:
                response = await client.post(
                    self.endpoint,
                    headers={"x-api-key": self.settings.rx_label_guard_api_key},
                    json={"drugs": drugs},
                )
        except httpx.TimeoutException as exc:
            raise HTTPException(status_code=504, detail="Timeout de l'API Rx Label Guard.") from exc
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Erreur réseau vers Rx Label Guard.") from exc

        if response.status_code in (401, 403):
            raise HTTPException(status_code=response.status_code, detail="Authentification Rx Label Guard refusée.")
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Limite de débit Rx Label Guard atteinte.")
        if response.status_code >= 500:
            raise HTTPException(status_code=502, detail="Erreur serveur Rx Label Guard.")
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return self._normalize_result(response.json())
