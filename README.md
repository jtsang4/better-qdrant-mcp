# better-qdrant-mcp

A MCP server implemented with fastmcp, OpenAI embeddings, and qdrant-client. It provides three tools equivalent to the Node.js version:

- memory-store
- memory-search
- memory-debug

## Requirements

- Python 3.12+
- Qdrant reachable via HTTP

## Install deps (using uv or pip)

```bash
# using uv (recommended)
uv sync
# or with pip
pip install -e .
```

## Environment variables

- QDRANT_URL (default: http://localhost:6333)
- QDRANT_API_KEY (optional)
- COLLECTION_NAME (optional default collection)
- OPENAPI_API_KEY or OPENAI_API_KEY (required)
- OPENAI_BASE_URL (optional)
- OPENAI_EMBEDDING_MODEL (default: text-embedding-3-small)

## Run

### Standard IO (stdio) - Default

```bash
uvx better-qdrant-mcp
# or
python -m better_qdrant_mcp
```

Configure in MCP clients as a stdio server. Example (cursor-like):

```json
{
  "mcpServers": {
    "qdrant-mcp-python": {
      "type": "stdio",
      "command": "uvx",
      "args": ["better-qdrant-mcp"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "long_term_memory"
      }
    }
  }
}
```

### Server-Sent Events (SSE)

```bash
# Default port 8000
uvx better-qdrant-mcp --transport sse

# Custom host and port
uvx better-qdrant-mcp --transport sse --host 0.0.0.0 --port 3000

# Using Python directly
python -m better_qdrant_mcp --transport sse --port 3000
```

Configure in MCP clients as an SSE server:

```json
{
  "mcpServers": {
    "qdrant-mcp-python": {
      "transport": "sse",
      "url": "http://localhost:8000/sse",
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "long_term_memory"
      }
    }
  }
}
```

### Streamable HTTP (Recommended for web applications)

```bash
# Default port 8000 and path /mcp
uvx better-qdrant-mcp --transport streamable-http

# Custom host, port, and path
uvx better-qdrant-mcp --transport streamable-http --host 0.0.0.0 --port 3000 --path /api/mcp

# Using environment variables
MCP_TRANSPORT=streamable-http MCP_HOST=0.0.0.0 MCP_PORT=3000 uvx better-qdrant-mcp
```

Configure in MCP clients as a streamable HTTP server:

```json
{
  "mcpServers": {
    "qdrant-mcp-python": {
      "transport": "streamable-http",
      "url": "http://localhost:8000/mcp",
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "COLLECTION_NAME": "long_term_memory"
      }
    }
  }
}
```

### Environment Variables

You can use environment variables to configure the server:

- `MCP_TRANSPORT`: Transport type (`stdio`, `sse`, `streamable-http`)
- `MCP_HOST`: Host for HTTP-based transports (default: `0.0.0.0`)
- `MCP_PORT`: Port for HTTP-based transports (default: `8000`)
- `MCP_PATH`: Path for HTTP-based transports (default: `/mcp`)

## Choosing the Right Transport

| Transport | Use Case | Pros | Cons |
|-----------|----------|------|------|
| **stdio** | Local development, CLI tools, traditional MCP clients | Simple, widely supported, secure | Local only, not web-friendly |
| **SSE** | Web dashboards, real-time updates, legacy HTTP clients | Real-time push, web-compatible | Two separate endpoints needed |
| **Streamable HTTP** | Modern web apps, production deployments | Single endpoint, simpler setup, newer standard | Requires newer MCP clients |

**Recommendations:**
- Use **stdio** for local development and traditional MCP clients like Claude Desktop
- Use **SSE** for web applications that need real-time updates
- Use **streamable HTTP** for modern web applications and production deployments (recommended for new projects)

## Tools

- memory-store(information, metadata?: dict, collection_name?: str) -> str
- memory-search(query, limit?: int=5, collection_name?: str) -> str
- memory-debug(collection_name?: str) -> str

`memory-search` uses hybrid search in Qdrant (dense + sparse). If the collection is configured with named vectors `dense` and `sparse`, queries are ranked by fusing dense OpenAI embeddings and sparse BM25 scores; otherwise it falls back to dense-only search.

## Development tips

For local development, you can use the provided `Makefile`:

```bash
make build
```

This command will first clean the `dist` directory and then run `uv build` to produce fresh artifacts.
