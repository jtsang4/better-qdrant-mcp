from __future__ import annotations

from importlib import metadata
from pathlib import Path


def _read_version_from_pyproject() -> str | None:
    """Best-effort read of version from pyproject.toml.

    This is mainly for running from a source checkout where the package
    metadata might not be installed. When the project is installed as a
    package, importlib.metadata should normally succeed first.
    """

    try:
        # .../project-root/src/better_qdrant_mcp/version.py
        # project-root is three levels up from this file
        project_root = Path(__file__).resolve().parents[3]
        pyproject = project_root / "pyproject.toml"
    except Exception:
        return None

    if not pyproject.exists():
        return None

    try:
        in_project_section = False
        for raw_line in pyproject.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()

            if not line or line.startswith("#"):
                continue

            if line.startswith("[") and line.endswith("]"):
                # Track when we are inside the [project] table
                in_project_section = line == "[project]"
                continue

            if not in_project_section:
                continue

            if line.startswith("version"):
                # Expect a simple: version = "0.2.2"
                _, value = line.split("=", 1)
                value = value.strip().strip('"').strip("'")
                if value:
                    return value
    except Exception:
        return None

    return None


def _get_version() -> str:
    # 1) Prefer installed package metadata when available
    try:
        return metadata.version("better-qdrant-mcp")
    except Exception:
        pass

    # 2) Fallback to reading from pyproject.toml in source checkouts
    v = _read_version_from_pyproject()
    if v:
        return v

    # 3) Final safety fallback if everything else fails
    return "0.0.0"


__version__ = _get_version()
