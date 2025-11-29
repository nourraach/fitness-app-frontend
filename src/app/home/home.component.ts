import { Component, OnInit, HostListener } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Meal {
  name: string;
  description: string;
  price: number;
  image: string;
}

interface FAQ {
  question: string;
  answer: string;
  open: boolean;
}

interface Calculateur {
  sexe: string;
  age: number;
  taille: number;
  poids: number;
  activite: number;
}

interface ResultatCalories {
  bmr: number;
  tdee: number;
  pertePoids: number;
  priseMasse: number;
}

@Component({
    selector: 'app-home',
    imports: [TranslateModule, CommonModule, FormsModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  scrollY = 0;
  
  // Calculateur de calories
  calculateur: Calculateur = {
    sexe: 'homme',
    age: 25,
    taille: 170,
    poids: 70,
    activite: 1.55
  };
  
  resultatCalories: ResultatCalories | null = null;

  ngOnInit(): void {
    // Animation d'entrée au chargement
    this.animateOnLoad();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.scrollY = window.scrollY;
    this.applyParallaxEffect();
  }

  private applyParallaxEffect(): void {
    const heroImage = document.querySelector('.hero-image img') as HTMLElement;
    const greenCircle = document.querySelector('.green-circle') as HTMLElement;
    const floatingIcons = document.querySelectorAll('.floating-icon');

    if (heroImage && this.scrollY < 800) {
      heroImage.style.transform = `translateY(${this.scrollY * 0.3}px)`;
    }

    if (greenCircle && this.scrollY < 800) {
      greenCircle.style.transform = `translateY(-50%) translateX(${this.scrollY * 0.2}px)`;
    }

    floatingIcons.forEach((icon, index) => {
      const element = icon as HTMLElement;
      const speed = 0.1 + (index * 0.05);
      if (this.scrollY < 800) {
        element.style.transform = `translateY(${this.scrollY * speed}px)`;
      }
    });
  }

  private animateOnLoad(): void {
    setTimeout(() => {
      const heroTitle = document.querySelector('.hero-title') as HTMLElement;
      const heroFeatures = document.querySelector('.hero-features') as HTMLElement;
      
      if (heroTitle) {
        heroTitle.style.animation = 'slideInLeft 1s ease-out';
      }
      if (heroFeatures) {
        heroFeatures.style.animation = 'fadeInUp 1s ease-out 0.3s both';
      }
    }, 100);
  }
  meals: Meal[] = [
    {
      name: 'Bowl Protéiné',
      description: 'Quinoa, poulet grillé et légumes frais',
      price: 12.90,
      image: 'assets/images/meal1.png'
    },
    {
      name: 'Salade Fitness',
      description: 'Salade complète avec thon et avocat',
      price: 10.50,
      image: 'assets/images/meal2.png'
    },
    {
      name: 'Wrap Énergétique',
      description: 'Wrap complet avec poulet et crudités',
      price: 9.90,
      image: 'assets/images/meal3.png'
    },
    {
      name: 'Smoothie Bowl',
      description: 'Bowl de fruits frais et granola',
      price: 8.50,
      image: 'assets/images/meal4.png'
    }
  ];

  faqs: FAQ[] = [
    {
      question: 'Comment commencer mon programme fitness ?',
      answer: 'Inscrivez-vous gratuitement, complétez votre profil et choisissez un programme adapté à vos objectifs. Nos coachs vous guideront étape par étape.',
      open: false
    },
    {
      question: 'Les programmes sont-ils adaptés aux débutants ?',
      answer: 'Absolument ! Nous proposons des programmes pour tous les niveaux, du débutant au confirmé. Chaque exercice est expliqué en détail avec des vidéos.',
      open: false
    },
    {
      question: 'Puis-je suivre ma progression ?',
      answer: 'Oui, notre dashboard vous permet de suivre vos entraînements, votre nutrition, vos mensurations et vos performances en temps réel.',
      open: false
    },
    {
      question: 'Proposez-vous des plans nutritionnels ?',
      answer: 'Oui, nous offrons des plans nutritionnels personnalisés selon vos objectifs : perte de poids, prise de masse, ou maintien. Avec des recettes faciles et équilibrées.',
      open: false
    }
  ];

  toggleFaq(faq: FAQ): void {
    faq.open = !faq.open;
  }
  
  // Calculateur de calories - Formule de Harris-Benedict
  calculerCalories(): void {
    let bmr: number;
    
    // Calcul du métabolisme de base (BMR)
    if (this.calculateur.sexe === 'homme') {
      // Formule pour les hommes: BMR = 88.362 + (13.397 × poids en kg) + (4.799 × taille en cm) - (5.677 × âge en années)
      bmr = 88.362 + (13.397 * this.calculateur.poids) + (4.799 * this.calculateur.taille) - (5.677 * this.calculateur.age);
    } else {
      // Formule pour les femmes: BMR = 447.593 + (9.247 × poids en kg) + (3.098 × taille en cm) - (4.330 × âge en années)
      bmr = 447.593 + (9.247 * this.calculateur.poids) + (3.098 * this.calculateur.taille) - (4.330 * this.calculateur.age);
    }
    
    // Calcul des besoins caloriques quotidiens (TDEE)
    const tdee = bmr * this.calculateur.activite;
    
    // Calcul pour la perte de poids (déficit de 500 kcal)
    const pertePoids = tdee - 500;
    
    // Calcul pour la prise de masse (surplus de 300 kcal)
    const priseMasse = tdee + 300;
    
    this.resultatCalories = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      pertePoids: Math.round(pertePoids),
      priseMasse: Math.round(priseMasse)
    };
  }
}
