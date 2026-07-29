import os
from collections.abc import Iterable
from pathlib import Path

_truthy_values = {"1", "true", "yes", "on", "y"}


def load_dotenv(dotenv_path: Path | str) -> None:
    path = Path(dotenv_path)
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        if "=" not in line:
            continue

        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip().strip("\"'")
        if name and name not in os.environ:
            os.environ[name] = value


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in _truthy_values


def env_list(name: str, default: Iterable[str] | None = None, delimiter: str = ",") -> list[str]:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        return list(default or [])

    return [item.strip() for item in raw_value.split(delimiter) if item.strip()]


def env_str(name: str, default: str = "") -> str:
    return os.getenv(name, default)
