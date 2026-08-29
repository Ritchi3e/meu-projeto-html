@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ==========================================================
rem  BIBLIOTECA DE ESTUDOS
rem  Cola de comandos - nada aqui e executado, e so anotacao.
rem ==========================================================
rem
rem  INICIAR
rem      Duplo clique neste arquivo
rem      ou, no terminal do VS Code:
rem          py servidor.py
rem
rem  ABRIR NO NAVEGADOR (nao e comando, e endereco)
rem          http://localhost:8000/
rem
rem  PARAR
rem          Ctrl+C   (com o terminal selecionado)
rem      ou feche esta janela
rem
rem  PARAR UM SERVIDOR TRAVADO
rem      Quando a janela foi fechada mas a porta continua ocupada:
rem          netstat -ano ^| findstr :8000
rem      Pegue o numero da ultima coluna e use:
rem          taskkill /F /PID 1234
rem
rem ==========================================================

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
