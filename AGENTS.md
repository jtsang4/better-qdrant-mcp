# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Better Qdrant MCP is a Python-based Model Context Protocol (MCP) server that provides long-term memory storage and semantic search capabilities using Qdrant vector database and OpenAI embeddings. It implements three main tools: `memory-store`, `memory-search`, and `memory-debug`.

The server supports multiple transport modes: stdio (default), Server-Sent Events (SSE), and streamable HTTP, making it compatible with various MCP clients from traditional CLI tools to modern web applications.

## Architecture

### Core Components

- **FastMCP Framework**: Uses fastmcp for MCP protocol implementation
- **Qdrant Vector Database**: Stores and searches embedded text data
- **OpenAI Embeddings**: Generates dense vectors for semantic search
- **Hybrid Search**: Supports both dense (OpenAI) and sparse (BM25) vector search
- **Multi-Transport Support**: stdio, SSE, and streamable HTTP protocols

### Key Modules

- `tools.py`: Core MCP tool implementations and server entry points
- `qdr_client.py`: Qdrant client wrapper with hybrid search capabilities
- `embeddings.py`: OpenAI dense embeddings and fastembed sparse embeddings
- `config.py`: Settings management from environment variables
- `version.py`: Dynamic version reading from pyproject.toml

### Data Flow

1. **Storage**: Text → OpenAI embeddings → Qdrant collection (with optional sparse vectors)
2. **Search**: Query → Dense + Sparse embeddings → Hybrid fusion → Ranked results
3. **Transport**: MCP requests → FastMCP → Tool functions → Qdrant operations

## Development Commands

### Package Management and Dependencies

**Always use `uv` for package management. Avoid direct `pip` or `python` commands unless absolutely necessary.**

```bash
# Install dependencies
uv sync

# Install in development mode
uv pip install -e .

# Add new dependencies
uv add package_name

# Run commands in uv environment
uv run python -m better_qdrant_mcp
```

### Build and Release

```bash
# Clean and build package
make build
# or manually:
rm -rf dist && uv build

# Run locally for development
uv run python -m better_qdrant_mcp

# Run with uvx (when package is published)
uvx better-qdrant-mcp
```

### Running the Server

**Use `uv run` for local development, `uvx` for running published versions.**

```bash
# Default stdio transport (development)
uv run python -m better_qdrant_mcp

# Using uvx (published package)
uvx better-qdrant-mcp

# SSE transport (port 8000)
uvx better-qdrant-mcp --transport sse

# Streamable HTTP transport (recommended for web)
uvx better-qdrant-mcp --transport streamable-http --host 0.0.0.0 --port 3000
```

## Environment Configuration

Required environment variables:

- **OpenAI**: `OPENAPI_API_KEY` or `OPENAI_API_KEY` (required)
- **Qdrant**: `QDRANT_URL` (default: http://localhost:6333), `QDRANT_API_KEY` (optional)
- **Collection**: `COLLECTION_NAME` (default collection name)
- **OpenAI Settings**: `OPENAI_BASE_URL`, `OPENAI_EMBEDDING_MODEL` (default: text-embedding-3-small)

Transport configuration:

- `MCP_TRANSPORT`: stdio/sse/streamable-http
- `MCP_HOST`: Host for HTTP transports (default: 0.0.0.0)
- `MCP_PORT`: Port for HTTP transports (default: 8000)
- `MCP_PATH`: Path for HTTP transports (default: /mcp)

## Key Implementation Details

### Hybrid Search Strategy

The server automatically detects collection configuration and adapts search strategy:

- **Named vectors + sparse vectors**: Uses hybrid search (dense + sparse fusion)
- **Only dense vectors**: Falls back to dense-only search for backward compatibility
- **Collection creation**: New collections are created with named "dense" vectors for future hybrid support

### Multi-Vector Support

Collections are created with named vector configuration:

- Dense vectors stored under "dense" name (OpenAI embeddings)
- Sparse vectors stored under "sparse" name (BM25 from fastembed)
- Backward compatible with legacy single-vector collections

### Text Processing

Sparse embedding preprocessing includes:

- CJK text detection and tokenization using jieba
- Text normalization and tokenization for BM25
- Language-agnostic preprocessing pipeline

### Error Handling

- Graceful fallback from hybrid to dense-only search
- Collection existence checking and auto-creation
- Timeout and retry configuration for external services
- Comprehensive error messages for missing configuration

## MCP Tools

### memory-store(information, metadata?, collection_name?)

Stores text with automatic OpenAI embedding generation. Returns point ID. Supports optional metadata dict and custom collection names.

### memory-search(query, limit?, collection_name?)

Performs semantic search using hybrid dense+sparse vectors when available. Falls back to dense-only search. Returns JSON-structured results with scores and payloads.

### memory-debug(collection_name?)

Inspects collection configuration and returns sample data points. Useful for debugging collection setup and understanding stored data structure.

## Testing and Debugging

Use the `memory-debug` tool to inspect collection configuration and sample data. The tool provides detailed information about vector configuration, collection status, and example payloads which is essential for troubleshooting hybrid search setup.
