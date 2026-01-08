import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../service/nutrition.service';
import { ActiviteService } from '../service/activite.service';
import { Aliment } from '../models/aliment.model';
import { TotauxJournaliers } from '../models/repas.model';
import { BilanJournalier, ActivitePhysique, TotauxActivites, calculerCalories } from '../models/activite.model';

@Component({
  selector: 'app-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suivi.component.html',
  styleUrls: ['./suivi.component.css']
})
export class SuiviComponent implements OnInit {
  dateSelectionnee: string = '';
  bilanJournalier: BilanJournalier | null = null;
  totauxRepas: TotauxJournaliers | null = null;
  totauxActivites: TotauxActivites | null = null;
  
  // Modal Repas
  afficherModalRepas: boolean = false;
  typeRepasSelectionne: string = 'PETIT_DEJEUNER';
  nomRepas: string = '';
  aliments: Aliment[] = [];
  alimentsRecherche: Aliment[] = [];
  rechercheTexte: string = '';
  alimentsSelectionnes: Array<{
    aliment: Aliment;
    quantite: number;
    portion: number;
  }> = [];
  alimentAjout: Aliment | null = null;
  quantiteAjout: number = 1;
  portionAjout: number = 100;
  
  typesRepas = [
    { value: 'PETIT_DEJEUNER', label: 'Petit-déjeuner' },
    { value: 'DEJEUNER', label: 'Déjeuner' },
    { value: 'DINER', label: 'Dîner' },
    { value: 'COLLATION', label: 'Collation' }
  ];
  
  // Modal Activité
  afficherModalActivite: boolean = false;
  typeActivite: string = '';
  dureeMinutes: number = 30;
  intensite: string = 'MODEREE';
  notesActivite: string = '';
  
  intensites = [
    { value: 'FAIBLE', label: 'Faible' },
    { value: 'MODEREE', label: 'Modérée' },
    { value: 'ELEVEE', label: 'Élevée' }
  ];
  
  typesActivites = [
    'Course à pied', 'Marche', 'Vélo', 'Natation', 'Musculation',
    'Yoga', 'Danse', 'Football', 'Basketball', 'Tennis'
  ];
  
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  
  // Calculateur de calories
  calculateur: {
    sexe: string;
    age: number;
    taille: number;
    poids: number;
    activite: number;
  } = {
    sexe: 'homme',
    age: 25,
    taille: 170,
    poids: 70,
    activite: 1.55
  };
  
  resultatCalories: {
    bmr: number;
    tdee: number;
    pertePoids: number;
    priseMasse: number;
  } | null = null;

  constructor(
    private nutritionService: NutritionService,
    private activiteService: ActiviteService
  ) {}

  ngOnInit(): void {
    this.dateSelectionnee = this.getDateAujourdhui();
    this.chargerDonnees();
    this.chargerAliments();
  }

  getDateAujourdhui(): string {
    return new Date().toISOString().split('T')[0];
  }

  chargerDonnees(): void {
    this.loading = true;
    
    console.log('🔄 Chargement des données pour la date:', this.dateSelectionnee);
    
    // Charger le bilan complet
    this.activiteService.getBilanJournalier(this.dateSelectionnee).subscribe({
      next: (bilan) => {
        this.bilanJournalier = bilan;
        this.loading = false;
        console.log('✅ Bilan journalier chargé:', bilan);
      },
      error: (err) => {
        console.error('❌ Erreur bilan journalier:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.error);
        this.loading = false;
        
        // Afficher un message à l'utilisateur si c'est un problème d'authentification
        if (err.status === 401) {
          this.afficherMessage('Session expirée - Veuillez vous reconnecter', 'error');
        } else if (err.status === 400) {
          this.afficherMessage('Erreur de chargement des données', 'error');
        }
      }
    });
    
    // Charger les repas
    this.nutritionService.getTotauxJournaliers(this.dateSelectionnee).subscribe({
      next: (data) => {
        this.totauxRepas = data;
        console.log('✅ Repas chargés:', data);
      },
      error: (err) => {
        console.error('❌ Erreur repas:', err);
      }
    });
    
    // Charger les activités
    this.activiteService.getTotauxActivites(this.dateSelectionnee).subscribe({
      next: (data) => {
        this.totauxActivites = data;
        console.log('✅ Activités chargées:', data);
      },
      error: (err) => {
        console.error('❌ Erreur activités:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.error);
        
        // Afficher un message à l'utilisateur si c'est un problème d'authentification
        if (err.status === 401) {
          this.afficherMessage('Session expirée - Veuillez vous reconnecter', 'error');
        } else if (err.status === 400) {
          this.afficherMessage('Erreur de chargement des activités', 'error');
        }
      }
    });
  }

  chargerAliments(): void {
    this.nutritionService.getTousLesAliments().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.aliments = data;
          this.alimentsRecherche = data;
          console.log('Aliments chargés depuis le backend:', data.length);
        } else {
          console.warn('Aucun aliment dans le backend, utilisation des données de démonstration');
          this.chargerAlimentsDemo();
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des aliments, utilisation des données de démonstration', err);
        this.chargerAlimentsDemo();
      }
    });
  }

  chargerAlimentsDemo(): void {
    this.aliments = [
      { id: 1, nom: 'Poulet grillé', calories: 165, proteines: 31, lipides: 3.6, glucides: 0, portionStandard: 100, unite: 'g' },
      { id: 2, nom: 'Riz blanc cuit', calories: 130, proteines: 2.7, lipides: 0.3, glucides: 28, portionStandard: 100, unite: 'g' },
      { id: 3, nom: 'Brocoli cuit', calories: 35, proteines: 2.4, lipides: 0.4, glucides: 7, portionStandard: 100, unite: 'g' },
      { id: 4, nom: 'Banane', calories: 89, proteines: 1.1, lipides: 0.3, glucides: 23, portionStandard: 100, unite: 'g' },
      { id: 5, nom: 'Œuf entier', calories: 155, proteines: 13, lipides: 11, glucides: 1.1, portionStandard: 50, unite: 'g' },
      { id: 6, nom: 'Saumon', calories: 208, proteines: 20, lipides: 13, glucides: 0, portionStandard: 100, unite: 'g' },
      { id: 7, nom: 'Avocat', calories: 160, proteines: 2, lipides: 15, glucides: 9, portionStandard: 100, unite: 'g' },
      { id: 8, nom: 'Pain complet', calories: 247, proteines: 13, lipides: 3.4, glucides: 41, portionStandard: 100, unite: 'g' },
      { id: 9, nom: 'Yaourt nature', calories: 59, proteines: 10, lipides: 0.4, glucides: 3.6, portionStandard: 100, unite: 'g' },
      { id: 10, nom: 'Pomme', calories: 52, proteines: 0.3, lipides: 0.2, glucides: 14, portionStandard: 100, unite: 'g' },
      { id: 11, nom: 'Pâtes cuites', calories: 131, proteines: 5, lipides: 1.1, glucides: 25, portionStandard: 100, unite: 'g' },
      { id: 12, nom: 'Thon en conserve', calories: 116, proteines: 26, lipides: 0.8, glucides: 0, portionStandard: 100, unite: 'g' },
      { id: 13, nom: 'Tomate', calories: 18, proteines: 0.9, lipides: 0.2, glucides: 3.9, portionStandard: 100, unite: 'g' },
      { id: 14, nom: 'Amandes', calories: 579, proteines: 21, lipides: 50, glucides: 22, portionStandard: 30, unite: 'g' },
      { id: 15, nom: 'Lait demi-écrémé', calories: 46, proteines: 3.4, lipides: 1.5, glucides: 4.8, portionStandard: 100, unite: 'ml' },
      { id: 16, nom: 'Fromage blanc 0%', calories: 44, proteines: 7.5, lipides: 0.2, glucides: 4, portionStandard: 100, unite: 'g' },
      { id: 17, nom: 'Patate douce', calories: 86, proteines: 1.6, lipides: 0.1, glucides: 20, portionStandard: 100, unite: 'g' },
      { id: 18, nom: 'Quinoa cuit', calories: 120, proteines: 4.4, lipides: 1.9, glucides: 21, portionStandard: 100, unite: 'g' },
      { id: 19, nom: 'Épinards', calories: 23, proteines: 2.9, lipides: 0.4, glucides: 3.6, portionStandard: 100, unite: 'g' },
      { id: 20, nom: 'Beurre de cacahuète', calories: 588, proteines: 25, lipides: 50, glucides: 20, portionStandard: 30, unite: 'g' }
    ];
    this.alimentsRecherche = this.aliments;
    console.log('Aliments de démonstration chargés:', this.aliments.length);
  }

  // Gestion Repas
  ouvrirModalRepas(): void {
    this.afficherModalRepas = true;
    this.nomRepas = this.getLabelTypeRepas(this.typeRepasSelectionne);
    this.alimentsSelectionnes = [];
    this.rechercheTexte = '';
  }

  fermerModalRepas(): void {
    this.afficherModalRepas = false;
    this.alimentsSelectionnes = [];
    this.alimentAjout = null;
    this.rechercheTexte = '';
  }

  rechercherAliments(): void {
    const recherche = this.rechercheTexte.trim().toLowerCase();
    
    if (recherche.length === 0) {
      this.alimentsRecherche = this.aliments;
      return;
    }
    
    if (recherche.length < 2) {
      this.alimentsRecherche = [];
      return;
    }
    
    console.log('Recherche d\'aliments avec:', recherche);
    
    // Essayer d'abord la recherche backend
    this.nutritionService.rechercherAliments(recherche).subscribe({
      next: (data) => {
        console.log('Résultats de recherche backend:', data);
        if (data && data.length > 0) {
          this.alimentsRecherche = data;
        } else {
          // Si le backend ne retourne rien, rechercher localement
          console.log('Recherche locale car backend vide');
          this.rechercherAlimentsLocalement(recherche);
        }
      },
      error: (err) => {
        console.error('Erreur backend, recherche locale:', err);
        // En cas d'erreur backend, rechercher localement
        this.rechercherAlimentsLocalement(recherche);
      }
    });
  }

  rechercherAlimentsLocalement(recherche: string): void {
    this.alimentsRecherche = this.aliments.filter(aliment => 
      aliment.nom.toLowerCase().includes(recherche) ||
      (aliment.marque && aliment.marque.toLowerCase().includes(recherche))
    );
    console.log('Résultats recherche locale:', this.alimentsRecherche.length);
    
    if (this.alimentsRecherche.length === 0) {
      console.log('Aucun aliment trouvé pour:', recherche);
    }
  }

  selectionnerAliment(aliment: Aliment): void {
    this.alimentAjout = aliment;
    this.portionAjout = aliment.portionStandard;
  }

  ajouterAlimentAuRepas(): void {
    if (this.alimentAjout) {
      this.alimentsSelectionnes.push({
        aliment: this.alimentAjout,
        quantite: this.quantiteAjout,
        portion: this.portionAjout
      });
      this.alimentAjout = null;
      this.quantiteAjout = 1;
      this.portionAjout = 100;
      this.rechercheTexte = '';
      this.alimentsRecherche = this.aliments;
    }
  }

  retirerAliment(index: number): void {
    this.alimentsSelectionnes.splice(index, 1);
  }

  calculerNutriments(aliment: Aliment, portion: number): any {
    const ratio = portion / aliment.portionStandard;
    return {
      calories: Math.round(aliment.calories * ratio),
      proteines: Math.round(aliment.proteines * ratio * 10) / 10,
      lipides: Math.round(aliment.lipides * ratio * 10) / 10,
      glucides: Math.round(aliment.glucides * ratio * 10) / 10
    };
  }

  calculerTotauxRepas(): any {
    let totaux = { calories: 0, proteines: 0, lipides: 0, glucides: 0 };
    this.alimentsSelectionnes.forEach(item => {
      const nutriments = this.calculerNutriments(item.aliment, item.portion);
      totaux.calories += nutriments.calories;
      totaux.proteines += nutriments.proteines;
      totaux.lipides += nutriments.lipides;
      totaux.glucides += nutriments.glucides;
    });
    return totaux;
  }

  enregistrerRepas(): void {
    if (this.alimentsSelectionnes.length === 0) {
      this.afficherMessage('Veuillez ajouter au moins un aliment', 'error');
      return;
    }

    // Vérifier que le nom du repas est rempli
    if (!this.nomRepas || this.nomRepas.trim() === '') {
      this.nomRepas = this.getLabelTypeRepas(this.typeRepasSelectionne);
    }

    // Vérifier que tous les aliments ont un ID valide
    const alimentsInvalides = this.alimentsSelectionnes.filter(item => !item.aliment.id || item.aliment.id <= 0);
    if (alimentsInvalides.length > 0) {
      this.afficherMessage('Certains aliments ne sont pas valides. Veuillez utiliser des aliments du backend.', 'error');
      console.error('Aliments sans ID valide:', alimentsInvalides);
      return;
    }

    const request = {
      nom: this.nomRepas,
      date: this.dateSelectionnee,
      typeRepas: this.typeRepasSelectionne,
      aliments: this.alimentsSelectionnes.map(item => ({
        alimentId: item.aliment.id!,
        quantite: item.quantite,
        portion: item.portion
      }))
    };

    console.log('Envoi de la requête repas:', request);

    this.nutritionService.creerRepas(request).subscribe({
      next: (response) => {
        console.log('Repas créé avec succès:', response);
        this.afficherMessage('Repas enregistré avec succès', 'success');
        this.fermerModalRepas();
        this.chargerDonnees();
      },
      error: (err) => {
        console.error('=== ERREUR ENREGISTREMENT REPAS ===');
        console.error('Erreur complète:', err);
        console.error('Status:', err.status);
        console.error('Message backend:', err.error);
        console.error('Request envoyée:', request);
        let messageErreur = 'Erreur lors de l\'enregistrement';
        if (err.error?.message) {
          messageErreur = err.error.message;
        } else if (err.status === 0) {
          messageErreur = 'Impossible de contacter le serveur';
        } else if (err.status === 401) {
          messageErreur = 'Non autorisé - Veuillez vous reconnecter';
        } else if (err.status === 400) {
          messageErreur = 'Données invalides - Les aliments doivent exister dans le backend';
        }
        this.afficherMessage(messageErreur, 'error');
      }
    });
  }

  supprimerRepas(repasId: number): void {
    if (confirm('Supprimer ce repas ?')) {
      this.nutritionService.supprimerRepas(repasId).subscribe({
        next: () => {
          this.afficherMessage('Repas supprimé', 'success');
          this.chargerDonnees();
        },
        error: (err) => this.afficherMessage('Erreur', 'error')
      });
    }
  }

  // Gestion Activités
  ouvrirModalActivite(): void {
    this.afficherModalActivite = true;
  }

  fermerModalActivite(): void {
    this.afficherModalActivite = false;
    this.typeActivite = '';
    this.dureeMinutes = 30;
    this.intensite = 'MODEREE';
    this.notesActivite = '';
  }

  enregistrerActivite(): void {
    // Validation des champs requis
    if (!this.typeActivite || this.typeActivite.trim() === '') {
      this.afficherMessage('Veuillez sélectionner un type d\'activité', 'error');
      return;
    }

    if (!this.dureeMinutes || this.dureeMinutes <= 0) {
      this.afficherMessage('Veuillez saisir une durée valide', 'error');
      return;
    }

    if (!this.intensite || !['FAIBLE', 'MODEREE', 'ELEVEE'].includes(this.intensite)) {
      this.afficherMessage('Veuillez sélectionner une intensité valide', 'error');
      return;
    }

    // Calculer les calories automatiquement
    const caloriesBrulees = calculerCalories(
      this.typeActivite, 
      this.dureeMinutes, 
      this.intensite as 'FAIBLE' | 'MODEREE' | 'ELEVEE'
    );

    // Construire la requête avec le bon nom de champ pour le backend
    const request = {
      typeActivite: this.typeActivite,
      dureeMinutes: this.dureeMinutes,
      caloriesBrulees: caloriesBrulees,
      intensite: this.intensite as 'FAIBLE' | 'MODEREE' | 'ELEVEE',
      date: this.dateSelectionnee, // Backend attend 'date', pas 'dateActivite'
      notes: this.notesActivite || ''
    };

    console.log('🚀 Envoi de la requête activité (composant):', request);

    // Validation simplifiée (le service fait la validation complète)
    if (!request.date || !/^\d{4}-\d{2}-\d{2}$/.test(request.date)) {
      this.afficherMessage('La date est invalide', 'error');
      return;
    }

    this.activiteService.creerActivite(request).subscribe({
      next: (response) => {
        console.log('✅ Activité créée avec succès:', response);
        this.afficherMessage(`Activité enregistrée avec succès (${caloriesBrulees} calories brûlées)`, 'success');
        this.fermerModalActivite();
        this.chargerDonnees();
      },
      error: (err) => {
        console.error('❌ Erreur lors de l\'enregistrement de l\'activité:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Message backend:', err.error);
        console.error('❌ Request envoyée:', request);
        
        let messageErreur = 'Erreur lors de l\'enregistrement';
        
        if (err.error?.message) {
          messageErreur = err.error.message;
        } else if (err.status === 0) {
          messageErreur = 'Impossible de contacter le serveur';
        } else if (err.status === 401) {
          messageErreur = 'Non autorisé - Veuillez vous reconnecter';
        } else if (err.status === 400) {
          messageErreur = 'Données invalides - Vérifiez les champs requis';
        } else if (err.status === 500) {
          messageErreur = 'Erreur serveur - Veuillez réessayer plus tard';
        }
        
        this.afficherMessage(messageErreur, 'error');
      }
    });
  }

  supprimerActivite(activiteId: number): void {
    if (confirm('Supprimer cette activité ?')) {
      this.activiteService.supprimerActivite(activiteId).subscribe({
        next: () => {
          this.afficherMessage('Activité supprimée', 'success');
          this.chargerDonnees();
        },
        error: (err) => this.afficherMessage('Erreur', 'error')
      });
    }
  }

  getLabelTypeRepas(type: string): string {
    const typeObj = this.typesRepas.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  }

  afficherMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  changerDate(): void {
    this.chargerDonnees();
  }

  // Calculateur de calories - Formule de Harris-Benedict
  calculerCalories(): void {
    let bmr: number;
    
    if (this.calculateur.sexe === 'homme') {
      bmr = 88.362 + (13.397 * this.calculateur.poids) + (4.799 * this.calculateur.taille) - (5.677 * this.calculateur.age);
    } else {
      bmr = 447.593 + (9.247 * this.calculateur.poids) + (3.098 * this.calculateur.taille) - (4.330 * this.calculateur.age);
    }
    
    const tdee = bmr * this.calculateur.activite;
    const pertePoids = tdee - 500;
    const priseMasse = tdee + 300;
    
    this.resultatCalories = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      pertePoids: Math.round(pertePoids),
      priseMasse: Math.round(priseMasse)
    };
  }
}
