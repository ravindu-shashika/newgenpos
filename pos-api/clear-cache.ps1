# Laravel Cache Clearing Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clearing Laravel Caches..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Clearing application cache..." -ForegroundColor Yellow
php artisan cache:clear
Write-Host ""

Write-Host "[2/6] Clearing config cache..." -ForegroundColor Yellow
php artisan config:clear
Write-Host ""

Write-Host "[3/6] Clearing route cache..." -ForegroundColor Yellow
php artisan route:clear
Write-Host ""

Write-Host "[4/6] Clearing view cache..." -ForegroundColor Yellow
php artisan view:clear
Write-Host ""

Write-Host "[5/6] Clearing permission cache..." -ForegroundColor Yellow
php artisan permission:cache-reset
Write-Host ""

Write-Host "[6/6] Running optimize:clear..." -ForegroundColor Yellow
php artisan optimize:clear
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "All caches cleared successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
