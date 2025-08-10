// Cache entry with metadata for stale-while-revalidate
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: string;
}

// Cache result indicating freshness
export interface CacheResult<T> {
  data: T | null;
  fresh: boolean;
  stale: boolean;
  exists: boolean;
}

// Cache abstraction interface to avoid KVNamespace proliferation
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  getWithMetadata<T>(key: string): Promise<CacheResult<T>>;
  put(
    key: string,
    value: any,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  putWithMetadata<T>(
    key: string,
    value: T,
    ttl: number,
    version?: string
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

// KV implementation of the cache service
export class KVCacheService implements Cache {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      return value as T | null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  async getWithMetadata<T>(key: string): Promise<CacheResult<T>> {
    try {
      const entry = (await this.kv.get(key, 'json')) as CacheEntry<T> | null;

      if (!entry) {
        return { data: null, fresh: false, stale: false, exists: false };
      }

      const now = Date.now();
      const age = now - entry.timestamp;
      const fresh = age < entry.ttl;
      const stale = age >= entry.ttl && age < entry.ttl * 2; // Allow stale for 2x TTL

      return {
        data: entry.data,
        fresh,
        stale: stale && !fresh,
        exists: true,
      };
    } catch (error) {
      console.warn('Cache metadata read error:', error);
      return { data: null, fresh: false, stale: false, exists: false };
    }
  }

  async put(
    key: string,
    value: any,
    options?: { expirationTtl?: number }
  ): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), options);
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  async putWithMetadata<T>(
    key: string,
    value: T,
    ttl: number,
    version?: string
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert seconds to milliseconds
        version,
      };

      // Set KV expiration to 2x TTL to allow stale serving
      await this.kv.put(key, JSON.stringify(entry), {
        expirationTtl: ttl * 2,
      });
    } catch (error) {
      console.warn('Cache metadata write error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.warn('Cache delete error:', error);
    }
  }
}

// No-op cache for when caching is disabled
export class NullCacheService implements Cache {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async getWithMetadata<T>(_key: string): Promise<CacheResult<T>> {
    return { data: null, fresh: false, stale: false, exists: false };
  }

  async put(
    _key: string,
    _value: any,
    _options?: { expirationTtl?: number }
  ): Promise<void> {
    // No-op
  }

  async putWithMetadata<T>(
    _key: string,
    _value: T,
    _ttl: number,
    _version?: string
  ): Promise<void> {
    // No-op
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }
}
