import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../service/nutrition.service';
import { Aliment } from '../models/aliment.model';
import { Repas, CreerRepasRequest, TotauxJournaliers } from '../models/repas.model';

interface PlatSuggere {
  id: number;
  nom: string;
  description: string;
  categorie: string;
  calories: number;
  proteines: number;
  lipides: number;
  glucides: number;
  tempsPreparation: number;
  difficulte: string;
  ingredients: string[];
  imageUrl?: string;
  prix?: number;
  note?: number;
}

interface AlimentSelectionne {
  aliment: Aliment;
  quantite: number;
  portion: number;
}

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nutrition.component.html',
  styleUrls: ['./nutrition.component.css']
})
export class NutritionComponent implements OnInit {
  // Section Plats Suggérés
  plats: PlatSuggere[] = [];
  platsAffiches: PlatSuggere[] = [];
  categorieSelectionnee: string = 'TOUS';
  rechercheTexte: string = '';
  
  categories = [
    { value: 'TOUS', label: 'Tous les plats' },
    { value: 'PETIT_DEJEUNER', label: 'Petit-déjeuner' },
    { value: 'DEJEUNER', label: 'Déjeuner' },
    { value: 'DINER', label: 'Dîner' },
    { value: 'COLLATION', label: 'Collation' },
    { value: 'VEGETARIEN', label: 'Végétarien' },
    { value: 'VEGAN', label: 'Vegan' },
    { value: 'PROTEINES', label: 'Riche en protéines' },
    { value: 'FAIBLE_CALORIES', label: 'Faible en calories' },
    { value: 'SANS_GLUTEN', label: 'Sans gluten' },
    { value: 'SANS_LACTOSE', label: 'Sans lactose' },
    { value: 'KETO', label: 'Keto' },
    { value: 'PALEO', label: 'Paléo' }
  ];

  platSelectionne: PlatSuggere | null = null;
  afficherModal: boolean = false;
  afficherDropdown: boolean = false;

  // Section Mes Repas
  afficherModalRepas: boolean = false;
  afficherModalAliment: boolean = false;
  rechercheAliment: string = '';
  alimentsRecherches: Aliment[] = [];
  alimentsSelectionnes: AlimentSelectionne[] = [];
  alimentEnCours: Aliment | null = null;
  quantiteAliment: number = 1;
  portionAliment: number = 100;
  
  nomRepas: string = '';
  typeRepas: string = 'DEJEUNER';
  dateRepas: string = '';
  
  totauxJournaliers: TotauxJournaliers | null = null;
  chargementRepas: boolean = false;
  chargementAliments: boolean = false;
  messageErreur: string = '';

  constructor(private nutritionService: NutritionService) {}

  ngOnInit(): void {
    this.chargerPlatsSuggeres();
    this.dateRepas = this.getDateAujourdhui();
    this.chargerRepasJournaliers();
  }

  getDateAujourdhui(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  chargerPlatsSuggeres(): void {
    // Données de démonstration - À remplacer par un appel API
    this.plats = [
      {
        id: 1,
        nom: 'Bowl Protéiné au Poulet',
        description: 'Un bol équilibré avec poulet grillé, quinoa, légumes frais et sauce légère',
        categorie: 'DEJEUNER',
        calories: 450,
        proteines: 35,
        lipides: 12,
        glucides: 45,
        tempsPreparation: 25,
        difficulte: 'Facile',
        ingredients: ['200g poulet', '100g quinoa', 'Brocoli', 'Tomates', 'Avocat', 'Sauce yaourt'],
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        prix: 15,
        note: 4.5
      },
      {
        id: 2,
        nom: 'Omelette aux Légumes',
        description: 'Omelette protéinée avec légumes de saison',
        categorie: 'PETIT_DEJEUNER',
        calories: 280,
        proteines: 22,
        lipides: 18,
        glucides: 8,
        tempsPreparation: 15,
        difficulte: 'Facile',
        ingredients: ['3 œufs', 'Poivrons', 'Oignons', 'Tomates', 'Fromage léger'],
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
        prix: 8,
        note: 4.2
      },
      {
        id: 3,
        nom: 'Salade de Saumon et Avocat',
        description: 'Salade fraîche avec saumon grillé, avocat et vinaigrette maison',
        categorie: 'DEJEUNER',
        calories: 520,
        proteines: 30,
        lipides: 35,
        glucides: 20,
        tempsPreparation: 20,
        difficulte: 'Facile',
        ingredients: ['150g saumon', '1 avocat', 'Salade verte', 'Tomates cerises', 'Huile d\'olive'],
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        prix: 18,
        note: 4.8
      },
      {
        id: 4,
        nom: 'Smoothie Bowl Énergétique',
        description: 'Bowl de smoothie aux fruits avec granola et graines',
        categorie: 'PETIT_DEJEUNER',
        calories: 350,
        proteines: 12,
        lipides: 8,
        glucides: 58,
        tempsPreparation: 10,
        difficulte: 'Très facile',
        ingredients: ['Banane', 'Fraises', 'Yaourt grec', 'Granola', 'Graines de chia', 'Miel'],
        imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400',
        prix: 10,
        note: 4.6
      },
      {
        id: 5,
        nom: 'Poulet Teriyaki avec Riz Complet',
        description: 'Poulet mariné sauce teriyaki avec riz complet et légumes sautés',
        categorie: 'DINER',
        calories: 580,
        proteines: 42,
        lipides: 15,
        glucides: 65,
        tempsPreparation: 35,
        difficulte: 'Moyen',
        ingredients: ['200g poulet', 'Riz complet', 'Sauce teriyaki', 'Brocoli', 'Carottes', 'Gingembre'],
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
        prix: 16,
        note: 4.7
      },
      {
        id: 6,
        nom: 'Wrap Végétarien',
        description: 'Wrap complet avec houmous, légumes grillés et feta',
        categorie: 'VEGETARIEN',
        calories: 420,
        proteines: 18,
        lipides: 16,
        glucides: 52,
        tempsPreparation: 20,
        difficulte: 'Facile',
        ingredients: ['Tortilla complète', 'Houmous', 'Aubergine', 'Poivrons', 'Feta', 'Roquette'],
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
        prix: 12,
        note: 4.3
      },
      {
        id: 7,
        nom: 'Yaourt Grec aux Fruits',
        description: 'Yaourt grec nature avec fruits frais et noix',
        categorie: 'COLLATION',
        calories: 220,
        proteines: 15,
        lipides: 8,
        glucides: 25,
        tempsPreparation: 5,
        difficulte: 'Très facile',
        ingredients: ['Yaourt grec', 'Myrtilles', 'Fraises', 'Amandes', 'Miel'],
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
        prix: 6,
        note: 4.4
      },
      {
        id: 8,
        nom: 'Steak de Thon Grillé',
        description: 'Thon grillé avec patate douce et haricots verts',
        categorie: 'DINER',
        calories: 480,
        proteines: 45,
        lipides: 12,
        glucides: 42,
        tempsPreparation: 30,
        difficulte: 'Moyen',
        ingredients: ['200g thon', 'Patate douce', 'Haricots verts', 'Citron', 'Herbes'],
        imageUrl: 'https://images.unsplash.com/photo-1580959375944-1ab5b8c78f15?w=400',
        prix: 20,
        note: 4.9
      }
    ];
    
    this.platsAffiches = this.plats;
  }

  filtrerPlats(): void {
    this.platsAffiches = this.plats.filter(plat => {
      const matchCategorie = this.categorieSelectionnee === 'TOUS' || plat.categorie === this.categorieSelectionnee;
      const matchRecherche = plat.nom.toLowerCase().includes(this.rechercheTexte.toLowerCase()) ||
                            plat.description.toLowerCase().includes(this.rechercheTexte.toLowerCase());
      return matchCategorie && matchRecherche;
    });
  }

  changerCategorie(): void {
    this.filtrerPlats();
  }

  rechercherPlats(): void {
    this.filtrerPlats();
  }

  afficherDetails(plat: PlatSuggere): void {
    this.platSelectionne = plat;
    this.afficherModal = true;
  }

  fermerModal(): void {
    this.afficherModal = false;
    this.platSelectionne = null;
  }

  getLabelCategorie(categorie: string): string {
    const cat = this.categories.find(c => c.value === categorie);
    return cat ? cat.label : categorie;
  }

  toggleDropdown(): void {
    this.afficherDropdown = !this.afficherDropdown;
  }

  selectionnerCategorie(categorie: string): void {
    this.categorieSelectionnee = categorie;
    this.afficherDropdown = false;
    this.changerCategorie();
  }

  // Méthodes pour Mes Repas
  chargerRepasJournaliers(): void {
    this.chargementRepas = true;
    this.messageErreur = '';
    
    this.nutritionService.getTotauxJournaliers(this.dateRepas).subscribe({
      next: (data) => {
        this.totauxJournaliers = data;
        this.chargementRepas = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des repas:', error);
        this.messageErreur = 'Erreur lors du chargement des repas';
        this.chargementRepas = false;
        // Initialiser avec des valeurs vides si erreur
        this.totauxJournaliers = {
          date: this.dateRepas,
          caloriesTotal: 0,
          proteinesTotal: 0,
          lipidesTotal: 0,
          glucidesTotal: 0,
          repas: []
        };
      }
    });
  }

  ouvrirModalRepas(): void {
    this.afficherModalRepas = true;
    this.nomRepas = '';
    this.typeRepas = 'DEJEUNER';
    this.alimentsSelectionnes = [];
    this.rechercheAliment = '';
    this.alimentsRecherches = [];
  }

  fermerModalRepas(): void {
    this.afficherModalRepas = false;
    this.alimentsSelectionnes = [];
    this.rechercheAliment = '';
    this.alimentsRecherches = [];
  }

  rechercherAliments(): void {
    if (this.rechercheAliment.trim().length < 2) {
      this.alimentsRecherches = [];
      return;
    }

    this.chargementAliments = true;
    this.nutritionService.rechercherAliments(this.rechercheAliment).subscribe({
      next: (aliments) => {
        this.alimentsRecherches = aliments;
        this.chargementAliments = false;
      },
      error: (error) => {
        console.error('Erreur lors de la recherche d\'aliments:', error);
        this.alimentsRecherches = [];
        this.chargementAliments = false;
      }
    });
  }

  ouvrirModalAliment(aliment: Aliment): void {
    this.alimentEnCours = aliment;
    this.quantiteAliment = 1;
    this.portionAliment = aliment.portionStandard || 100;
    this.afficherModalAliment = true;
  }

  fermerModalAliment(): void {
    this.afficherModalAliment = false;
    this.alimentEnCours = null;
  }

  ajouterAliment(): void {
    if (this.alimentEnCours) {
      this.alimentsSelectionnes.push({
        aliment: this.alimentEnCours,
        quantite: this.quantiteAliment,
        portion: this.portionAliment
      });
      this.fermerModalAliment();
      this.rechercheAliment = '';
      this.alimentsRecherches = [];
    }
  }

  retirerAliment(index: number): void {
    this.alimentsSelectionnes.splice(index, 1);
  }

  calculerCaloriesAliment(alimentSel: AlimentSelectionne): number {
    const ratio = (alimentSel.quantite * alimentSel.portion) / (alimentSel.aliment.portionStandard || 100);
    return Math.round(alimentSel.aliment.calories * ratio);
  }

  calculerTotalCalories(): number {
    return this.alimentsSelectionnes.reduce((total, alimentSel) => {
      return total + this.calculerCaloriesAliment(alimentSel);
    }, 0);
  }

  enregistrerRepas(): void {
    if (!this.nomRepas.trim() || this.alimentsSelectionnes.length === 0) {
      alert('Veuillez saisir un nom et ajouter au moins un aliment');
      return;
    }

    const request: CreerRepasRequest = {
      nom: this.nomRepas,
      date: this.dateRepas,
      typeRepas: this.typeRepas,
      aliments: this.alimentsSelectionnes.map(alimentSel => ({
        alimentId: alimentSel.aliment.id!,
        quantite: alimentSel.quantite,
        portion: alimentSel.portion
      }))
    };

    this.nutritionService.creerRepas(request).subscribe({
      next: (repas) => {
        console.log('Repas créé avec succès:', repas);
        this.fermerModalRepas();
        this.chargerRepasJournaliers();
      },
      error: (error) => {
        console.error('Erreur lors de la création du repas:', error);
        alert('Erreur lors de la création du repas');
      }
    });
  }

  supprimerRepas(repasId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce repas ?')) {
      this.nutritionService.supprimerRepas(repasId).subscribe({
        next: () => {
          console.log('Repas supprimé avec succès');
          this.chargerRepasJournaliers();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du repas:', error);
          alert('Erreur lors de la suppression du repas');
        }
      });
    }
  }

  changerDate(): void {
    this.chargerRepasJournaliers();
  }

  getLabelTypeRepas(type: string): string {
    const labels: { [key: string]: string } = {
      'PETIT_DEJEUNER': 'Petit-déjeuner',
      'DEJEUNER': 'Déjeuner',
      'DINER': 'Dîner',
      'COLLATION': 'Collation'
    };
    return labels[type] || type;
  }
}
