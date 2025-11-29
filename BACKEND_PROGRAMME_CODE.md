# Code Backend Spring Boot - Entité Programme

## 1. Entité Programme.java
**Chemin:** `src/main/java/com/fitness/model/Programme.java`

```java
package com.fitness.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "programmes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Programme {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String titre;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Niveau niveau;
    
    @Column(nullable = false)
    private Integer dureeSemaines;
    
    @Column(nullable = false)
    private String objectif;
    
    private String imageUrl;
    
    public enum Niveau {
        DEBUTANT,
        INTERMEDIAIRE,
        AVANCE
    }
}
```

## 2. Repository ProgrammeRepository.java
**Chemin:** `src/main/java/com/fitness/repository/ProgrammeRepository.java`

```java
package com.fitness.repository;

import com.fitness.model.Programme;
import com.fitness.model.Programme.Niveau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgrammeRepository extends JpaRepository<Programme, Long> {
    
    List<Programme> findByNiveau(Niveau niveau);
    
    List<Programme> findByObjectif(String objectif);
    
    List<Programme> findByNiveauAndObjectif(Niveau niveau, String objectif);
}
```

## 3. Service ProgrammeService.java
**Chemin:** `src/main/java/com/fitness/service/ProgrammeService.java`

```java
package com.fitness.service;

import com.fitness.model.Programme;
import com.fitness.model.Programme.Niveau;
import com.fitness.repository.ProgrammeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProgrammeService {
    
    @Autowired
    private ProgrammeRepository programmeRepository;
    
    public List<Programme> getAllProgrammes() {
        return programmeRepository.findAll();
    }
    
    public Optional<Programme> getProgrammeById(Long id) {
        return programmeRepository.findById(id);
    }
    
    public Programme createProgramme(Programme programme) {
        return programmeRepository.save(programme);
    }
    
    public Programme updateProgramme(Long id, Programme programmeDetails) {
        Programme programme = programmeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Programme non trouvé avec l'id: " + id));
        
        programme.setTitre(programmeDetails.getTitre());
        programme.setDescription(programmeDetails.getDescription());
        programme.setNiveau(programmeDetails.getNiveau());
        programme.setDureeSemaines(programmeDetails.getDureeSemaines());
        programme.setObjectif(programmeDetails.getObjectif());
        programme.setImageUrl(programmeDetails.getImageUrl());
        
        return programmeRepository.save(programme);
    }
    
    public void deleteProgramme(Long id) {
        programmeRepository.deleteById(id);
    }
    
    public List<Programme> getProgrammesByNiveau(Niveau niveau) {
        return programmeRepository.findByNiveau(niveau);
    }
    
    public List<Programme> getProgrammesByObjectif(String objectif) {
        return programmeRepository.findByObjectif(objectif);
    }
}
```

## 4. Controller ProgrammeController.java
**Chemin:** `src/main/java/com/fitness/controller/ProgrammeController.java`

```java
package com.fitness.controller;

import com.fitness.model.Programme;
import com.fitness.model.Programme.Niveau;
import com.fitness.service.ProgrammeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programmes")
@CrossOrigin(origins = "http://localhost:4200")
public class ProgrammeController {
    
    @Autowired
    private ProgrammeService programmeService;
    
    @GetMapping
    public ResponseEntity<List<Programme>> getAllProgrammes() {
        return ResponseEntity.ok(programmeService.getAllProgrammes());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Programme> getProgrammeById(@PathVariable Long id) {
        return programmeService.getProgrammeById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Programme> createProgramme(@RequestBody Programme programme) {
        Programme created = programmeService.createProgramme(programme);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Programme> updateProgramme(
            @PathVariable Long id, 
            @RequestBody Programme programme) {
        try {
            Programme updated = programmeService.updateProgramme(id, programme);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgramme(@PathVariable Long id) {
        programmeService.deleteProgramme(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/niveau/{niveau}")
    public ResponseEntity<List<Programme>> getProgrammesByNiveau(@PathVariable String niveau) {
        try {
            Niveau niveauEnum = Niveau.valueOf(niveau.toUpperCase());
            return ResponseEntity.ok(programmeService.getProgrammesByNiveau(niveauEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/objectif/{objectif}")
    public ResponseEntity<List<Programme>> getProgrammesByObjectif(@PathVariable String objectif) {
        return ResponseEntity.ok(programmeService.getProgrammesByObjectif(objectif));
    }
}
```

## 5. Données de test (optionnel)
**Créer un fichier:** `src/main/resources/data.sql`

```sql
INSERT INTO programmes (titre, description, niveau, duree_semaines, objectif, image_url) VALUES
('Programme Perte de Poids', 'Programme intensif pour perdre du poids efficacement', 'DEBUTANT', 8, 'perte de poids', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b'),
('Tonification Complète', 'Sculptez votre corps avec ce programme complet', 'INTERMEDIAIRE', 12, 'tonification', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48'),
('Prise de Masse', 'Développez votre masse musculaire', 'AVANCE', 16, 'prise de masse', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e');
```

## Instructions d'installation:

1. Copiez chaque fichier dans le bon dossier de votre projet Spring Boot
2. Assurez-vous que votre `application.properties` contient:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/fitness_db
spring.datasource.username=root
spring.datasource.password=votre_mot_de_passe
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

3. Redémarrez votre application Spring Boot
4. Testez avec Postman ou directement depuis Angular
