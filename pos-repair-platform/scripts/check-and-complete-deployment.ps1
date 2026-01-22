# Check deployment status and complete Cloud SQL setup
$ErrorActionPreference = "Stop"

$PROJECT_ID = "repair-pos-485101"
$SQL_INSTANCE = "pos-repair-postgres"
$SQL_DATABASE = "pos_repair_platform"
$SQL_USER = "posrepair_user"
$DB_PASSWORD = "yDk428pJlBToNjZV"

Write-Host "=== Deployment Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check latest build
Write-Host "Latest Build:" -ForegroundColor Yellow
$build = gcloud builds list --project=$PROJECT_ID --limit=1 --format="value(id,status)" 2>&1
if ($build) {
    $buildId, $buildStatus = $build -split "`t"
    Write-Host "  ID: $buildId" -ForegroundColor White
    Write-Host "  Status: $buildStatus" -ForegroundColor $(if ($buildStatus -eq "SUCCESS") { "Green" } elseif ($buildStatus -eq "FAILURE") { "Red" } else { "Yellow" })
    
    if ($buildStatus -eq "SUCCESS") {
        Write-Host "`n✓ Build completed successfully!" -ForegroundColor Green
    } elseif ($buildStatus -eq "FAILURE") {
        Write-Host "`n✗ Build failed. Check logs:" -ForegroundColor Red
        Write-Host "  https://console.cloud.google.com/cloud-build/builds/$buildId?project=$PROJECT_ID" -ForegroundColor Cyan
    }
} else {
    Write-Host "  No builds found" -ForegroundColor Yellow
}

Write-Host ""

# Check Cloud SQL
Write-Host "Cloud SQL Status:" -ForegroundColor Yellow
$sqlState = gcloud sql instances describe $SQL_INSTANCE --project=$PROJECT_ID --format="value(state)" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  State: $sqlState" -ForegroundColor White
    
    if ($sqlState -eq "RUNNABLE") {
        Write-Host "`n✓ Cloud SQL is ready!" -ForegroundColor Green
        
        # Check if database exists
        $dbs = gcloud sql databases list --instance=$SQL_INSTANCE --project=$PROJECT_ID --format="value(name)" 2>&1
        if ($dbs -contains $SQL_DATABASE) {
            Write-Host "  Database exists: $SQL_DATABASE" -ForegroundColor Green
        } else {
            Write-Host "  Creating database..." -ForegroundColor Yellow
            gcloud sql databases create $SQL_DATABASE --instance=$SQL_INSTANCE --project=$PROJECT_ID
            Write-Host "  ✓ Database created" -ForegroundColor Green
        }
        
        # Check if user exists
        $users = gcloud sql users list --instance=$SQL_INSTANCE --project=$PROJECT_ID --format="value(name)" 2>&1
        if ($users -contains $SQL_USER) {
            Write-Host "  User exists: $SQL_USER" -ForegroundColor Green
        } else {
            Write-Host "  Creating user..." -ForegroundColor Yellow
            gcloud sql users create $SQL_USER --instance=$SQL_INSTANCE --password=$DB_PASSWORD --project=$PROJECT_ID
            Write-Host "  ✓ User created" -ForegroundColor Green
        }
        
        Write-Host "`n✓ Cloud SQL setup complete!" -ForegroundColor Green
    } else {
        Write-Host "  Cloud SQL is still creating (State: $sqlState)" -ForegroundColor Yellow
        Write-Host "  This typically takes 5-10 minutes" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Cloud SQL instance not found or still creating" -ForegroundColor Yellow
}

Write-Host ""

# Check Cloud Run services
Write-Host "Cloud Run Services:" -ForegroundColor Yellow
$services = gcloud run services list --project=$PROJECT_ID --region=us-central1 --format="value(metadata.name,status.url)" 2>&1
if ($services) {
    foreach ($service in $services) {
        $name, $url = $service -split "`t"
        Write-Host "  $name : $url" -ForegroundColor White
    }
} else {
    Write-Host "  No services deployed yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Monitor builds: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID" -ForegroundColor White
Write-Host "Cloud Run: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor White
Write-Host ""
