@echo off
echo ========================================
echo Clearing Laravel Caches...
echo ========================================
echo.

echo [1/6] Clearing application cache...
php artisan cache:clear
echo.

echo [2/6] Clearing config cache...
php artisan config:clear
echo.

echo [3/6] Clearing route cache...
php artisan route:clear
echo.

echo [4/6] Clearing view cache...
php artisan view:clear
echo.

echo [5/6] Clearing permission cache...
php artisan permission:cache-reset
echo.

echo [6/6] Running optimize:clear...
php artisan optimize:clear
echo.

echo ========================================
echo All caches cleared successfully!
echo ========================================
pause
