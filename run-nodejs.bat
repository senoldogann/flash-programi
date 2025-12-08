@echo off
REM Flash Nick Pro - Windows Başlatıcı (Node.js)
REM Bu dosya programı Node.js ile açar

cls
echo.
echo ========================================
echo  Flash Nick Pro v2.0
echo  Sesli Chat Nick Yapma Programı
echo ========================================
echo.

REM Node.js'i kontrol et
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js bulunamadı!
    echo.
    echo Node.js'i yüklemek için: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM http-server'ı kontrol et ve yükle
npx http-server --version >nul 2>&1
if errorlevel 1 (
    echo ⏳ İlk kez çalıştırıldığından http-server yükleniyor...
    echo.
)

echo ⏳ Program başlatılıyor...
echo.
echo Tarayıcınız kısa süre içinde açılacak...
echo.
echo Port: 8080
echo URL: http://localhost:8080
echo.
echo Programı durdurmak için Ctrl+C tuşlarına basın
echo ========================================
echo.

timeout /t 2 /nobreak

REM Tarayıcıyı aç
start http://localhost:8080

REM Sunucuyu başlat
npx http-server -p 8080
