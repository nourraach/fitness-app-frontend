# Requirements Document

## Introduction

Cette fonctionnalité permet aux utilisateurs de reconnaître des aliments en prenant ou en uploadant une photo. Le système analyse l'image via l'API backend, affiche les informations nutritionnelles (calories, protéines, lipides, glucides), et permet de confirmer ou choisir une alternative parmi les aliments détectés. Une option de saisie manuelle est disponible si l'aliment n'est pas reconnu.

## Glossary

- **Food_Recognition_Service**: Service Angular responsable de la communication avec l'API backend de reconnaissance d'aliments
- **Food_Scanner_Component**: Composant permettant la capture ou l'upload d'images d'aliments
- **Nutritional_Info**: Objet contenant les informations nutritionnelles d'un aliment (calories, protéines, lipides, glucides)
- **Recognition_Result**: Résultat de l'analyse d'image incluant l'aliment reconnu, le niveau de confiance et les alternatives
- **Manual_Entry**: Fonctionnalité permettant la saisie manuelle d'un aliment non reconnu

## Requirements

### Requirement 1: Upload et capture de photo d'aliment

**User Story:** As a user, I want to take or upload a photo of food, so that I can identify the food and get its nutritional information.

#### Acceptance Criteria

1. WHEN a user clicks on the photo capture button, THE Food_Scanner_Component SHALL open the device camera or file picker
2. WHEN a user selects an image file, THE Food_Scanner_Component SHALL accept image formats (JPEG, PNG, WebP)
3. WHEN an image is selected, THE Food_Scanner_Component SHALL display a preview of the selected image
4. WHEN an image exceeds 10MB, THE Food_Scanner_Component SHALL display an error message and prevent upload
5. IF no image is selected, THEN THE Food_Scanner_Component SHALL disable the analyze button

### Requirement 2: Analyse et reconnaissance d'aliment

**User Story:** As a user, I want the system to analyze my food photo, so that I can automatically identify what food it is.

#### Acceptance Criteria

1. WHEN a user submits an image for analysis, THE Food_Recognition_Service SHALL send the image to the backend API endpoint POST /api/food-recognition/recognize
2. WHILE the image is being analyzed, THE Food_Scanner_Component SHALL display a loading indicator
3. WHEN the backend returns a successful recognition result, THE Food_Scanner_Component SHALL display the recognized food name
4. WHEN the backend returns a confidence score, THE Food_Scanner_Component SHALL display the confidence percentage
5. IF the backend returns recognized=false, THEN THE Food_Scanner_Component SHALL display a message indicating the food was not recognized and offer manual entry

### Requirement 3: Affichage des informations nutritionnelles

**User Story:** As a user, I want to see the nutritional information of the recognized food, so that I can track my calorie and nutrient intake.

#### Acceptance Criteria

1. WHEN a food is successfully recognized, THE Food_Scanner_Component SHALL display calories in kcal
2. WHEN a food is successfully recognized, THE Food_Scanner_Component SHALL display protein content in grams
3. WHEN a food is successfully recognized, THE Food_Scanner_Component SHALL display fat (lipides) content in grams
4. WHEN a food is successfully recognized, THE Food_Scanner_Component SHALL display carbohydrate (glucides) content in grams
5. WHEN a food is successfully recognized, THE Food_Scanner_Component SHALL display the food category

### Requirement 4: Gestion des alternatives

**User Story:** As a user, I want to see alternative food suggestions, so that I can select the correct food if the primary recognition is wrong.

#### Acceptance Criteria

1. WHEN the recognition result includes alternatives, THE Food_Scanner_Component SHALL display a list of alternative food names
2. WHEN a user clicks on an alternative food, THE Food_Recognition_Service SHALL fetch nutritional info for that alternative
3. WHEN an alternative is selected, THE Food_Scanner_Component SHALL update the displayed nutritional information
4. WHEN no alternatives are available, THE Food_Scanner_Component SHALL hide the alternatives section

### Requirement 5: Saisie manuelle d'aliment

**User Story:** As a user, I want to manually enter a food name, so that I can get nutritional information when automatic recognition fails.

#### Acceptance Criteria

1. WHEN a user clicks on the manual entry button, THE Food_Scanner_Component SHALL display a text input field
2. WHEN a user types in the manual entry field, THE Food_Recognition_Service SHALL search for matching foods via GET /api/food-recognition/suggestions
3. WHEN search results are returned, THE Food_Scanner_Component SHALL display a dropdown list of matching foods
4. WHEN a user selects a food from the dropdown, THE Food_Recognition_Service SHALL fetch nutritional info via POST /api/food-recognition/manual
5. IF no matching foods are found, THEN THE Food_Scanner_Component SHALL display a "no results" message

### Requirement 6: Confirmation et ajout au suivi

**User Story:** As a user, I want to confirm the recognized food and add it to my daily tracking, so that I can monitor my nutrition intake.

#### Acceptance Criteria

1. WHEN nutritional information is displayed, THE Food_Scanner_Component SHALL show a confirm button
2. WHEN a user adjusts the quantity, THE Food_Scanner_Component SHALL recalculate nutritional values proportionally
3. WHEN a user confirms the food, THE Food_Scanner_Component SHALL emit an event with the food data for tracking integration
4. WHEN confirmation is successful, THE Food_Scanner_Component SHALL display a success message and reset the form

### Requirement 7: Gestion des erreurs

**User Story:** As a user, I want to see clear error messages, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. IF the backend API is unreachable, THEN THE Food_Scanner_Component SHALL display a connection error message
2. IF the image upload fails, THEN THE Food_Scanner_Component SHALL display an upload error message with retry option
3. IF the recognition request times out, THEN THE Food_Scanner_Component SHALL display a timeout message
4. WHEN an error occurs, THE Food_Scanner_Component SHALL provide a retry button to attempt the operation again
