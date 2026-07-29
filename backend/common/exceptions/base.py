from __future__ import annotations

from typing import Any


class CustomException(Exception):
    """Base exception for MEIMS.

    This exception provides a shared structure for application-level
    errors while avoiding business logic in the framework layer.
    """

    status_code: int = 500
    detail: str = "An error occurred."

    def __init__(self, detail: str | None = None, *, status_code: int | None = None) -> None:
        super().__init__(detail or self.detail)
        if detail is not None:
            self.detail = detail
        if status_code is not None:
            self.status_code = status_code

    def to_dict(self) -> dict[str, Any]:
        return {
            "status_code": self.status_code,
            "detail": self.detail,
        }
