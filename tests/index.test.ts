import { beforeEach, describe, expect, test, vi } from 'vitest';
import { QdrantHttpClient } from '../src/client';
import type { PointPayload, QdrantPoint } from '../src/types';

// Define mock response type
interface MockResponse {
  ok: boolean;
  status: number;
  statusText?: string;
  json: ReturnType<typeof vi.fn>;
}

// Mock fetch with proper typing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('QdrantHttpClient', () => {
  let client: QdrantHttpClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new QdrantHttpClient({
      url: 'http://localhost:6333',
      apiKey: 'test-api-key',
    });
  });

  test('create collection', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ result: { status: 'ok' } }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    await client.createCollection('test-collection', 1536);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:6333/collections/test-collection',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'api-key': 'test-api-key',
        }),
        body: JSON.stringify({
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        }),
      }),
    );
  });

  test('create collection with conflict (status 409)', async () => {
    const mockResponse: MockResponse = {
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: vi.fn().mockResolvedValue({ error: 'already exists' }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    // Should not throw on 409 status (collection already exists)
    await expect(
      client.createCollection('test-collection', 1536),
    ).resolves.not.toThrow();
  });

  test('create collection fails with other status', async () => {
    const mockResponse: MockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockResolvedValue({ error: 'server error' }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    await expect(
      client.createCollection('test-collection', 1536),
    ).rejects.toThrow('Failed to create collection: Internal Server Error');
  });

  test('upsert points', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ result: { status: 'ok' } }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const payload: PointPayload = {
      information: 'test data',
      stored_at: new Date().toISOString(),
      text: 'test data', // Additional metadata
    };

    const points: QdrantPoint[] = [
      {
        id: '1',
        vector: [0.1, 0.2, 0.3],
        payload,
      },
    ];

    await client.upsertPoints('test-collection', points);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:6333/collections/test-collection/points',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'api-key': 'test-api-key',
        }),
        body: JSON.stringify({ points }),
      }),
    );
  });

  test('search points', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        result: [
          {
            id: '1',
            score: 0.95,
            payload: {
              information: 'test information',
              stored_at: new Date().toISOString(),
            },
          },
        ],
      }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const queryVector = [0.1, 0.2, 0.3];
    const results = await client.searchPoints('test-collection', queryVector);

    expect(results).toEqual([
      {
        id: '1',
        score: 0.95,
        payload: {
          information: 'test information',
          stored_at: expect.any(String), // Match the ISO string timestamp
        },
      },
    ]);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:6333/collections/test-collection/points/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'api-key': 'test-api-key',
        }),
        body: JSON.stringify({
          limit: 5,
          with_payload: true,
          vector: queryVector,
        }),
      }),
    );
  });

  test('search points with empty result', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ result: [] }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const queryVector = [0.1, 0.2, 0.3];
    const results = await client.searchPoints('test-collection', queryVector);

    expect(results).toEqual([]);
  });

  test('search points with missing result property', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const queryVector = [0.1, 0.2, 0.3];
    const results = await client.searchPoints('test-collection', queryVector);

    expect(results).toEqual([]);
  });
});
