param([Parameter(Mandatory = $true)][string]$binary)
$ErrorActionPreference = 'Stop'
$identifier = [Guid]::NewGuid().ToString('N')
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ('../.tools/windows-' + $identifier)))
$allowed = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../.tools')).TrimEnd('\') + '\'
if (!$root.StartsWith($allowed, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid test directory' }
$state = 'Software\DeepThroat\tests\' + $identifier + '\CLI'
$registry = 'HKCU:\' + $state
$owned = 'HKCU:\Software\DeepThroat\tests\' + $identifier
$standalone = Join-Path $root 'standalone space/bin'
$desktop = Join-Path $root 'desktop/binaries/windows'
$legacydirectory = Join-Path $root 'legacy'
foreach ($directory in @($standalone, $desktop, $legacydirectory)) { $null = New-Item -ItemType Directory -Path $directory -Force }
$standaloneexe = Join-Path $standalone 'deepthroat.exe'
$desktopexe = Join-Path $desktop 'deepthroat.exe'
$null = New-Item -ItemType HardLink -Path $standaloneexe -Target ([IO.Path]::GetFullPath($binary))
$null = New-Item -ItemType HardLink -Path $desktopexe -Target ([IO.Path]::GetFullPath($binary))
$legacy = Join-Path $legacydirectory 'deepthroat.cmd'
[IO.File]::WriteAllText($legacy, ('@echo off' + "`r`n" + 'python "C:\legacy\deepthroat\cli\entry.py" %*' + "`r`n"), [Text.Encoding]::ASCII)
$env:LOCALAPPDATA = $root
$env:DEEPTHROAT_TEST_HOME = $root
$settings = @{ state = $state; pathscope = 'Process'; legacydirectory = $legacydirectory }
try {
    & (Join-Path $PSScriptRoot 'windows.ps1') -action standalone -directory $standalone @settings
    $null = New-ItemProperty -LiteralPath $registry -Name sentinel -Value preserve -PropertyType String
    & (Join-Path $PSScriptRoot 'windows.ps1') -action standalone -directory $standalone @settings
    $properties = Get-ItemProperty -LiteralPath $registry
    if ($properties.standalone -ne [IO.Path]::GetFullPath($standalone) -or $properties.sentinel -ne 'preserve') { throw 'Standalone registration was replaced' }
    if (-not (Test-Path -LiteralPath ($legacy + '.legacy-backup'))) { throw 'Legacy launcher backup is missing' }
    $reported = & $legacy --version
    if ($LASTEXITCODE -ne 0 -or $reported -notmatch '^deepthroat v[0-9]+\.[0-9]+\.[0-9]+$') { throw 'Legacy launcher failed' }
    & (Join-Path $PSScriptRoot 'windows.ps1') -action add -directory $desktop @settings
    $properties = Get-ItemProperty -LiteralPath $registry
    if ($properties.standalone -ne [IO.Path]::GetFullPath($standalone) -or $properties.sentinel -ne 'preserve') { throw 'Desktop registration erased standalone state' }
    if ((@(Get-Command deepthroat -CommandType Application)[0]).Source -ine $standaloneexe) { throw 'Desktop took command precedence' }
    $parked = Join-Path $standalone 'deepthroat.parked'
    Move-Item -LiteralPath $standaloneexe -Destination $parked
    try {
        $reported = & $legacy --version
        if ($LASTEXITCODE -ne 0 -or $reported -notmatch '^deepthroat v[0-9]+\.[0-9]+\.[0-9]+$') { throw 'Desktop fallback failed' }
    } finally { Move-Item -LiteralPath $parked -Destination $standaloneexe }
    & (Join-Path $PSScriptRoot 'windows.ps1') -action remove -directory $desktop @settings
    $properties = Get-ItemProperty -LiteralPath $registry
    if ($properties.standalone -ne [IO.Path]::GetFullPath($standalone) -or $properties.sentinel -ne 'preserve') { throw 'Desktop removal erased standalone state' }
    if ($properties.PSObject.Properties['desktop']) { throw 'Desktop registration was not removed' }
    $reported = & $legacy --version
    if ($LASTEXITCODE -ne 0 -or $reported -notmatch '^deepthroat v[0-9]+\.[0-9]+\.[0-9]+$') { throw 'Standalone failed after desktop removal' }
    Write-Output 'Fresh nested registration, reinstall, legacy migration, standalone precedence, desktop fallback and desktop removal passed'
} finally {
    if (Test-Path -LiteralPath $owned) { Remove-Item -LiteralPath $owned -Recurse }
    if ($root.StartsWith($allowed, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $root -Leaf) -eq ('windows-' + $identifier)) { Remove-Item -LiteralPath $root -Recurse -Force }
}
