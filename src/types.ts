// Type definitions for Qdrant MCP Server

import type {
  CallToolRequest,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

// Base types
export type PointId = string | number;

export interface NamedVectors {
  [name: string]: number[];
}

// Payload types
export interface BasePayload {
  information: string;
  stored_at: string;
  metadata?: Record<string, unknown>;
}

export interface PointPayload extends BasePayload {
  [key: string]: unknown;
}

export interface QdrantPoint {
  id: PointId;
  vector?: number[] | NamedVectors;
  vectors?: NamedVectors;
  payload?: PointPayload;
}

// Search result types
export interface SearchResult {
  id: PointId;
  score: number;
  payload?: PointPayload;
}

export interface DenseSearchResult {
  id: PointId;
  score: number;
  payload?: PointPayload;
}

// Configuration
export interface QdrantConfig {
  url: string;
  apiKey?: string;
  defaultCollection?: string;
}

// Qdrant API response types
export interface QdrantStatusResponse {
  status: 'ok' | 'error';
  time: number;
}

export interface QdrantErrorResponse {
  status: QdrantStatusResponse['status'];
  error?: {
    code: string;
    message: string;
  };
}

export interface QdrantCollectionInfo {
  config: {
    params: {
      vectors:
        | {
            size: number;
            distance: 'Cosine' | 'Euclid' | 'Dot';
          }
        | {
            [name: string]: {
              size: number;
              distance: 'Cosine' | 'Euclid' | 'Dot';
            };
          };
    };
  };
  status: string;
  optimizer_status: string;
  indexed_vectors: number;
  points_count: number;
  segments_count: number;
  disk_data_size: number;
  ram_data_size: number;
}

export interface QdrantSearchResponse {
  result: SearchResult[];
  status: string;
  time: number;
}

export interface QdrantScrollResponse {
  result: {
    points: QdrantPoint[];
    next_page_offset?: string;
  };
  status: string;
  time: number;
}

// Tool argument types
export interface MemoryStoreArgs {
  information: string;
  metadata?: Record<string, unknown>;
  collection_name?: string;
}

export interface MemorySearchArgs {
  query: string;
  collection_name?: string;
  limit?: number;
}

export interface MemoryDebugArgs {
  collection_name?: string;
}

// Collection configuration
export interface NamedVectorConfig {
  [name: string]: {
    size: number;
    distance: 'Cosine' | 'Euclid' | 'Dot';
  };
}

export interface CollectionVectorsConfig {
  vectors: NamedVectorConfig;
}

export interface SearchRequestBody {
  vector?:
    | number[]
    | {
        name: string;
        vector: number[] | { indices: number[]; values: number[] };
      }
    | { indices: number[]; values: number[] };
  limit: number;
  with_payload: boolean;
  filter?: unknown;
  params?: unknown;
}

export interface ScrollRequestBody {
  limit: number;
  with_payload: boolean;
  with_vector?: boolean;
  filter?: unknown;
  offset?: string;
}

// Handler function types
export type ToolHandler<T = unknown> = (
  args: T,
  extra: CallToolRequest,
) => Promise<CallToolResult>;

export type ErrorHandler = (error: unknown) => CallToolResult;

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  result?: T;
  status?: string;
  time?: number;
  error?: {
    code?: string;
    message?: string;
  };
}

// Vector storage helper types can be extended here in the future if needed
