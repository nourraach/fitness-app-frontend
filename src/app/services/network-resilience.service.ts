import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, NEVER, timer, throwError, of } from 'rxjs';
import { retry, catchError, switchMap, tap, delay } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

export interface RetryQueueItem {
  id: string;
  request: () => Observable<any>;
  callback: (result: any) => void;
  errorCallback: (error: any) => void;
  maxRetries: number;
  currentRetries: number;
  context: string;
  timestamp: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkResilienceService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });
  
  private retryQueue: RetryQueueItem[] = [];
  private isProcessingQueue = false;

  public isOnline$ = this.isOnlineSubject.asObservable();
  public networkStatus$ = this.networkStatusSubject.asObservable();

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialiser la surveillance réseau
   */
  private initializeNetworkMonitoring(): void {
    // Écouter les événements de connexion/déconnexion
    window.addEventListener('online', () => {
      this.handleOnline();
    });
    
    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Surveiller la qualité de la connexion si disponible
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.updateNetworkStatus();
        connection.addEventListener('change', () => {
          this.updateNetworkStatus();
        });
      }
    }

    // Vérification périodique de la connectivité
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Exécuter une requête avec retry automatique
   */
  executeWithRetry<T>(
    request: () => Observable<T>, 
    maxRetries: number = 3,
    context: string = 'unknown'
  ): Observable<T> {
    return request().pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          // Si hors ligne, ne pas retry immédiatement
          if (!navigator.onLine) {
            this.addToRetryQueue(request, maxRetries, context);
            return NEVER;
          }
          
          // Backoff exponentiel avec jitter
          const baseDelay = Math.pow(2, retryCount - 1) * 1000;
          const jitter = Math.random() * 1000;
          const totalDelay = baseDelay + jitter;
          
          console.log(`Retry ${retryCount}/${maxRetries} for ${context} in ${totalDelay}ms`);
          return timer(totalDelay);
        }
      }),
      catchError(error => {
        // Si toujours hors ligne après les retries, ajouter à la queue
        if (!navigator.onLine) {
          this.addToRetryQueue(request, maxRetries, context);
          return throwError(() => new Error('Hors ligne. La requête sera réessayée automatiquement.'));
        }
        
        // Si c'est une erreur réseau, ajouter à la queue
        if (this.isNetworkError(error)) {
          this.addToRetryQueue(request, maxRetries, context);
          return throwError(() => new Error('Erreur réseau. La requête sera réessayée automatiquement.'));
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Exécuter une requête avec fallback
   */
  executeWithFallback<T>(
    primaryRequest: () => Observable<T>,
    fallbackRequest: () => Observable<T>,
    context: string = 'unknown'
  ): Observable<T> {
    return primaryRequest().pipe(
      catchError(error => {
        console.warn(`Primary request failed for ${context}, trying fallback:`, error);
        return fallbackRequest().pipe(
          catchError(fallbackError => {
            console.error(`Both primary and fallback failed for ${context}:`, fallbackError);
            return this.executeWithRetry(primaryRequest, 2, context);
          })
        );
      })
    );
  }

  /**
   * Vérifier si l'utilisateur est en ligne
   */
  isOnline(): Observable<boolean> {
    return this.isOnline$;
  }

  /**
   * Obtenir le statut réseau détaillé
   */
  getNetworkStatus(): Observable<NetworkStatus> {
    return this.networkStatus$;
  }

  /**
   * Vérifier la connectivité en faisant un ping
   */
  checkConnectivity(): Observable<boolean> {
    return this.pingServer().pipe(
      tap(isConnected => {
        if (isConnected !== this.isOnlineSubject.value) {
          this.isOnlineSubject.next(isConnected);
          if (isConnected) {
            this.handleOnline();
          } else {
            this.handleOffline();
          }
        }
      }),
      catchError(() => {
        this.isOnlineSubject.next(false);
        this.handleOffline();
        return of(false);
      })
    );
  }

  /**
   * Obtenir la taille de la queue de retry
   */
  getRetryQueueSize(): number {
    return this.retryQueue.length;
  }

  /**
   * Vider la queue de retry
   */
  clearRetryQueue(): void {
    this.retryQueue = [];
  }

  /**
   * Obtenir les statistiques de la queue
   */
  getQueueStats(): {
    totalItems: number;
    oldestItem: number;
    contexts: { [key: string]: number };
  } {
    const contexts: { [key: string]: number } = {};
    let oldestTimestamp = Date.now();

    this.retryQueue.forEach(item => {
      contexts[item.context] = (contexts[item.context] || 0) + 1;
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
    });

    return {
      totalItems: this.retryQueue.length,
      oldestItem: Date.now() - oldestTimestamp,
      contexts
    };
  }

  private handleOnline(): void {
    console.log('Network: Back online');
    this.isOnlineSubject.next(true);
    this.updateNetworkStatus();
    this.processRetryQueue();
  }

  private handleOffline(): void {
    console.log('Network: Gone offline');
    this.isOnlineSubject.next(false);
    this.updateNetworkStatus();
  }

  private updateNetworkStatus(): void {
    const connection = (navigator as any).connection;
    const status: NetworkStatus = {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
    
    this.networkStatusSubject.next(status);
  }

  private addToRetryQueue<T>(
    request: () => Observable<T>,
    maxRetries: number,
    context: string
  ): void {
    const id = `${context}_${Date.now()}_${Math.random()}`;
    
    const queueItem: RetryQueueItem = {
      id,
      request,
      callback: (result) => {
        console.log(`Queued request succeeded: ${context}`, result);
      },
      errorCallback: (error) => {
        console.error(`Queued request failed: ${context}`, error);
      },
      maxRetries,
      currentRetries: 0,
      context,
      timestamp: Date.now()
    };

    this.retryQueue.push(queueItem);
    
    // Limiter la taille de la queue
    if (this.retryQueue.length > 50) {
      this.retryQueue.shift(); // Supprimer le plus ancien
    }
  }

  private processRetryQueue(): void {
    if (this.isProcessingQueue || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    console.log(`Processing retry queue: ${this.retryQueue.length} items`);

    const queue = [...this.retryQueue];
    this.retryQueue = [];

    // Traiter les éléments avec un délai pour éviter de surcharger le serveur
    queue.forEach((item, index) => {
      timer(index * 500).subscribe(() => {
        this.processQueueItem(item);
      });
    });

    // Marquer comme terminé après avoir traité tous les éléments
    timer(queue.length * 500 + 1000).subscribe(() => {
      this.isProcessingQueue = false;
    });
  }

  private processQueueItem(item: RetryQueueItem): void {
    item.request().subscribe({
      next: (result) => {
        item.callback(result);
      },
      error: (error) => {
        item.currentRetries++;
        
        if (item.currentRetries < item.maxRetries && this.isRetryableError(error)) {
          // Remettre en queue avec un délai
          timer(2000).subscribe(() => {
            this.retryQueue.push(item);
          });
        } else {
          item.errorCallback(error);
        }
      }
    });
  }

  private pingServer(): Observable<boolean> {
    // Ping simple vers le serveur backend
    const pingUrl = 'http://localhost:8095/api/health';
    
    return timer(0).pipe(
      switchMap(() => {
        return new Observable<boolean>(observer => {
          const img = new Image();
          const timeout = setTimeout(() => {
            observer.next(false);
            observer.complete();
          }, 5000);

          img.onload = () => {
            clearTimeout(timeout);
            observer.next(true);
            observer.complete();
          };

          img.onerror = () => {
            clearTimeout(timeout);
            observer.next(false);
            observer.complete();
          };

          // Utiliser une image 1x1 pixel pour le ping
          img.src = `${pingUrl}?t=${Date.now()}`;
        });
      })
    );
  }

  private isNetworkError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0 || error.status >= 500;
    }
    return false;
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0 || 
             error.status === 408 || 
             error.status === 429 || 
             error.status >= 500;
    }
    return true;
  }
}