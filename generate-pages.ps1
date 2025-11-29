# Script PowerShell pour générer toutes les pages nécessaires
# Exécutez ce script pour créer automatiquement tous les composants

Write-Host "🚀 Génération des pages pour Health & Fitness..." -ForegroundColor Green
Write-Host ""

# Liste des pages à créer
$pages = @(
    "programmes",
    "nutrition",
    "blog",
    "dashboard",
    "contact",
    "profile"
)

# Créer le dossier pages s'il n'existe pas
$pagesPath = "src/app/pages"
if (-not (Test-Path $pagesPath)) {
    New-Item -ItemType Directory -Path $pagesPath
    Write-Host "✓ Dossier 'pages' créé" -ForegroundColor Green
}

# Générer chaque composant
foreach ($page in $pages) {
    Write-Host "Génération de la page '$page'..." -ForegroundColor Cyan
    
    try {
        ng generate component "pages/$page" --skip-tests
        Write-Host "✓ Page '$page' créée avec succès" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Erreur lors de la création de '$page'" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "✅ Génération terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "1. Configurez les routes dans src/app/app.routes.ts" -ForegroundColor White
Write-Host "2. Ajoutez le contenu de chaque page" -ForegroundColor White
Write-Host "3. Testez la navigation" -ForegroundColor White
Write-Host ""
Write-Host "💡 Consultez MISE-A-JOUR.md pour plus de détails" -ForegroundColor Cyan
