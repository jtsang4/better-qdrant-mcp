from .tools import run, main  # re-export entrypoints
from .version import __version__

__all__ = ["run", "main", "hello", "__version__"]


def hello() -> str:
    return "Hello from better-qdrant-mcp!"
