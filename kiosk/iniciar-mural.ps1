<#
  INICIA O MURAL EM MODO KIOSK E PERMITE FECHÁ-LO PELO TOQUE DUPLO

  O que este script faz:
    1. Abre o Google Chrome em modo --kiosk na URL do mural, com um perfil
       próprio (não interfere no Chrome normal do usuário).
    2. Observa as janelas do Chrome desse perfil. Quando o mural recebe um
       toque duplo, a página troca o título para "FECHAR_MURAL" (ver
       interacao.tituloFechamento em config.js). O script fecha o Chrome e termina.
    3. Se o Chrome fechar por qualquer outro motivo (queda, Alt+F4), reabre
       depois de alguns segundos.

  Só um mural roda por vez: abrir de novo (atalho da área de trabalho, por
  exemplo) com o mural já aberto não faz nada.

  Como usar:
    - Edite a URL em iniciar-mural.cmd e dê dois cliques nele; ou
    - powershell -ExecutionPolicy Bypass -File iniciar-mural.ps1 -Url "https://seu-site.com/#/" -Perfil "C:\ChromeMural"

  Para abrir junto com o Windows:
    Win+R -> shell:startup -> crie um atalho para iniciar-mural.cmd nessa pasta.
#>
param(
  [string]$Url = "http://localhost/",
  [string]$Perfil = "C:\ChromeMural",
  [string]$TituloFechamento = "FECHAR_MURAL",
  [string]$Chrome = "",
  [int]$IntervaloMs = 700,
  [int]$EsperaFechamentoMs = 5000,
  [int]$EsperaReabrirSeg = 3
)

$mutex = New-Object System.Threading.Mutex($false, "Global\MuralRoboflexKiosk")
if (-not $mutex.WaitOne(0)) {
  Write-Host "O mural já está aberto."
  exit 0
}

try {
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

  # O processo devolvido pelo Start-Process pode não ser o que fica com a janela,
  # então o Chrome do mural é identificado pela pasta do perfil.
  $perfilNaLinha = "*--user-data-dir=*" + $Perfil.TrimEnd('\') + "*"
  function Get-ChromeDoMural {
    Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -like $perfilNaLinha }
  }

  function Fechar-ChromeDoMural {
    $ids = @(Get-ChromeDoMural | ForEach-Object { [int]$_.ProcessId })
    foreach ($id in $ids) {
      $p = Get-Process -Id $id -ErrorAction SilentlyContinue
      if ($p -and $p.MainWindowHandle -ne 0) { $null = $p.CloseMainWindow() }
    }
    $limite = (Get-Date).AddMilliseconds($EsperaFechamentoMs)
    while ((Get-Date) -lt $limite -and @(Get-ChromeDoMural).Count) {
      Start-Sleep -Milliseconds 300
    }
    $restantes = @(Get-ChromeDoMural)
    if ($restantes.Count) {
      Write-Host "Chrome não respondeu; forçando encerramento."
      $restantes | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    }
  }

  while ($true) {
    if (-not @(Get-ChromeDoMural).Count) {
      Start-Process -FilePath $Chrome -ArgumentList $argumentos | Out-Null
      Write-Host "Mural iniciado em $Url"
      Start-Sleep -Seconds 2
    }

    $pedidoFechar = $false
    while ($true) {
      Start-Sleep -Milliseconds $IntervaloMs
      $ids = @(Get-ChromeDoMural | ForEach-Object { [int]$_.ProcessId })
      if (-not $ids.Count) { break }
      $titulo = Get-Process -Id $ids -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowTitle -like "*$TituloFechamento*" } |
        Select-Object -First 1
      if ($titulo) {
        $pedidoFechar = $true
        break
      }
    }

    if ($pedidoFechar) {
      Write-Host "Pedido de fechamento recebido. Fechando o Chrome..."
      Fechar-ChromeDoMural
      Write-Host "Mural encerrado pelo toque duplo."
      exit 0
    }

    Write-Host "Chrome foi fechado sem o toque duplo; reabrindo em $EsperaReabrirSeg s."
    Start-Sleep -Seconds $EsperaReabrirSeg
  }
}
finally {
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
