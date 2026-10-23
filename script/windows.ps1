param(
    [ValidateSet('add', 'remove', 'standalone', 'migrate')][string]$action,
    [Parameter(Mandatory = $true)][string]$directory
)
$ErrorActionPreference = 'Stop'
$target = [IO.Path]::GetFullPath($directory).TrimEnd('\')
$registry = 'HKCU:\Software\DeepThroat\CLI'
$properties = @{ path = $null; desktop = $null; launcherpath = $null; launcherhash = $null }
$saved = Get-ItemProperty -LiteralPath $registry -ErrorAction SilentlyContinue
if ($saved) {
    foreach ($name in @('path', 'desktop', 'launcherpath', 'launcherhash')) {
        if ($saved.PSObject.Properties[$name]) { $properties[$name] = $saved.PSObject.Properties[$name].Value }
    }
}
$current = [Environment]::GetEnvironmentVariable('Path', 'User')
$entries = @($current -split ';' | Where-Object { $_ })
$owned = $properties.path
if ($action -in @('add', 'standalone', 'migrate') -and -not (Test-Path -LiteralPath (Join-Path $target 'deepthroat.exe') -PathType Leaf)) { throw 'The CLI executable is missing.' }
if ($action -eq 'standalone') {
    $entries = @($entries | Where-Object { $_.Trim('"').TrimEnd('\') -ine $target })
    [Environment]::SetEnvironmentVariable('Path', ((@($target) + $entries) -join ';'), 'User')
    if (-not (Test-Path -LiteralPath $registry)) { $null = New-Item -Path $registry }
    $null = New-ItemProperty -LiteralPath $registry -Name 'standalone' -Value $target -PropertyType String -Force
    $env:Path = "$target;$env:Path"
} elseif ($action -eq 'add') {
    if (-not (Test-Path -LiteralPath $registry)) { $null = New-Item -Path $registry }
    $null = New-ItemProperty -LiteralPath $registry -Name 'desktop' -Value $target -PropertyType String -Force
    if (-not ($entries | Where-Object { $_.Trim('"').TrimEnd('\') -ieq $target })) {
        [Environment]::SetEnvironmentVariable('Path', (($entries + $target) -join ';'), 'User')
        $null = New-ItemProperty -LiteralPath $registry -Name 'path' -Value $target -PropertyType String -Force
    }
} elseif ($action -eq 'remove') {
    if ($owned -and $owned.TrimEnd('\') -ieq $target) {
        $remaining = @($entries | Where-Object { $_.Trim('"').TrimEnd('\') -ine $target })
        [Environment]::SetEnvironmentVariable('Path', ($remaining -join ';'), 'User')
        Remove-ItemProperty -LiteralPath $registry -Name 'path'
    }
    if ($properties.desktop -and $properties.desktop.TrimEnd('\') -ieq $target) {
        Remove-ItemProperty -LiteralPath $registry -Name 'desktop'
    }
}
if ($action -ne 'remove') {
    $legacy = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs\deepthroat\deepthroat.cmd'
    $launcher = @'
@echo off
setlocal DisableDelayedExpansion
set "target="
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\DeepThroat\CLI" /v standalone 2^>nul') do if /i "%%a"=="REG_SZ" if exist "%%b\deepthroat.exe" set "target=%%b\deepthroat.exe"
if defined target goto launch
if exist "%LOCALAPPDATA%\DeepThroatCLI\bin\deepthroat.exe" set "target=%LOCALAPPDATA%\DeepThroatCLI\bin\deepthroat.exe"
if defined target goto launch
for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\DeepThroat\CLI" /v desktop 2^>nul') do if /i "%%a"=="REG_SZ" if exist "%%b\deepthroat.exe" set "target=%%b\deepthroat.exe"
if defined target goto launch
echo Install DeepThroat CLI or enable the CLI in the desktop installer. 1>&2
exit /b 1
:launch
"%target%" %*
exit /b %errorlevel%
'@
    if (Test-Path -LiteralPath $legacy -PathType Leaf) {
        $content = Get-Content -LiteralPath $legacy -Raw
        $hash = (Get-FileHash -LiteralPath $legacy -Algorithm SHA256).Hash
        $old = $content -match '(?i)python' -and $content -match '(?i)deepthroat[\\/]cli[\\/]entry\.py'
        $managed = $properties.launcherpath -and $properties.launcherpath -ieq $legacy -and $properties.launcherhash -eq $hash
        if ($old -or $managed) {
            $backup = $legacy + '.legacy-backup'
            if (-not (Test-Path -LiteralPath $backup)) { Copy-Item -LiteralPath $legacy -Destination $backup }
            $temporary = $legacy + '.pending'
            [IO.File]::WriteAllText($temporary, $launcher.Replace("`r`n", "`n").Replace("`n", "`r`n") + "`r`n", [Text.Encoding]::ASCII)
            Move-Item -LiteralPath $temporary -Destination $legacy -Force
            if (-not (Test-Path -LiteralPath $registry)) { $null = New-Item -Path $registry }
            $null = New-ItemProperty -LiteralPath $registry -Name 'launcherpath' -Value $legacy -PropertyType String -Force
            $null = New-ItemProperty -LiteralPath $registry -Name 'launcherhash' -Value (Get-FileHash -LiteralPath $legacy -Algorithm SHA256).Hash -PropertyType String -Force
        }
    }
}
if (-not ('deepthroat.settings' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace deepthroat {
    public static class settings {
        [DllImport("user32.dll", CharSet = CharSet.Unicode, EntryPoint = "SendMessageTimeoutW")]
        public static extern IntPtr send(IntPtr h, uint m, IntPtr w, string l, uint f, uint t, out IntPtr result);
    }
}
'@
}
$result = [IntPtr]::Zero
$null = [deepthroat.settings]::send([IntPtr]0xffff, 0x1a, [IntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)
