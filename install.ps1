param(
    [string]$version = 'latest',
    [string]$directory = (Join-Path $env:LOCALAPPDATA 'DeepThroatCLI\bin')
)

$ErrorActionPreference = 'Stop'
if (-not [Environment]::Is64BitOperatingSystem) { throw 'DeepThroat CLI requires 64-bit Windows.' }
if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { throw 'Use the x64 installer from an x64 PowerShell session on Windows ARM.' }
if ($version -ne 'latest' -and $version -notmatch '^v\d+\.\d+\.\d+$') { throw 'Version must be latest or a release tag such as v0.1.0.' }
$repository = 'https://github.com/variablepy/deepthroat-cli/releases'
$release = if ($version -eq 'latest') {
    Invoke-RestMethod 'https://api.github.com/repos/variablepy/deepthroat-cli/releases/latest'
} else {
    Invoke-RestMethod "https://api.github.com/repos/variablepy/deepthroat-cli/releases/tags/$version"
}
$tag = $release.tag_name
if ($tag -notmatch '^v\d+\.\d+\.\d+$') { throw 'The release returned an invalid version.' }
$asset = 'deepthroat-windows-x64.zip'
$temporary = Join-Path ([IO.Path]::GetTempPath()) ('deepthroat-install-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $temporary
try {
    $archive = Join-Path $temporary $asset
    $checksums = Join-Path $temporary 'SHA256SUMS'
    Invoke-WebRequest "$repository/download/$tag/$asset" -OutFile $archive -UseBasicParsing
    Invoke-WebRequest "$repository/download/$tag/SHA256SUMS" -OutFile $checksums -UseBasicParsing
    $matches = @(Get-Content -LiteralPath $checksums | Where-Object { $_ -match ('^[a-fA-F0-9]{64}\s+\*?' + [regex]::Escape($asset) + '$') })
    if ($matches.Count -ne 1) { throw 'The release checksum is missing or ambiguous.' }
    $expected = ($matches[0] -split '\s+')[0]
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) { throw 'The download checksum did not match.' }
    $unpacked = Join-Path $temporary 'unpacked'
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($archive)
    try {
        if ($zip.Entries.Count -ne 2 -or @($zip.Entries | Where-Object { $_.FullName -ceq 'deepthroat.exe' }).Count -ne 1 -or @($zip.Entries | Where-Object { $_.FullName -ceq 'LICENSE.txt' }).Count -ne 1) { throw 'The release archive has unexpected contents.' }
    } finally { $zip.Dispose() }
    [IO.Compression.ZipFile]::ExtractToDirectory($archive, $unpacked)
    $binary = Join-Path $unpacked 'deepthroat.exe'
    if (-not (Test-Path -LiteralPath $binary -PathType Leaf)) { throw 'The release does not contain deepthroat.exe.' }
    $reported = & $binary --version
    if ($LASTEXITCODE -ne 0 -or ($reported -join "`n") -ne "deepthroat $tag") { throw 'The downloaded executable failed its version check.' }
    $target = [IO.Path]::GetFullPath($directory)
    $null = New-Item -ItemType Directory -Path $target -Force
    Copy-Item -LiteralPath $binary -Destination (Join-Path $target 'deepthroat.exe') -Force
    Copy-Item -LiteralPath (Join-Path $unpacked 'LICENSE.txt') -Destination (Join-Path $target 'LICENSE.txt') -Force
    $current = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @($current -split ';' | Where-Object { $_ })
    if (-not ($entries | Where-Object { $_.TrimEnd('\') -ieq $target.TrimEnd('\') })) {
        [Environment]::SetEnvironmentVariable('Path', (($entries + $target) -join ';'), 'User')
    }
    $env:Path = "$target;$env:Path"
    Write-Host "Installed DeepThroat CLI $tag. Run deepthroat auth login to connect your account."
    Write-Host 'Open a new terminal to use deepthroat in other sessions.'
} finally {
    $resolved = [IO.Path]::GetFullPath($temporary)
    $parent = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if ($resolved.StartsWith($parent, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $resolved -Leaf) -like 'deepthroat-install-*') {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
