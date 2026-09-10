# Puts a "BlueKnight Deploy" shortcut on the Desktop pointing at the launcher.
#
#   Right-click this file -> Run with PowerShell
#   or:  powershell -ExecutionPolicy Bypass -File .\Create-Desktop-Shortcut.ps1
#
# Pin a single target instead of the picker:
#   .\Create-Desktop-Shortcut.ps1 -Target cloudflare
param(
    [ValidateSet('', 'cloudflare', 'cloudflare-pages', 'vercel', 'netlify', 'fly', 'railway', 'render', 'koyeb', 'docker', 'native', 'local', '--check')]
    [string]$Target = '',
    [string]$Name = 'BlueKnight Deploy'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcher = Join-Path $root 'BlueKnight-Deploy.cmd'

if (-not (Test-Path $launcher)) {
    Write-Host "  BlueKnight-Deploy.cmd not found next to this script ($root)." -ForegroundColor Red
    exit 1
}

$desktop = [Environment]::GetFolderPath('Desktop')
$linkName = if ($Target) { "$Name ($Target)" } else { $Name }
$linkPath = Join-Path $desktop "$linkName.lnk"

$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($linkPath)
$link.TargetPath = $launcher
$link.Arguments = $Target
$link.WorkingDirectory = $root
$link.Description = 'Deploy BlueKnight Panel'

# Borrow the Node icon when it is available; fall back to the generic console one.
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
$link.IconLocation = if ($node) { "$node,0" } else { "$env:SystemRoot\System32\cmd.exe,0" }

$link.Save()

Write-Host ""
Write-Host "  Created: $linkPath" -ForegroundColor Green
if ($Target) {
    Write-Host "  Double-click it to deploy straight to '$Target'."
} else {
    Write-Host "  Double-click it to open the deployment picker."
}
Write-Host ""
