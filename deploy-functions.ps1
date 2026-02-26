# deploy-functions.ps1
# Usage: .\deploy-functions.ps1
# Deploy toutes les Edge Functions vers Supabase sans Docker

$PROJECT_REF = "ibwoxcdvzucgbtypyoxc"
$TOKEN = "sbp_8e9e106b59196de041fab94578841cc21d8236d5"
$env:SUPABASE_ACCESS_TOKEN = $TOKEN

$functions = @("retreive_resumes_bulk", "parse_resumes", "scan_resumes")
$success = 0

Write-Host "`n🚀 Déploiement des Edge Functions Supabase" -ForegroundColor Cyan
Write-Host "Projet: $PROJECT_REF`n" -ForegroundColor Gray

foreach ($fn in $functions) {
    Write-Host "  ⬆  $fn..." -NoNewline
    $output = supabase functions deploy $fn --project-ref $PROJECT_REF 2>&1
    if ($output -match "Deployed Functions") {
        Write-Host " ✅" -ForegroundColor Green
        $success++
    } else {
        Write-Host " ❌" -ForegroundColor Red
        Write-Host $output -ForegroundColor DarkRed
    }
}

Write-Host "`n✅ $success/$($functions.Count) fonctions déployées" -ForegroundColor Green
Write-Host "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/functions`n" -ForegroundColor Cyan
