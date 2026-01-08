import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { CoachNavbarComponent } from '../coach-navbar/coach-navbar.component';
import { PlanNutritionnelService } from './plan-nutritionnel.service';
import { ProfileService } from '../service/profile.service';
import { JwtService } from '../service/jwt.service';
import { DailyPlan, WeeklyPlan, PREFERENCES_ALIMENTAIRES } from '../models/meal-plan.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-plan-nutritionnel',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, CoachNavbarComponent],
  templateUrl: './plan-nutritionnel.component.html',
  styleUrl: './plan-nutritionnel.component.css'
})
export class PlanNutritionnelComponent implements OnInit {
  // Vue actuelle
  viewMode: 'daily' | 'weekly' = 'daily';
  
  // Plans générés
  planJournalier: DailyPlan | null = null;
  planHebdomadaire: WeeklyPlan | null = null;
  jourSelectionne: number = 0;
  
  // Paramètres utilisateur
  caloriesCibles: number = 2000;
  preferencesSelectionnees: string[] = ['Tous'];
  preferencesDisponibles = PREFERENCES_ALIMENTAIRES;
  
  // État
  isLoading = false;
  isCoach = false;
  successMessage = '';
  
  // Jours de la semaine
  joursNoms = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  constructor(
    private planService: PlanNutritionnelService,
    private profileService: ProfileService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.checkRole();
    this.chargerProfilEtGenerer();
  }

  checkRole(): void {
    const role = this.jwtService.getRole();
    this.isCoach = role === 'ROLE_COACH' || role?.toLowerCase() === 'coach';
  }

  chargerProfilEtGenerer(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        // Calculer les calories selon l'objectif
        if (profile.besoinsCaloriques) {
          this.caloriesCibles = profile.besoinsCaloriques;
        } else {
          // Calcul local si pas de besoins caloriques
          this.caloriesCibles = this.calculerCalories(profile);
        }
        this.genererPlans();
        this.isLoading = false;
      },
      error: () => {
        // Utiliser valeur par défaut
        this.caloriesCibles = 2000;
        this.genererPlans();
        this.isLoading = false;
      }
    });
  }

  calculerCalories(profile: any): number {
    let bmr: number;
    if (profile.sexe === 'HOMME') {
      bmr = 88.362 + (13.397 * profile.poids) + (4.799 * profile.taille) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.poids) + (3.098 * profile.taille) - (4.330 * profile.age);
    }
    
    const multiplicateurs: { [key: string]: number } = {
      'SEDENTAIRE': 1.2, 'LEGER': 1.375, 'MODERE': 1.55, 'INTENSE': 1.725, 'TRES_INTENSE': 1.9
    };
    const tdee = bmr * (multiplicateurs[profile.niveauActivite] || 1.55);
    
    // Ajuster selon objectif
    if (profile.objectif === 'PERTE_POIDS') return Math.round(tdee - 500);
    if (profile.objectif === 'PRISE_MASSE') return Math.round(tdee + 300);
    return Math.round(tdee);
  }


  genererPlans(): void {
    this.planJournalier = this.planService.genererPlanJournalier(
      this.caloriesCibles,
      this.preferencesSelectionnees
    );
    this.planHebdomadaire = this.planService.genererPlanHebdomadaire(
      this.caloriesCibles,
      this.preferencesSelectionnees
    );
    this.jourSelectionne = 0;
  }

  regenererPlan(): void {
    this.genererPlans();
    this.successMessage = 'Plan régénéré avec succès !';
    setTimeout(() => this.successMessage = '', 3000);
  }

  togglePreference(pref: string): void {
    if (pref === 'Tous') {
      this.preferencesSelectionnees = ['Tous'];
    } else {
      // Retirer "Tous" si on sélectionne autre chose
      this.preferencesSelectionnees = this.preferencesSelectionnees.filter(p => p !== 'Tous');
      
      const index = this.preferencesSelectionnees.indexOf(pref);
      if (index > -1) {
        this.preferencesSelectionnees.splice(index, 1);
      } else {
        this.preferencesSelectionnees.push(pref);
      }
      
      // Si aucune préférence, remettre "Tous"
      if (this.preferencesSelectionnees.length === 0) {
        this.preferencesSelectionnees = ['Tous'];
      }
    }
    this.genererPlans();
  }

  isPreferenceSelected(pref: string): boolean {
    return this.preferencesSelectionnees.includes(pref);
  }

  getPlanJourSelectionne(): DailyPlan | null {
    if (this.planHebdomadaire && this.planHebdomadaire.days[this.jourSelectionne]) {
      return this.planHebdomadaire.days[this.jourSelectionne];
    }
    return null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  exporterPDF(): void {
    const doc = new jsPDF();
    const plan = this.viewMode === 'daily' ? this.planJournalier : this.getPlanJourSelectionne();
    
    if (!plan) return;

    // Titre
    doc.setFontSize(20);
    doc.setTextColor(17, 63, 103);
    doc.text('Plan Nutritionnel', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Calories cibles: ${this.caloriesCibles} kcal`, 105, 30, { align: 'center' });
    doc.text(`Date: ${this.formatDate(plan.date)}`, 105, 38, { align: 'center' });

    // Tableau des repas
    const tableData = [
      ['Petit-déjeuner', plan.petitDejeuner.name, `${plan.petitDejeuner.calories} kcal`],
      ['Déjeuner', plan.dejeuner.name, `${plan.dejeuner.calories} kcal`],
      ['Dîner', plan.diner.name, `${plan.diner.calories} kcal`],
      ['Collation', plan.collation.name, `${plan.collation.calories} kcal`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Repas', 'Plat', 'Calories']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [17, 63, 103] }
    });

    // Totaux
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(17, 63, 103);
    doc.text('Totaux journaliers:', 14, finalY);
    
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Calories: ${plan.totalCalories} kcal`, 14, finalY + 8);
    doc.text(`Protéines: ${plan.totalProteines}g`, 14, finalY + 16);
    doc.text(`Glucides: ${plan.totalGlucides}g`, 80, finalY + 16);
    doc.text(`Lipides: ${plan.totalLipides}g`, 140, finalY + 16);

    doc.save(`plan-nutritionnel-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  exporterPlanHebdoPDF(): void {
    if (!this.planHebdomadaire) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(17, 63, 103);
    doc.text('Plan Nutritionnel Hebdomadaire', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Calories cibles: ${this.caloriesCibles} kcal/jour`, 105, 30, { align: 'center' });

    const tableData = this.planHebdomadaire.days.map((day, i) => [
      this.joursNoms[i],
      day.petitDejeuner.name,
      day.dejeuner.name,
      day.diner.name,
      `${day.totalCalories} kcal`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Jour', 'Petit-déj', 'Déjeuner', 'Dîner', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [17, 63, 103] },
      columnStyles: { 0: { fontStyle: 'bold' } }
    });

    doc.save(`plan-hebdomadaire-${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
