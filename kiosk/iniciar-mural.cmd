@echo off
rem Substitui o .bat antigo do mural.
rem Edite apenas a URL e, se quiser, a pasta do perfil do Chrome.
set "URL=https://SEU-SITE.com"
set "PERFIL=C:\ChromeMural"

:inicio
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0iniciar-mural.ps1" -Url "%URL%" -Perfil "%PERFIL%"

rem 0  = o Chrome fechou sozinho (queda): espera 3s e reabre.
rem 10 = toque duplo no mural: encerra de verdade e nao reabre.
rem 1  = erro ao iniciar: encerra para nao ficar em loop.
if %ERRORLEVEL%==0 (
  timeout /t 3 /nobreak >nul
  goto inicio
)

echo Mural encerrado.
