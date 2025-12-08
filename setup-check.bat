@echo off
REM Flash Nick Pro - Kurulum Yardımcısı

cls
echo.
echo ========================================
echo  Flash Nick Pro v2.0 - Kurulum Yardımcısı
echo ========================================
echo.
echo Bu program sizin sistem gereksinimlerinizi kontrol eder.
echo.

REM Python kontrolü
echo [1/2] Python denetleniyor...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python BULUNAMADI
    echo.
    echo Python'ı yüklemek için şu adrese gidin:
    echo https://www.python.org/downloads/
    echo.
    echo Python'u yüklediğinizde "Add Python to PATH" seçeneğini işaretleyin!
    echo.
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo ✅ !PYTHON_VERSION! bulundu
)

echo.

REM Node.js kontrolü
echo [2/2] Node.js denetleniyor...
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Node.js BULUNAMADI (opsiyonel)
    echo.
    echo Node.js'i yüklemek için şu adrese gidin:
    echo https://nodejs.org/
    echo.
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js !NODE_VERSION! bulundu
)

echo.
echo ========================================
echo.

REM Python varsa run.bat'ı, yoksa run-nodejs.bat'ı öner
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python yoksa Node.js yükleyip run-nodejs.bat kullanabilirsiniz!
    echo.
    echo İkisi de yoksa şu adreslerden indirin:
    echo - Python: https://www.python.org/
    echo - Node.js: https://nodejs.org/
) else (
    echo ✅ run.bat dosyasını çift tıklayarak programı açabilirsiniz!
)

echo.
pause
