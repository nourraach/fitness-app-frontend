import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { StorageService } from './service/storage-service.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// Fonction pour charger les fichiers de traduction
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),              // Animations asynchrones
    providePrimeNG(),                      // Configuration de PrimeNG
    provideZoneChangeDetection({ eventCoalescing: true }), // Optimisation des changements de zone
    provideRouter(routes),                 // Routing
    provideClientHydration(),              // Hydratation côté client
    provideHttpClient(withFetch()),        // HTTP client avec Fetch API
    StorageService,                        // Service de stockage
    importProvidersFrom(                  // Configuration des traductions
      TranslateModule.forRoot({
        defaultLanguage: 'en',
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
  ],
  
};
