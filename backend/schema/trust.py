from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TrustUpdate(BaseModel):
    """更新信任分请求"""

    delta: int
    reason: str
    triggered_by: str  # "system" | "parent" | "child"


class TrustResponse(BaseModel):
    """信任分响应"""

    trust_score: int
    trust_level: str
    trust_level_title: str
    multiplier: float
    updated_at: Optional[datetime] = None


class TrustHistoryItem(BaseModel):
    """信任分变动历史记录"""

    delta: int
    score_before: int
    score_after: int
    reason: str
    triggered_by: str
    timestamp: str
