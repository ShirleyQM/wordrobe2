$ErrorActionPreference='Stop'
$faceProjectRoot=Split-Path -Parent $PSScriptRoot
$faceDirectory=Join-Path $faceProjectRoot 'assets/materials/characters/face-live-workflow-v1'
$faceText='Hello. Welcome to Word Atelier. Look at this word. Beautiful. Let us try it together.'
$faceVoice=New-Object -ComObject SAPI.SpVoice
$faceStream=New-Object -ComObject SAPI.SpFileStream
try{
  $faceStream.Open((Join-Path $faceDirectory 'sample.wav'),3)
  $faceVoice.AudioOutputStream=$faceStream
  $null=$faceVoice.Speak($faceText)
}finally{$faceStream.Close()}
@{generator='Windows SAPI local speech synthesis';voice=$faceVoice.Voice.GetDescription();text=$faceText;microphoneUsed=$false} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $faceDirectory 'sample-source.json') -Encoding utf8
