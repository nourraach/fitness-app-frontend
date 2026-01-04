import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheConfig {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
  storageType?: 'memory' | 'localStorage' | 'sessionStorage';
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private cacheStats = new BehaviorSubject({
    hits: 0,
    misses: 0,
    size: 0
  });

  private readonly defaultConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    storageType: 'memory'
  };

  public stats$ = this.cacheStats.asObservable();

  constructor() {
    this.setupCleanupInterval();
    this.loadFromPersistentStorage();
  }

  // Get data from cache or execute the provided function
  get<T>(
    key: string, 
    dataProvider: () => Observable<T>, 
    config?: Partial<CacheConfig>
  ): Observable<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const cachedEntry = this.getCacheEntry<T>(key, finalConfig);

    if (cachedEntry && !this.isExpired(cachedEntry)) {
      this.updateStats('hit');
      console.log(`Cache HIT for key: ${key}`);
      return of(cachedEntry.data);
    }

    this.updateStats('miss');
    console.log(`Cache MISS for key: ${key}`);
    
    return dataProvider().pipe(
      tap(data => {
        this.set(key, data, finalConfig);
      }),
      catchError(error => {
        // If we have expired data, return it as fallback
        if (cachedEntry) {
          console.log(`Using expired cache as fallback for key: ${key}`);
          return of(cachedEntry.data);
        }
        throw error;
      })
    );
  }

  // Set data in cache
  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalConfig.ttl!,
      key
    };

    this.setCacheEntry(key, entry, finalConfig);
    this.enforceMaxSize(finalConfig);
    this.updateStats('size');
  }

  // Check if data exists in cache and is not expired
  has(key: string): boolean {
    const entry = this.getCacheEntry(key);
    return entry !== null && !this.isExpired(entry);
  }

  // Remove specific key from cache
  delete(key: string): boolean {
    const deleted = this.deleteCacheEntry(key);
    if (deleted) {
      this.updateStats('size');
    }
    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    this.memoryCache.clear();
    this.clearPersistentStorage();
    this.updateStats('size');
    console.log('Cache cleared');
  }

  // Clear cache entries matching a pattern
  clearPattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deletedCount = 0;

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }

    // Clear from persistent storage
    this.clearPersistentStoragePattern(regex);
    
    this.updateStats('size');
    console.log(`Cleared ${deletedCount} cache entries matching pattern:`, pattern);
    return deletedCount;
  }

  // Get cache statistics
  getStats() {
    const stats = this.cacheStats.value;
    const hitRate = stats.hits + stats.misses > 0 
      ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
      : '0.00';
    
    return {
      ...stats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size
    };
  }

  // Preload data into cache
  preload<T>(key: string, dataProvider: () => Observable<T>, config?: Partial<CacheConfig>): Observable<T> {
    if (this.has(key)) {
      return of(this.getCacheEntry<T>(key)!.data);
    }
    
    return this.get(key, dataProvider, config);
  }

  // Refresh cache entry (force reload)
  refresh<T>(key: string, dataProvider: () => Observable<T>, config?: Partial<CacheConfig>): Observable<T> {
    this.delete(key);
    return this.get(key, dataProvider, config);
  }

  private getCacheEntry<T>(key: string, config?: Partial<CacheConfig>): CacheEntry<T> | null {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Try memory cache first
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // Try persistent storage
    if (finalConfig.storageType !== 'memory') {
      return this.getFromPersistentStorage<T>(key, finalConfig.storageType!);
    }

    return null;
  }

  private setCacheEntry<T>(key: string, entry: CacheEntry<T>, config: CacheConfig): void {
    // Always store in memory for fast access
    this.memoryCache.set(key, entry);

    // Also store in persistent storage if configured
    if (config.storageType !== 'memory') {
      this.saveToPersistentStorage(key, entry, config.storageType!);
    }
  }

  private deleteCacheEntry(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key);
    this.deleteFromPersistentStorage(key);
    return memoryDeleted;
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private enforceMaxSize(config: CacheConfig): void {
    if (!config.maxSize || this.memoryCache.size <= config.maxSize) {
      return;
    }

    // Remove oldest entries (LRU strategy)
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, this.memoryCache.size - config.maxSize);
    toRemove.forEach(([key]) => {
      this.memoryCache.delete(key);
      this.deleteFromPersistentStorage(key);
    });

    console.log(`Removed ${toRemove.length} old cache entries to enforce max size`);
  }

  private setupCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  private cleanupExpired(): void {
    let removedCount = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        this.deleteFromPersistentStorage(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired cache entries`);
      this.updateStats('size');
    }
  }

  private getFromPersistentStorage<T>(key: string, storageType: 'localStorage' | 'sessionStorage'): CacheEntry<T> | null {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      const stored = storage.getItem(`cache_${key}`);
      
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading from persistent storage:', error);
    }
    
    return null;
  }

  private saveToPersistentStorage<T>(key: string, entry: CacheEntry<T>, storageType: 'localStorage' | 'sessionStorage'): void {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Error saving to persistent storage:', error);
    }
  }

  private deleteFromPersistentStorage(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
      sessionStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Error deleting from persistent storage:', error);
    }
  }

  private clearPersistentStorage(): void {
    try {
      // Clear cache entries from localStorage
      const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      localKeys.forEach(key => localStorage.removeItem(key));

      // Clear cache entries from sessionStorage
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith('cache_'));
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing persistent storage:', error);
    }
  }

  private clearPersistentStoragePattern(pattern: RegExp): void {
    try {
      // Clear matching entries from localStorage
      const localKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('cache_'))
        .filter(key => pattern.test(key.substring(6))); // Remove 'cache_' prefix
      localKeys.forEach(key => localStorage.removeItem(key));

      // Clear matching entries from sessionStorage
      const sessionKeys = Object.keys(sessionStorage)
        .filter(key => key.startsWith('cache_'))
        .filter(key => pattern.test(key.substring(6))); // Remove 'cache_' prefix
      sessionKeys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing persistent storage pattern:', error);
    }
  }

  private loadFromPersistentStorage(): void {
    try {
      // Load from localStorage
      const localKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      localKeys.forEach(key => {
        const cacheKey = key.substring(6); // Remove 'cache_' prefix
        const entry = this.getFromPersistentStorage(cacheKey, 'localStorage');
        if (entry && !this.isExpired(entry)) {
          this.memoryCache.set(cacheKey, entry);
        }
      });

      console.log(`Loaded ${this.memoryCache.size} cache entries from persistent storage`);
    } catch (error) {
      console.error('Error loading from persistent storage:', error);
    }
  }

  private updateStats(type: 'hit' | 'miss' | 'size'): void {
    const current = this.cacheStats.value;
    
    switch (type) {
      case 'hit':
        this.cacheStats.next({ ...current, hits: current.hits + 1 });
        break;
      case 'miss':
        this.cacheStats.next({ ...current, misses: current.misses + 1 });
        break;
      case 'size':
        this.cacheStats.next({ ...current, size: this.memoryCache.size });
        break;
    }
  }
}