$ErrorActionPreference = 'Stop'
$root = if ($PSScriptRoot) { [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')) } else { (Get-Location).Path }
Set-Location -LiteralPath $root
node --experimental-vm-modules scripts/previewMainV2.mjs
if ($LASTEXITCODE -ne 0) { throw 'Synthetic renderer failed' }
$oldTemp = $env:TEMP
$oldTmp = $env:TMP
try {
    $env:TEMP = Join-Path $root 'output/ui2-browser-temp'
    $env:TMP = $env:TEMP
    New-Item -ItemType Directory -Path $env:TEMP -Force | Out-Null
    $arguments = @('--headless', '--disable-gpu', '--disable-extensions', '--disable-background-networking',
        '--disable-component-update', '--disable-sync', '--no-first-run', '--no-default-browser-check',
        '--host-resolver-rules="MAP * ~NOTFOUND"',
        "--user-data-dir=$root/output/ui2-final-profile", '--window-size=1600,960', '--hide-scrollbars',
        '--dump-dom', "--screenshot=$root/output/ui2-main.png", '--timeout=10000',
        "file:///$($root.Replace('\','/'))/output/ui2-main.html#checks")
    Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -WindowStyle Hidden -Wait `
        -ArgumentList $arguments -RedirectStandardOutput "$root/output/ui2-browser-dom.html" `
        -RedirectStandardError "$root/output/ui2-chrome.log"
    $html = Get-Content -LiteralPath "$root/output/ui2-browser-dom.html" -Encoding utf8 -Raw
    $match = [regex]::Match($html, '<pre[^>]*id="ui2-browser-checks"[^>]*>(.*?)</pre>')
    if (-not $match.Success) { throw 'Browser checks did not finish' }
    $checks = $match.Groups[1].Value | ConvertFrom-Json
    $checks | ConvertTo-Json | Set-Content -LiteralPath "$root/output/ui2-browser-checks.json" -Encoding utf8
    $checks | Format-Table
    if ($checks | Where-Object { -not $_.ok }) { throw 'Browser check failed' }
} finally {
    $env:TEMP = $oldTemp
    $env:TMP = $oldTmp
}
