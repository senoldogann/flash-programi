@echo off
REM Flash Nick Pro - Windows Başlatıcı (Python)
REM Bu dosya programı Python web sunucusu ile açar

cls
echo.
echo ========================================
echo  Flash Nick Pro v2.0
echo  Sesli Chat Nick Yapma Programı
echo ========================================
echo.

REM Python'ı kontrol et
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python bulunamadı!
    echo.
    echo Python'ı yüklemek için: https://www.python.org/
    echo.
    pause
    exit /b 1
)

REM Programı başlat
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
python -m http.server 8080
