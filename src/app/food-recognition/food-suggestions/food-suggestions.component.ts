import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FoodRecognitionService } from '../../services/food-recognition.service';
import { FoodSuggestionDTO } from '../../models/food-recognition.model';

@Component({
  selector: 'app-food-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-suggestions.component.html',
  styleUrls: ['./food-suggestions.component.css']
})
export class FoodSuggestionsComponent implements OnDestroy {
  @Output() foodSelected = new EventEmitter<FoodSuggestionDTO>();
  @Output() manualEntry = new EventEmitter<string>();

  searchTerm = '';
  suggestions: FoodSuggestionDTO[] = [];
  isLoading = false;
  showSuggestions = false;
  selectedIndex = -1;

  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(private foodRecognitionService: FoodRecognitionService) {
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.searchSubject.complete();
  }

  private setupSearch(): void {
    const searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          return [];
        }
        this.isLoading = true;
        return this.foodRecognitionService.getFoodSuggestions(term);
      })
    ).subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
        this.isLoading = false;
        this.showSuggestions = suggestions.length > 0;
        this.selectedIndex = -1;
      },
      error: (error) => {
        console.error('Error fetching suggestions:', error);
        this.suggestions = [];
        this.isLoading = false;
        this.showSuggestions = false;
      }
    });
    this.subscriptions.push(searchSub);
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
    
    if (this.searchTerm.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      this.selectedIndex = -1;
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.showSuggestions || this.suggestions.length === 0) {
      if (event.key === 'Enter' && this.searchTerm.trim()) {
        this.selectManualEntry();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.suggestions.length) {
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        } else if (this.searchTerm.trim()) {
          this.selectManualEntry();
        }
        break;
      
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  selectSuggestion(suggestion: FoodSuggestionDTO): void {
    this.foodSelected.emit(suggestion);
    this.searchTerm = suggestion.name;
    this.hideSuggestions();
  }

  selectManualEntry(): void {
    if (this.searchTerm.trim()) {
      this.manualEntry.emit(this.searchTerm.trim());
      this.hideSuggestions();
    }
  }

  hideSuggestions(): void {
    this.showSuggestions = false;
    this.selectedIndex = -1;
  }

  onFocus(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur(): void {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      this.hideSuggestions();
    }, 200);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.suggestions = [];
    this.hideSuggestions();
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'fruits': 'fas fa-apple-alt',
      'vegetables': 'fas fa-carrot',
      'grains': 'fas fa-seedling',
      'protein': 'fas fa-drumstick-bite',
      'dairy': 'fas fa-cheese',
      'beverages': 'fas fa-glass-whiskey',
      'snacks': 'fas fa-cookie-bite',
      'desserts': 'fas fa-ice-cream',
      'default': 'fas fa-utensils'
    };
    
    return iconMap[category.toLowerCase()] || iconMap['default'];
  }

  formatCalories(calories: number): string {
    return `${calories} cal/100g`;
  }

  highlightMatch(text: string, searchTerm: string): string {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  getPopularFoods(): string[] {
    return [
      'Pomme', 'Banane', 'Pain', 'Riz', 'Poulet', 'Saumon',
      'Brocoli', 'Carotte', 'Yaourt', 'Œuf', 'Avocat', 'Tomate'
    ];
  }
}