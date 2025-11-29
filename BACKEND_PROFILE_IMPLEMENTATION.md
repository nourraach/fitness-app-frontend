# Backend Spring Boot - Implémentation du Profil Utilisateur

## Structure à créer

### 1. Entity - UserProfile.java
```java
package com.healthfit.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_profiles")
@Data
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;
    
    @Column(nullable = false)
    private Integer age;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sexe sexe;
    
    @Column(nullable = false)
    private Double taille; // en cm
    
    @Column(nullable = false)
    private Double poids; // en kg
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Objectif objectif;
    
    @Enumerated(EnumType.STRING)
    private NiveauActivite niveauActivite;
    
    private Double imc;
    
    private Double besoinsCaloriques;
    
    public enum Sexe {
        HOMME, FEMME, AUTRE
    }
    
    public enum Objectif {
        PERTE_POIDS, PRISE_MASSE, MAINTIEN, REMISE_EN_FORME
    }
    
    public enum NiveauActivite {
        SEDENTAIRE,      // 1.2
        LEGER,           // 1.375
        MODERE,          // 1.55
        INTENSE,         // 1.725
        TRES_INTENSE     // 1.9
    }
}
```

### 2. Repository - UserProfileRepository.java
```java
package com.healthfit.repository;

import com.healthfit.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
```

### 3. DTO - UserProfileDTO.java
```java
package com.healthfit.dto;

import com.healthfit.entity.UserProfile;
import lombok.Data;

@Data
public class UserProfileDTO {
    private Long id;
    private Long userId;
    private Integer age;
    private UserProfile.Sexe sexe;
    private Double taille;
    private Double poids;
    private UserProfile.Objectif objectif;
    private UserProfile.NiveauActivite niveauActivite;
    private Double imc;
    private Double besoinsCaloriques;
}
```

### 4. DTO - ImcResultDTO.java
```java
package com.healthfit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImcResultDTO {
    private Double imc;
    private String categorie;
    private String interpretation;
}
```

### 5. DTO - BesoinsCaloriquesResultDTO.java
```java
package com.healthfit.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BesoinsCaloriquesResultDTO {
    private Double besoinsCaloriques;
    private Double metabolismeBase;
    private String details;
}
```

### 6. Service - ProfileService.java
```java
package com.healthfit.service;

import com.healthfit.dto.BesoinsCaloriquesResultDTO;
import com.healthfit.dto.ImcResultDTO;
import com.healthfit.dto.UserProfileDTO;
import com.healthfit.entity.User;
import com.healthfit.entity.UserProfile;
import com.healthfit.repository.UserProfileRepository;
import com.healthfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {
    
    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;
    
    public UserProfileDTO getProfileByUserId(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profil non trouvé"));
        return convertToDTO(profile);
    }
    
    @Transactional
    public UserProfileDTO createProfile(Long userId, UserProfileDTO dto) {
        if (profileRepository.existsByUserId(userId)) {
            throw new RuntimeException("Un profil existe déjà pour cet utilisateur");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        updateProfileFromDTO(profile, dto);
        
        // Calculer IMC et besoins caloriques
        profile.setImc(calculateImc(dto.getTaille(), dto.getPoids()));
        profile.setBesoinsCaloriques(calculateBesoinsCaloriques(profile));
        
        UserProfile saved = profileRepository.save(profile);
        return convertToDTO(saved);
    }
    
    @Transactional
    public UserProfileDTO updateProfile(Long userId, UserProfileDTO dto) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profil non trouvé"));
        
        updateProfileFromDTO(profile, dto);
        
        // Recalculer IMC et besoins caloriques
        profile.setImc(calculateImc(dto.getTaille(), dto.getPoids()));
        profile.setBesoinsCaloriques(calculateBesoinsCaloriques(profile));
        
        UserProfile saved = profileRepository.save(profile);
        return convertToDTO(saved);
    }
    
    public ImcResultDTO calculateImcWithDetails(Double taille, Double poids) {
        double imc = calculateImc(taille, poids);
        String categorie = getImcCategorie(imc);
        String interpretation = getImcInterpretation(imc);
        return new ImcResultDTO(imc, categorie, interpretation);
    }
    
    public BesoinsCaloriquesResultDTO calculateBesoinsCaloriquesWithDetails(UserProfileDTO dto) {
        UserProfile profile = new UserProfile();
        profile.setAge(dto.getAge());
        profile.setSexe(dto.getSexe());
        profile.setTaille(dto.getTaille());
        profile.setPoids(dto.getPoids());
        profile.setNiveauActivite(dto.getNiveauActivite());
        
        double metabolismeBase = calculateMetabolismeBase(profile);
        double besoinsCaloriques = calculateBesoinsCaloriques(profile);
        String details = getBesoinsCaloriquesDetails(profile, metabolismeBase);
        
        return new BesoinsCaloriquesResultDTO(besoinsCaloriques, metabolismeBase, details);
    }
    
    // Calcul IMC: poids / (taille en m)²
    private Double calculateImc(Double taille, Double poids) {
        double tailleEnMetres = taille / 100.0;
        return poids / (tailleEnMetres * tailleEnMetres);
    }
    
    // Calcul du métabolisme de base (formule de Harris-Benedict)
    private Double calculateMetabolismeBase(UserProfile profile) {
        if (profile.getSexe() == UserProfile.Sexe.HOMME) {
            return 88.362 + (13.397 * profile.getPoids()) + 
                   (4.799 * profile.getTaille()) - (5.677 * profile.getAge());
        } else {
            return 447.593 + (9.247 * profile.getPoids()) + 
                   (3.098 * profile.getTaille()) - (4.330 * profile.getAge());
        }
    }
    
    // Calcul des besoins caloriques avec niveau d'activité
    private Double calculateBesoinsCaloriques(UserProfile profile) {
        double metabolismeBase = calculateMetabolismeBase(profile);
        double facteurActivite = getFacteurActivite(profile.getNiveauActivite());
        return metabolismeBase * facteurActivite;
    }
    
    private double getFacteurActivite(UserProfile.NiveauActivite niveau) {
        return switch (niveau) {
            case SEDENTAIRE -> 1.2;
            case LEGER -> 1.375;
            case MODERE -> 1.55;
            case INTENSE -> 1.725;
            case TRES_INTENSE -> 1.9;
        };
    }
    
    private String getImcCategorie(double imc) {
        if (imc < 18.5) return "Insuffisance pondérale";
        if (imc < 25) return "Poids normal";
        if (imc < 30) return "Surpoids";
        return "Obésité";
    }
    
    private String getImcInterpretation(double imc) {
        if (imc < 18.5) return "Vous êtes en sous-poids";
        if (imc < 25) return "Votre poids est idéal";
        if (imc < 30) return "Vous êtes en surpoids";
        return "Vous êtes en situation d'obésité";
    }
    
    private String getBesoinsCaloriquesDetails(UserProfile profile, double metabolismeBase) {
        return String.format("Basé sur votre profil (%s, %d ans, niveau d'activité %s), " +
            "votre métabolisme de base est de %.0f kcal/jour.",
            profile.getSexe(), profile.getAge(), 
            profile.getNiveauActivite(), metabolismeBase);
    }
    
    private void updateProfileFromDTO(UserProfile profile, UserProfileDTO dto) {
        profile.setAge(dto.getAge());
        profile.setSexe(dto.getSexe());
        profile.setTaille(dto.getTaille());
        profile.setPoids(dto.getPoids());
        profile.setObjectif(dto.getObjectif());
        profile.setNiveauActivite(dto.getNiveauActivite());
    }
    
    private UserProfileDTO convertToDTO(UserProfile profile) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setAge(profile.getAge());
        dto.setSexe(profile.getSexe());
        dto.setTaille(profile.getTaille());
        dto.setPoids(profile.getPoids());
        dto.setObjectif(profile.getObjectif());
        dto.setNiveauActivite(profile.getNiveauActivite());
        dto.setImc(profile.getImc());
        dto.setBesoinsCaloriques(profile.getBesoinsCaloriques());
        return dto;
    }
}
```

### 7. Controller - ProfileController.java
```java
package com.healthfit.controller;

import com.healthfit.dto.BesoinsCaloriquesResultDTO;
import com.healthfit.dto.ImcResultDTO;
import com.healthfit.dto.UserProfileDTO;
import com.healthfit.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ProfileController {
    
    private final ProfileService profileService;
    
    @GetMapping
    public ResponseEntity<UserProfileDTO> getProfile(Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        UserProfileDTO profile = profileService.getProfileByUserId(userId);
        return ResponseEntity.ok(profile);
    }
    
    @PostMapping
    public ResponseEntity<UserProfileDTO> createProfile(
            @RequestBody UserProfileDTO dto,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        UserProfileDTO created = profileService.createProfile(userId, dto);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping
    public ResponseEntity<UserProfileDTO> updateProfile(
            @RequestBody UserProfileDTO dto,
            Authentication authentication) {
        Long userId = getUserIdFromAuth(authentication);
        UserProfileDTO updated = profileService.updateProfile(userId, dto);
        return ResponseEntity.ok(updated);
    }
    
    @GetMapping("/imc")
    public ResponseEntity<ImcResultDTO> calculateImc(
            @RequestParam Double taille,
            @RequestParam Double poids) {
        ImcResultDTO result = profileService.calculateImcWithDetails(taille, poids);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/besoins-caloriques")
    public ResponseEntity<BesoinsCaloriquesResultDTO> calculateBesoinsCaloriques(
            @RequestBody UserProfileDTO dto) {
        BesoinsCaloriquesResultDTO result = 
            profileService.calculateBesoinsCaloriquesWithDetails(dto);
        return ResponseEntity.ok(result);
    }
    
    private Long getUserIdFromAuth(Authentication authentication) {
        // Adapter selon votre implémentation JWT
        // Exemple: return ((UserDetails) authentication.getPrincipal()).getId();
        return 1L; // À remplacer
    }
}
```

### 8. Script SQL - Migration
```sql
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    age INTEGER NOT NULL,
    sexe VARCHAR(10) NOT NULL CHECK (sexe IN ('HOMME', 'FEMME', 'AUTRE')),
    taille DOUBLE PRECISION NOT NULL,
    poids DOUBLE PRECISION NOT NULL,
    objectif VARCHAR(20) NOT NULL CHECK (objectif IN ('PERTE_POIDS', 'PRISE_MASSE', 'MAINTIEN', 'REMISE_EN_FORME')),
    niveau_activite VARCHAR(20) CHECK (niveau_activite IN ('SEDENTAIRE', 'LEGER', 'MODERE', 'INTENSE', 'TRES_INTENSE')),
    imc DOUBLE PRECISION,
    besoins_caloriques DOUBLE PRECISION,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

## Dépendances Maven (pom.xml)
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

## Configuration application.properties
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/healthfit
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```
