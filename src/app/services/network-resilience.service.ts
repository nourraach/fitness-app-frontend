import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: any;
  timestamp: number;
  retryCount: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkResilienceService {
  private readonly maxRetries = 3;
  private readonly queueKey = 'offline_request_queue';
  
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    isOnline: navigator.onLine
  });
  
  private requestQueue: QueuedRequest[] = [];
  
  public networkStatus$ = this.networkStatusSubject.asObservable();
  public isOnline$ = this.networkStatus$.pipe(
    map(status => status.isOnline),
    distinctUntilChanged()
  );

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadQueueFromStorage();
    this.setupAutoSync();
  }

  private initializeNetworkMonitoring(): void {
    // Basic online/offline detection
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        debounceTime(100)
      )
      .subscribe(isOnline => {
        this.updateNetworkStatus({ isOnline });
        
        if (isOnline) {
          this.processQueue();
        }
      });

    // Enhanced network information (if available)
    this.monitorConnectionQuality();
  }

  private monitorConnectionQuality(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        const updateConnectionInfo = () => {
          this.updateNetworkStatus({
            isOnline: navigator.onLine,
            connectionType: connection.type,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          });
        };

        connection.addEventListener('change', updateConnectionInfo);
        updateConnectionInfo();
      }
    }
  }

  private updateNetworkStatus(status: Partial<NetworkStatus>): void {
    const currentStatus = this.networkStatusSubject.value;
    const newStatus = { ...currentStatus, ...status };
    this.networkStatusSubject.next(newStatus);
  }

  // Queue a request for later execution when online
  queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): string {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateRequestId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    this.requestQueue.push(queuedRequest);
    this.saveQueueToStorage();
    
    console.log('Request queued for offline processing:', queuedRequest.id);
    return queuedRequest.id;
  }

  // Remove a request from the queue
  removeFromQueue(requestId: string): void {
    this.requestQueue = this.requestQueue.filter(req => req.id !== requestId);
    this.saveQueueToStorage();
  }

  // Get current queue status
  getQueueStatus(): { count: number; oldestTimestamp?: number } {
    const count = this.requestQueue.length;
    const oldestTimestamp = this.requestQueue.length > 0 
      ? Math.min(...this.requestQueue.map(req => req.timestamp))
      : undefined;
    
    return { count, oldestTimestamp };
  }

  // Process all queued requests
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.requestQueue.length} queued requests`);
    
    const requestsToProcess = [...this.requestQueue];
    
    for (const request of requestsToProcess) {
      try {
        await this.executeQueuedRequest(request);
        this.removeFromQueue(request.id);
        console.log('Successfully processed queued request:', request.id);
      } catch (error) {
        console.error('Failed to process queued request:', request.id, error);
        
        request.retryCount++;
        if (request.retryCount >= this.maxRetries) {
          console.warn('Max retries exceeded for request:', request.id);
          this.removeFromQueue(request.id);
        } else {
          this.saveQueueToStorage();
        }
      }
    }
  }

  private async executeQueuedRequest(request: QueuedRequest): Promise<any> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers
      },
      body: request.body ? JSON.stringify(request.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private setupAutoSync(): void {
    // Auto-sync when coming back online
    this.isOnline$.subscribe(isOnline => {
      if (isOnline && this.requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000); // Small delay to ensure connection is stable
      }
    });

    // Periodic sync attempt (every 30 seconds when online)
    setInterval(() => {
      if (this.networkStatusSubject.value.isOnline && this.requestQueue.length > 0) {
        this.processQueue();
      }
    }, 30000);
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.queueKey);
      if (stored) {
        this.requestQueue = JSON.parse(stored);
        console.log(`Loaded ${this.requestQueue.length} requests from storage`);
      }
    } catch (error) {
      console.error('Failed to load request queue from storage:', error);
      this.requestQueue = [];
    }
  }

  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.queueKey, JSON.stringify(this.requestQueue));
    } catch (error) {
      console.error('Failed to save request queue to storage:', error);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public method to check connection quality
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    const status = this.networkStatusSubject.value;
    
    if (!status.isOnline) {
      return 'poor';
    }

    if (status.effectiveType) {
      switch (status.effectiveType) {
        case '4g':
          return 'excellent';
        case '3g':
          return 'good';
        case '2g':
          return 'fair';
        case 'slow-2g':
          return 'poor';
        default:
          return 'unknown';
      }
    }

    if (status.rtt !== undefined) {
      if (status.rtt < 100) return 'excellent';
      if (status.rtt < 300) return 'good';
      if (status.rtt < 1000) return 'fair';
      return 'poor';
    }

    return 'unknown';
  }

  // Method to determine if we should use degraded mode
  shouldUseDegradedMode(): boolean {
    const quality = this.getConnectionQuality();
    return quality === 'poor' || quality === 'fair';
  }

  // Clear all queued requests (useful for logout or reset)
  clearQueue(): void {
    this.requestQueue = [];
    localStorage.removeItem(this.queueKey);
    console.log('Request queue cleared');
  }
}