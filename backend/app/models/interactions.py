from __future__ import annotations

from pydantic import BaseModel


class InteractionCheckRequest(BaseModel):
    drugs: list[str]


class InteractionCheckResult(BaseModel):
    drugs_analyzed: list[str]
    result: dict
