from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class BaseService(ABC):
    """Base service class for MEIMS.

    Service classes should inherit from this base implementation and
    expose a single execute() entry point for orchestration.
    """

    def __init__(self, **kwargs: Any) -> None:
        self.context = kwargs

    @abstractmethod
    def execute(self, *args: Any, **kwargs: Any) -> Any:
        """Execute the service workflow and return the result."""
        raise NotImplementedError

    def validate(self) -> None:
        """Validate any required service preconditions before execution."""
        return

    def serialize_result(self, result: Any) -> Any:
        """Normalize the service result for transport or presentation."""
        return result
