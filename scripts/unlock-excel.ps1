param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [string]$Password = ""
)

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
  $wb = $excel.Workbooks.Open($InputPath, 0, $false, 5, $Password)
  if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
  }
  # FileFormat 51 = xlsx; empty Password/WriteResPassword = no encryption on output
  $wb.SaveAs($OutputPath, 51, "", "", $false, $false, 2, $false)
  $wb.Close($false)
  Write-Output "Saved unprotected copy to $OutputPath"
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
finally {
  $excel.Quit() | Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
