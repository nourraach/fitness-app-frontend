# Intégration avec le Backend Spring Boot

## 📡 Configuration de l'API

### 1. Créer un service Angular pour l'API

Créez un service pour gérer les appels API :

```bash
ng generate service services/meal
ng generate service services/calculator
```

### 2. Service Meal (src/app/services/meal.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Meal {
  id?: number;
  name: string;
  description: string;
  price: number;
  image: string;
  calories: number;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private apiUrl = 'http://localhost:8080/api/meals';

  constructor(private http: HttpClient) { }

  getAllMeals(): Observable<Meal[]> {
    return this.http.get<Meal[]>(this.apiUrl);
  }

  getMealsByCategory(category: string): Observable<Meal[]> {
    return this.http.get<Meal[]>(`${this.apiUrl}/category/${category}`);
  }

  getMealsByCalories(calories: number): Observable<Meal[]> {
    return this.http.get<Meal[]>(`${this.apiUrl}/calories/${calories}`);
  }

  createMeal(meal: Meal): Observable<Meal> {
    return this.http.post<Meal>(this.apiUrl, meal);
  }
}
```

### 3. Service Calculator (src/app/services/calculator.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CalorieCalculation {
  gender: string;
  age: number;
  height: number;
  weight: number;
  activityLevel: string;
  dailyCalories: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalculatorService {
  private apiUrl = 'http://localhost:8080/api/calculator';

  constructor(private http: HttpClient) { }

  calculateCalories(data: Partial<CalorieCalculation>): Observable<CalorieCalculation> {
    return this.http.post<CalorieCalculation>(`${this.apiUrl}/calculate`, data);
  }
}
```

### 4. Mettre à jour le composant Home

Modifiez `src/app/home/home.component.ts` :

```typescript
import { Component, OnInit } from '@angular/core';
import { MealService, Meal } from '../services/meal.service';
import { CalculatorService } from '../services/calculator.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  meals: Meal[] = [];
  selectedCategory: string = 'classic';
  selectedCalories: number = 1200;

  constructor(
    private mealService: MealService,
    private calculatorService: CalculatorService
  ) { }

  ngOnInit(): void {
    this.loadMeals();
  }

  loadMeals(): void {
    this.mealService.getMealsByCalories(this.selectedCalories)
      .subscribe(meals => {
        this.meals = meals;
      });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.mealService.getMealsByCategory(category)
      .subscribe(meals => {
        this.meals = meals;
      });
  }

  filterByCalories(calories: number): void {
    this.selectedCalories = calories;
    this.loadMeals();
  }

  calculateCalories(formData: any): void {
    this.calculatorService.calculateCalories(formData)
      .subscribe(result => {
        console.log('Calories calculées:', result.dailyCalories);
        // Afficher le résultat à l'utilisateur
      });
  }
}
```

## 🔧 Configuration CORS (Backend Spring Boot)

Dans votre backend Spring Boot, ajoutez la configuration CORS :

```java
@Configuration
public class CorsConfig {
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

## 📦 Contrôleurs Spring Boot suggérés

### MealController.java

```java
@RestController
@RequestMapping("/api/meals")
@CrossOrigin(origins = "http://localhost:4200")
public class MealController {
    
    @Autowired
    private MealService mealService;
    
    @GetMapping
    public List<Meal> getAllMeals() {
        return mealService.findAll();
    }
    
    @GetMapping("/category/{category}")
    public List<Meal> getMealsByCategory(@PathVariable String category) {
        return mealService.findByCategory(category);
    }
    
    @GetMapping("/calories/{calories}")
    public List<Meal> getMealsByCalories(@PathVariable int calories) {
        return mealService.findByCaloriesLessThan(calories);
    }
    
    @PostMapping
    public Meal createMeal(@RequestBody Meal meal) {
        return mealService.save(meal);
    }
}
```

### CalculatorController.java

```java
@RestController
@RequestMapping("/api/calculator")
@CrossOrigin(origins = "http://localhost:4200")
public class CalculatorController {
    
    @PostMapping("/calculate")
    public CalorieCalculation calculateCalories(@RequestBody CalorieRequest request) {
        // Formule de Harris-Benedict
        double bmr;
        if (request.getGender().equals("male")) {
            bmr = 88.362 + (13.397 * request.getWeight()) + 
                  (4.799 * request.getHeight()) - (5.677 * request.getAge());
        } else {
            bmr = 447.593 + (9.247 * request.getWeight()) + 
                  (3.098 * request.getHeight()) - (4.330 * request.getAge());
        }
        
        double activityMultiplier = getActivityMultiplier(request.getActivityLevel());
        double dailyCalories = bmr * activityMultiplier;
        
        return new CalorieCalculation(
            request.getGender(),
            request.getAge(),
            request.getHeight(),
            request.getWeight(),
            request.getActivityLevel(),
            (int) dailyCalories
        );
    }
    
    private double getActivityMultiplier(String level) {
        switch (level.toLowerCase()) {
            case "low": return 1.2;
            case "medium": return 1.55;
            case "high": return 1.9;
            default: return 1.2;
        }
    }
}
```

## 🗄️ Modèles de données (Entities)

### Meal.java

```java
@Entity
@Table(name = "meals")
public class Meal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    private double price;
    private String image;
    private int calories;
    private String category;
    
    // Getters et Setters
}
```

## 🔐 Sécurité et Authentification

Si vous utilisez JWT (déjà présent dans votre projet) :

```typescript
// Dans app.config.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // autres providers
  ]
};
```

## 📝 Variables d'environnement

Créez `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

Et `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-api.com/api'
};
```

Utilisez-le dans vos services :

```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}/meals`;
```

## 🚀 Déploiement

### Frontend (Angular)
```bash
ng build --configuration production
```

### Backend (Spring Boot)
```bash
mvn clean package
java -jar target/app.jar
```

## 📚 Ressources

- [Angular HttpClient](https://angular.dev/guide/http)
- [Spring Boot REST API](https://spring.io/guides/gs/rest-service/)
- [CORS Configuration](https://spring.io/guides/gs/rest-service-cors/)
