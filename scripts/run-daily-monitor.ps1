$ErrorActionPreference = 'Stop'

$accessCode = [Environment]::GetEnvironmentVariable(
  'LLM_LENS_ACCESS_CODE',
  'User'
)

if ([string]::IsNullOrWhiteSpace($accessCode)) {
  Write-Error 'LLM_LENS_ACCESS_CODE is not configured.'
  exit 1
}

Write-Output 'LLM_LENS_ACCESS_CODE: configured'

$env:LLM_LENS_ACCESS_CODE = $accessCode
$env:NODE_USE_ENV_PROXY = '1'
$env:HTTPS_PROXY = 'http://127.0.0.1:10808'
$env:HTTP_PROXY = 'http://127.0.0.1:10808'

if (-not (Test-NetConnection 127.0.0.1 -Port 10808 -InformationLevel Quiet)) {
  Write-Error 'Local proxy 127.0.0.1:10808 is not reachable.'
  exit 1
}

Set-Location 'D:\VibeCoding\LLMLens'

& npm run monitor:daily
$npmExitCode = $LASTEXITCODE
exit $npmExitCode
