$ErrorActionPreference='Stop'
$faceProjectRoot=Split-Path -Parent $PSScriptRoot
$faceRhubarb=Join-Path $faceProjectRoot '.tools/face-workflow/rhubarb-1.14.0/Rhubarb-Lip-Sync-1.14.0-Windows'
# Rhubarb/PocketSphinx cannot reliably resolve its own executable under a Chinese path on Windows.
$faceAscii=Join-Path $env:TEMP 'word-atelier-rhubarb-114'
New-Item -ItemType Directory -Path $faceAscii -Force | Out-Null
Copy-Item -Path (Join-Path $faceRhubarb '*') -Destination $faceAscii -Recurse -Force
Copy-Item -LiteralPath (Join-Path $faceProjectRoot 'assets/materials/characters/face-live-workflow-v1/sample.wav') -Destination (Join-Path $faceAscii 'sample.wav') -Force
& (Join-Path $faceAscii 'rhubarb.exe') -f json -o (Join-Path $faceAscii 'sample-cues.json') (Join-Path $faceAscii 'sample.wav')
if($LASTEXITCODE -ne 0){throw 'Rhubarb recognition failed'}
Copy-Item -LiteralPath (Join-Path $faceAscii 'sample-cues.json') -Destination (Join-Path $faceProjectRoot 'assets/materials/characters/face-live-workflow-v1/sample-cues.json') -Force
$faceCue=Get-Content -LiteralPath (Join-Path $faceAscii 'sample-cues.json') -Raw | ConvertFrom-Json
$faceCue.metadata.soundFile='sample.wav'
$faceCue | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $faceProjectRoot 'assets/materials/characters/face-live-workflow-v1/sample-cues.json') -Encoding utf8
Write-Output ('Generated mouth cues: '+$faceCue.mouthCues.Count)
