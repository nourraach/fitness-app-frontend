import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheConfig {
  defaultTTL: number; // Default TTL in minutes
  maxSize: number; // Maximum number of entries
  enableLogging: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cacheStatsSubject = new BehaviorSubject<{hits: number, misses: number, size: number}>({
    hits: 0,
    misses: 0,
    size: 0
  });

  private config: CacheConfig = {
    defaultTTL: 5, // 5 minutes par défaut
    maxSize: 100,
    enableLogging: false
  };

  private stats = {
    hits: 0,
    misses: 0
  };

  public cacheStats$ = this.cacheStatsSubject.asObservable();

  constructor() {
    // Nettoyer le cache périodiquement
    setInterval(() => this.cleanup(), 60000); // Toutes les minutes
  }

  /**
   * Configurer le service de cache
   */
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Stocker une valeur dans le cache
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = (ttlMinutes || this.config.defaultTTL) * 60 * 1000;
    
    // Vérifier la taille du cache
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: this.deepClone(data),
      timestamp: Date.now(),
      ttl
    });

    this.updateStats();
    this.log(`Cache SET: ${key} (TTL: ${ttlMinutes || this.config.defaultTTL}min)`);
  }

  /**
   * Récupérer une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      this.log(`Cache MISS: ${key}`);
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      this.log(`Cache EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    this.updateStats();
    this.log(`Cache HIT: ${key}`);
    return this.deepClone(entry.data);
  }

  /**
   * Vérifier si une clé existe dans le cache et n'a pas expiré
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.updateStats();
      return false;
    }
    
    return true;
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
      this.log(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Invalider les entrées correspondant à un pattern
   */
  invalidate(pattern: string): number {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateStats();
    
    this.log(`Cache INVALIDATE: ${pattern} (${keysToDelete.length} entries)`);
    return keysToDelete.length;
  }

  /**
   * Vider complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.updateStats();
    this.log('Cache CLEAR: All entries removed');
  }

  /**
   * Wrapper pour les observables avec cache automatique
   */
  cacheObservable<T>(
    key: string,
    source: () => Observable<T>,
    ttlMinutes?: number
  ): Observable<T> {
    // Vérifier si les données sont en cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return of(cached);
    }

    // Exécuter la source et mettre en cache le résultat
    return source().pipe(
      tap(data => {
        this.set(key, data, ttlMinutes);
      }),
      catchError(error => {
        this.log(`Cache ERROR for ${key}: ${error.message}`);
        throw error;
      })
    );
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): {hits: number, misses: number, size: number, hitRate: number} {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Obtenir toutes les clés du cache
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Obtenir la taille du cache en mémoire (approximative)
   */
  getMemoryUsage(): number {
    let size = 0;
    this.cache.forEach((entry, key) => {
      size += key.length * 2; // Approximation pour la clé
      size += JSON.stringify(entry.data).length * 2; // Approximation pour les données
    });
    return size; // En bytes
  }

  /**
   * Nettoyer les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.updateStats();
      this.log(`Cache CLEANUP: ${cleanedCount} expired entries removed`);
    }
  }

  /**
   * Supprimer l'entrée la plus ancienne
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log(`Cache EVICT: ${oldestKey} (oldest entry)`);
    }
  }

  /**
   * Cloner profondément un objet
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as T;
      Object.keys(obj).forEach(key => {
        (cloned as any)[key] = this.deepClone((obj as any)[key]);
      });
      return cloned;
    }
    
    return obj;
  }

  /**
   * Mettre à jour les statistiques
   */
  private updateStats(): void {
    this.cacheStatsSubject.next({
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size
    });
  }

  /**
   * Logger les opérations de cache
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[CacheService] ${message}`);
    }
  }
}