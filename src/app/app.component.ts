import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./navbar/navbar.component";
import { HomeComponent } from "./home/home.component";
import { TranslateModule, TranslateService } from '@ngx-translate/core';


@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NavbarComponent, TranslateModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'frontendProjetStage';
  constructor(private translate: TranslateService) {
    // Vérifier le stockage local pour récupérer la langue préférée
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedLang = localStorage.getItem('selectedLanguage');
      const defaultLang = storedLang ? storedLang : 'en'; // Langue par défaut si aucune langue n'est stockée
      this.translate.setDefaultLang(defaultLang);
      this.translate.use(defaultLang); // Utiliser la langue stockée ou par défaut

      // Appliquer la direction du texte (RTL ou LTR) au chargement
      this.applyDirection(defaultLang);
    } else {
      this.translate.setDefaultLang('en'); // Langue par défaut si SSR
      this.translate.use('en');
      this.applyDirection('en');
    }
  }

  // Fonction pour appliquer la direction du texte (RTL ou LTR)
  private applyDirection(lang: string) {
    // Vérifier si l'on est dans un environnement navigateur
    if (typeof window !== 'undefined' && document) {
      if (lang === 'ar') {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      } else {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }
    }
  }
  
  changeLanguage(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const lang = selectElement.value;

    this.translate.use(lang); // Changer la langue dynamiquement

    // Sauvegarder la langue sélectionnée dans localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('selectedLanguage', lang);
    }

    // Appliquer la direction du texte selon la langue choisie
    this.applyDirection(lang);

    // Log de la langue choisie
    console.log(`Language changed to: ${lang}`);
  }
}