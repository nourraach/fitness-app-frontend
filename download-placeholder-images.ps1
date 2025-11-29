# Script PowerShell pour télécharger des images placeholder
# Exécutez ce script pour obtenir des images temporaires

$imagesPath = "src/assets/images"

# Créer le dossier s'il n'existe pas
if (-not (Test-Path $imagesPath)) {
    New-Item -ItemType Directory -Path $imagesPath
}

Write-Host "Téléchargement des images placeholder..." -ForegroundColor Green

# Fonction pour télécharger une image
function Download-Image {
    param (
        [string]$url,
        [string]$filename
    )
    
    $outputPath = Join-Path $imagesPath $filename
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath
        Write-Host "✓ $filename téléchargé" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Erreur lors du téléchargement de $filename" -ForegroundColor Red
    }
}

# Télécharger les images depuis Unsplash
Download-Image "https://source.unsplash.com/500x500/?healthy-food,bowl" "hero-bowl.jpg"
Download-Image "https://source.unsplash.com/120x120/?clock,time" "clock.jpg"
Download-Image "https://source.unsplash.com/120x120/?avocado" "avocado.jpg"
Download-Image "https://source.unsplash.com/120x120/?dumbbells,fitness" "dumbbells.jpg"
Download-Image "https://source.unsplash.com/120x120/?measuring-tape,fitness" "measuring-tape.jpg"
Download-Image "https://source.unsplash.com/120x120/?fitness-ball,exercise" "ball.jpg"
Download-Image "https://source.unsplash.com/300x200/?quinoa,bowl,healthy" "meal1.jpg"
Download-Image "https://source.unsplash.com/300x200/?pasta,tomato,italian" "meal2.jpg"
Download-Image "https://source.unsplash.com/300x200/?salad,chicken,healthy" "meal3.jpg"
Download-Image "https://source.unsplash.com/300x200/?dessert,berries,healthy" "meal4.jpg"
Download-Image "https://source.unsplash.com/600x400/?vegetables,fresh,organic" "vegetables.jpg"
Download-Image "https://source.unsplash.com/400x250/?person,happy,customer-service" "contact.jpg"

Write-Host "`nTerminé ! Les images ont été téléchargées dans $imagesPath" -ForegroundColor Cyan
Write-Host "Vous pouvez maintenant remplacer ces images par vos propres photos." -ForegroundColor Yellow
