import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Vérifie si localStorage est disponible
  isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false; // Environnement non-navigateur
      }
      // Test d'accès à localStorage
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      console.error('localStorage n’est pas disponible :', e);
      return false;
    }
  }

  // Stocker une valeur dans localStorage
  setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    } else {
      console.error('Impossible de sauvegarder dans localStorage. Environnement non supporté.');
    }
  }

  // Lire une valeur depuis localStorage
  
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
  
  getItem(key: string): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(key);
    }
    console.warn('localStorage non supporté dans cet environnement.');
    return null;
  }
  
  removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    } else {
      console.warn('localStorage non supporté dans cet environnement.');
    }
  }
  

  

  
}
