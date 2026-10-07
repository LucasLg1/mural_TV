@echo off
rem Edite apenas a URL e, se quiser, a pasta do perfil do Chrome.
rem Reabrir depois de uma queda e fechar pelo toque duplo ficam no iniciar-mural.ps1.
set "URL=https://SEU-SITE.com/#/"
set "PERFIL=C:\ChromeMural"

powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0iniciar-mural.ps1" -Url "%URL%" -Perfil "%PERFIL%"
