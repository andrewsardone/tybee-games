// Cache abstraction interface to avoid KVNamespace proliferation
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  put(
    key: string,
    value: any,
    options?: { expirationTtl?: number }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

// KV implementation of the cache service
export class KVCacheService implements Cache {
  constructor(private kv: KVNamespace) { }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      return value as T | null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
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

  async put(
    _key: string,
    _value: any,
    _options?: { expirationTtl?: number }
  ): Promise<void> {
    // No-op
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }
}
