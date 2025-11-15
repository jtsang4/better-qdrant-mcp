import type {
  ApiResponse,
  NamedVectorConfig,
  PointPayload,
  QdrantConfig,
  QdrantPoint,
  QdrantScrollResponse,
  QdrantSearchResponse,
  ScrollRequestBody,
  SearchRequestBody,
  SearchResult,
} from './types';

// Qdrant HTTP API Client
export class QdrantHttpClient {
  private config: QdrantConfig;

  constructor(config: QdrantConfig) {
    this.config = config;
  }

  public async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const url = `${this.config.url}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.config.apiKey) {
      headers['api-key'] = this.config.apiKey;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async createCollection(
    collectionName: string,
    vectorSize: number,
  ): Promise<void> {
    const response = await this.makeRequest(`/collections/${collectionName}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      }),
    });

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to create collection: ${response.statusText}`);
    }
  }

  async createCollectionWithNamedVectors(
    collectionName: string,
    vectorsConfig: Record<string, number>,
  ): Promise<void> {
    const vectors: NamedVectorConfig = {};
    Object.entries(vectorsConfig).forEach(([name, size]) => {
      vectors[name] = {
        size: size,
        distance: 'Cosine',
      };
    });

    const response = await this.makeRequest(`/collections/${collectionName}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: vectors,
      }),
    });

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to create collection: ${response.statusText}`);
    }
  }

  async upsertPoints(
    collectionName: string,
    points: QdrantPoint[],
  ): Promise<void> {
    const response = await this.makeRequest(
      `/collections/${collectionName}/points`,
      {
        method: 'PUT',
        body: JSON.stringify({
          points: points,
        }),
      },
    );

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorResponse = (await response.json()) as ApiResponse;
        errorDetails =
          errorResponse.error?.message || JSON.stringify(errorResponse);
      } catch {
        // If we can't parse the error response, use the status text
      }
      throw new Error(
        `Failed to upsert points in collection '${collectionName}': ${errorDetails}`,
      );
    }
  }

  async upsertPointsWithNamedVectors(
    collectionName: string,
    points: QdrantPoint[],
  ): Promise<void> {
    const response = await this.makeRequest(
      `/collections/${collectionName}/points`,
      {
        method: 'PUT',
        body: JSON.stringify({
          points: points,
        }),
      },
    );

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorResponse = (await response.json()) as ApiResponse;
        errorDetails =
          errorResponse.error?.message || JSON.stringify(errorResponse);
      } catch {
        // If we can't parse the error response, use the status text
      }
      throw new Error(
        `Failed to upsert points in collection '${collectionName}': ${errorDetails}`,
      );
    }
  }

  async searchPoints(
    collectionName: string,
    queryVector: number[],
    limit: number = 5,
    vectorName?: string,
  ): Promise<SearchResult[]> {
    const requestBody: SearchRequestBody = {
      limit: limit,
      with_payload: true,
    };

    // Handle named vectors vs default vectors
    if (vectorName) {
      requestBody.vector = {
        name: vectorName,
        vector: queryVector,
      };
    } else {
      requestBody.vector = queryVector;
    }

    const response = await this.makeRequest(
      `/collections/${collectionName}/points/search`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorResponse = (await response.json()) as ApiResponse;
        errorDetails =
          errorResponse.error?.message || JSON.stringify(errorResponse);
      } catch {
        // If we can't parse the error response, use the status text
      }

      // If error mentions vector name requirement, suggest using 'dense' vector
      if (
        errorDetails.includes('requires specified vector name') &&
        !vectorName
      ) {
        errorDetails += '. Hint: Try setting a vector name (e.g., "dense")';
      }

      throw new Error(
        `Failed to search points in collection '${collectionName}': ${errorDetails}. Request: ${JSON.stringify(requestBody)}`,
      );
    }

    const result = (await response.json()) as QdrantSearchResponse;
    return result.result || [];
  }

  async getAllPoints(
    collectionName: string,
    limit: number = 10000,
  ): Promise<{ id: string | number; payload: PointPayload }[]> {
    const requestBody: ScrollRequestBody = {
      limit: limit,
      with_payload: true,
      with_vector: false,
    };
    const response = await this.makeRequest(
      `/collections/${collectionName}/points/scroll`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorResponse = (await response.json()) as ApiResponse;
        errorDetails =
          errorResponse.error?.message || JSON.stringify(errorResponse);
      } catch {
        // If we can't parse the error response, use the status text
      }
      throw new Error(
        `Failed to get points from collection '${collectionName}': ${errorDetails}`,
      );
    }

    const result = (await response.json()) as QdrantScrollResponse;
    const points = result.result?.points || [];
    return points.map((point) => ({
      id: point.id,
      payload: point.payload as PointPayload,
    }));
  }
}
