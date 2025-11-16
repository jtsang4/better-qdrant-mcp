from .tools import run  # re-export entrypoint
from .version import __version__

__all__ = ["run", "hello", "__version__"]


def hello() -> str:
    return "Hello from better-qdrant-mcp!"
