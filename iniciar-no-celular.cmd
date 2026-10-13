@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Orbita - Acesso pelo celular
where node >nul 2>nul
if errorlevel 1 (
  echo O Node.js nao foi encontrado neste computador.
  echo Instale o Node.js e tente novamente.
  pause
  exit /b 1
)
node server.js
echo.
echo O servidor foi encerrado.
pause
