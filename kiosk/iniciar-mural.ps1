<#
  INICIA O MURAL EM MODO KIOSK E PERMITE FECHÁ-LO PELO TOQUE DUPLO

  O que este script faz:
    1. Abre o Google Chrome em modo --kiosk apontando para a URL do mural,
       com um perfil próprio (não interfere no Chrome normal do usuário).
    2. Fica observando o título da janela do Chrome. Quando o mural recebe um
       toque duplo, a página troca o título para "FECHAR_MURAL" (ver
       interacao.tituloFechamento em config.js). Ao detectar isso, o script
       fecha o Chrome de forma suave e, se necessário, força o encerramento.

  Códigos de saída (usados pelo iniciar-mural.cmd para decidir se reabre):
    0  = o Chrome fechou sozinho (queda ou fechamento manual) -> o .cmd reabre
    10 = fechamento pedido pelo toque duplo no mural -> o .cmd encerra o loop
    1  = erro ao iniciar (Chrome não encontrado, por exemplo)

  Como usar:
    - Edite a URL em iniciar-mural.cmd e dê dois cliques nele; ou
    - powershell -ExecutionPolicy Bypass -File iniciar-mural.ps1 -Url "https://seu-site.com" -Perfil "C:\ChromeMural"

  Para abrir junto com o Windows:
    Win+R -> shell:startup -> crie um atalho para iniciar-mural.cmd nessa pasta.
#>
param(
  [string]$Url = "http://localhost/",
  [string]$Perfil = "C:\ChromeMural",
  [string]$TituloFechamento = "FECHAR_MURAL",
  [string]$Chrome = "",
  [int]$IntervaloMs = 500,
  [int]$EsperaFechamentoMs = 5000
)

if (-not $Chrome) {
  $candidatos = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
  )
  $Chrome = $candidatos | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $Chrome -or -not (Test-Path $Chrome)) {
  Write-Error "chrome.exe não encontrado. Informe o caminho com -Chrome 'C:\...\chrome.exe'."
  exit 1
}

$argumentos = @(
  "--kiosk",
  "--no-first-run",
  "--no-default-browser-check",
  "--noerrdialogs",
  "--disable-infobars",
  "--disable-session-crashed-bubble",
  "--hide-crash-restore-bubble",
  "--disable-pinch",
  "--overscroll-history-navigation=0",
  "--disable-features=TranslateUI",
  "--user-data-dir=`"$Perfil`"",
  "`"$Url`""
)

$processo = Start-Process -FilePath $Chrome -ArgumentList $argumentos -PassThru
if (-not $processo) {
  Write-Error "Não foi possível iniciar o Chrome."
  exit 1
}

Write-Host "Mural iniciado (PID $($processo.Id)) em $Url"
Write-Host "Aguardando pedido de fechamento (título contendo '$TituloFechamento')..."

# 0 = Chrome fechou sozinho; 10 = fechamento pedido pelo toque duplo.
$codigoSaida = 0

while ($true) {
  Start-Sleep -Milliseconds $IntervaloMs

  # Busca o processo novamente para ler o título atualizado da janela.
  $atual = Get-Process -Id $processo.Id -ErrorAction SilentlyContinue
  if (-not $atual) {
    Write-Host "Chrome foi fechado."
    break
  }

  if ($atual.MainWindowTitle -like "*$TituloFechamento*") {
    Write-Host "Pedido de fechamento recebido. Fechando o Chrome..."
    $null = $atual.CloseMainWindow()
    if (-not $atual.WaitForExit($EsperaFechamentoMs)) {
      Write-Host "Chrome não respondeu; forçando encerramento."
      Stop-Process -Id $atual.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Mural encerrado pelo toque duplo."
    $codigoSaida = 10
    break
  }
}

exit $codigoSaida
