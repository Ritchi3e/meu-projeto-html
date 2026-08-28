@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Iniciando a Biblioteca de Estudos...
echo.

where py >nul 2>nul
if %errorlevel%==0 (
    py servidor.py
    goto fim
)

where python >nul 2>nul
if %errorlevel%==0 (
    python servidor.py
    goto fim
)

echo ERRO: nao encontrei o Python nesta maquina.
echo.
echo Instale o Python em https://www.python.org/downloads/
echo Na instalacao, marque a caixa "Add Python to PATH".
echo.
pause

:fim
