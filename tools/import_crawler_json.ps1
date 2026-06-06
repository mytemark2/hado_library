param(
  [Parameter(Mandatory = $true)]
  [string]$CrawlerResultZip,
  [string]$RepoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Step([string]$Message) { Write-Host "`n===== $Message =====" -ForegroundColor Cyan }
function ReadJson([string]$Path) {
  try { return (Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json) }
  catch { throw "JSON解析に失敗しました: $Path`n$($_.Exception.Message)" }
}
function Items($Json, [string[]]$Keys) {
  if ($Json -is [System.Array]) { return @($Json) }
  foreach ($key in $Keys) {
    $prop = $Json.PSObject.Properties[$key]
    if ($null -ne $prop -and $null -ne $prop.Value) { return @($prop.Value) }
  }
  return @()
}
function Equal($Actual, $Expected, [string]$Label) {
  if ($Actual -ne $Expected) { throw "$Label が不正です。期待値=$Expected / 実際=$Actual" }
}
function Prop($Object, [string]$Name) {
  if ($null -eq $Object) { return $null }
  $prop = $Object.PSObject.Properties[$Name]
  if ($null -eq $prop) { return $null }
  return $prop.Value
}

$zipPath = (Resolve-Path -LiteralPath $CrawlerResultZip).Path
$repo = (Resolve-Path -LiteralPath $RepoPath).Path
if (-not (Test-Path -LiteralPath (Join-Path $repo '.git'))) { throw "Gitリポジトリではありません: $repo" }

Push-Location $repo
try {
  Step 'CURRENT BRANCH'
  $branch = (git branch --show-current).Trim()
  Write-Host $branch
  Equal $branch 'feature/app-3.0.0.0' '作業ブランチ'

  Step 'PRE-IMPORT STATUS'
  $dirty = @(git status --porcelain)
  if ($dirty.Count -gt 0) {
    $dirty | ForEach-Object { Write-Host $_ }
    throw '未Commitの変更があります。JSON取込前に状態を整理してください。'
  }
  git status -sb

  $temp = Join-Path ([System.IO.Path]::GetTempPath()) ('hado-json-import-' + [Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $temp | Out-Null
  try {
    Step 'EXPAND ZIP'
    Expand-Archive -LiteralPath $zipPath -DestinationPath $temp -Force

    $crawlerReport = ReadJson (Join-Path $temp 'report/crawler_report.json')
    $derivedReport = ReadJson (Join-Path $temp 'report/derived_json_report.json')
    Equal $crawlerReport.meta.crawlerVersion '1.1.0.0' 'crawlerVersion'
    Equal ([int]$crawlerReport.errorsCount) 0 'errorsCount'
    Equal ([bool]$crawlerReport.fastJsonGenerated) $true 'fastJsonGenerated'
    Equal @($derivedReport.missingFiles).Count 0 'missingFiles件数'

    Step 'SELECT JSON data > previous > inherited'
    $priority = @('data', 'previous', 'inherited')
    $selected = [ordered]@{}
    foreach ($dir in $priority) {
      $full = Join-Path $temp $dir
      if (-not (Test-Path $full)) { continue }
      Get-ChildItem -LiteralPath $full -File -Filter 'hadou_*.json' | Sort-Object Name | ForEach-Object {
        if ($_.Name -eq 'hadou_errors.json') { return }
        if (-not $selected.Contains($_.Name)) { $selected[$_.Name] = $_.FullName }
      }
    }
    Equal $selected.Count 33 '反映対象JSON件数'
    $selected.GetEnumerator() | ForEach-Object { Write-Host ("{0} <- {1}" -f $_.Key, $_.Value.Substring($temp.Length + 1)) }

    Step 'JSON AUDIT'
    foreach ($entry in $selected.GetEnumerator()) { $null = ReadJson $entry.Value }

    $warhorses = Items (ReadJson $selected['hadou_warhorses.json']) @('items', 'warhorses')
    $warhorseSkills = Items (ReadJson $selected['hadou_warhorse_skills.json']) @('items', 'warhorse_skills')
    Equal $warhorses.Count 5 '名馬件数'
    Equal $warhorseSkills.Count 27 '軍馬技能件数'

    $scoreRules = ReadJson $selected['hadou_type_score_rules.json']
    $purposeRules = ReadJson $selected['hadou_type_purpose_rules.json']
    $roleRules = ReadJson $selected['hadou_type_search_role_rules.json']
    $roleIndex = ReadJson $selected['hadou_type_search_role_index.json']
    $scoreItems = Items $scoreRules @('items', 'types')
    $purposeItems = Items $purposeRules @('items', 'purposes')
    $roleItems = Items $roleRules @('items', 'roles')
    $roleIndexItems = Items $roleIndex @('items')
    Equal $scoreItems.Count 11 '型採点ルール件数'
    foreach ($item in $scoreItems) { Equal @($item.metrics).Count 5 "型採点項目数: $($item.typeId)" }
    Equal $purposeItems.Count 6 '目的ルール件数'
    Equal $roleItems.Count 9 '役割ルール件数'
    Equal $roleIndexItems.Count 2196 '役割候補索引件数'
    Equal ([bool]$roleIndex.qualityAudit.ok) $true '役割候補索引qualityAudit'
    Equal @($roleIndexItems | Where-Object { [string]$_.name -like '【三國志*' }).Count 0 '未正規化名称件数'

    $forbidden = @(
      '兵科:SSR：弓兵UR：騎兵歩兵弓兵',
      '兵科:騎兵歩兵弓兵',
      '兵科:列伝',
      '種類:famous',
      '種類:normal'
    )
    foreach ($tag in $forbidden) {
      foreach ($entry in $selected.GetEnumerator()) {
        if ((Get-Content -LiteralPath $entry.Value -Raw -Encoding UTF8).Contains($tag)) { throw "禁止タグ残存: $tag / $($entry.Key)" }
      }
    }

    $derivedRows = @()
    Get-ChildItem -LiteralPath (Join-Path $temp 'data') -File -Filter 'hadou_*.json' | ForEach-Object {
      $obj = ReadJson $_.FullName
      $kind = Prop $obj 'kind'
      if ($null -ne $kind) {
        $dataSetId = Prop $obj 'dataSetId'
        $crawlerVersion = Prop $obj 'crawlerVersion'
        $sourceFiles = Prop $obj 'sourceFiles'
        $sourceSha256 = Prop $obj 'sourceSha256'
        if ($null -eq $dataSetId -or $null -eq $crawlerVersion -or $null -eq $sourceFiles -or $null -eq $sourceSha256) {
          throw "派生JSONメタデータが不足しています: $($_.Name)"
        }
        $derivedRows += [PSCustomObject]@{
          File = $_.Name
          DataSetId = [string]$dataSetId
          CrawlerVersion = [string]$crawlerVersion
          SourceFiles = ($sourceFiles | ConvertTo-Json -Compress -Depth 20)
          SourceSha256 = ($sourceSha256 | ConvertTo-Json -Compress -Depth 20)
        }
      }
    }
    Equal @($derivedRows.DataSetId | Sort-Object -Unique).Count 1 'dataSetId種類数'
    Equal @($derivedRows.CrawlerVersion | Sort-Object -Unique).Count 1 'crawlerVersion種類数'
    Equal @($derivedRows.SourceFiles | Sort-Object -Unique).Count 1 'sourceFiles種類数'
    Equal @($derivedRows.SourceSha256 | Sort-Object -Unique).Count 1 'sourceSha256種類数'
    Equal ($derivedRows.CrawlerVersion | Select-Object -First 1) '1.1.0.0' '派生JSON crawlerVersion'

    Step 'COPY JSON TO APP SOURCE'
    $mappings = @()
    foreach ($entry in $selected.GetEnumerator()) {
      $dest = Join-Path $repo $entry.Key
      Copy-Item -LiteralPath $entry.Value -Destination $dest -Force
      $mappings += [PSCustomObject]@{
        fileName = $entry.Key
        sourcePath = $entry.Value.Substring($temp.Length + 1).Replace('\', '/')
        sha256 = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant()
      }
    }

    $devInfoPath = Join-Path $repo 'HADO_DEV_INFO.json'
    $devInfo = ReadJson $devInfoPath
    $devInfo.updateNo = '02'
    $devInfo.revision = 2
    $devInfo.displayVersion = '3.0.0.0 Update02.2'
    $devInfo.summary = 'Update02.2: import validated crawler 1.1.0.0 JSON set using data > previous > inherited priority.'
    $devInfo.updatedAt = (Get-Date).ToString('yyyy-MM-ddTHH:mm:sszzz')
    $devInfo | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $devInfoPath -Encoding UTF8

    $reportDir = Join-Path $repo 'report'
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    [ordered]@{
      version = '3.0.0.0'
      update = 'Update02.2'
      crawlerResultZip = [IO.Path]::GetFileName($zipPath)
      crawlerVersion = [string]$crawlerReport.meta.crawlerVersion
      inputZip = [string]$crawlerReport.inputZip
      networkFetch = [int]$crawlerReport.urlStats.networkFetch
      selectedJsonCount = $selected.Count
      selectedPriority = $priority
      selectedMappings = $mappings
      warhorseCount = $warhorses.Count
      warhorseSkillCount = $warhorseSkills.Count
      typeScoreRuleCount = $scoreItems.Count
      metricsPerType = 5
      purposeRuleCount = $purposeItems.Count
      roleRuleCount = $roleItems.Count
      roleIndexCount = $roleIndexItems.Count
      forbiddenTagHitCount = 0
      derivedMetadataCount = $derivedRows.Count
      dataSetId = ($derivedRows.DataSetId | Select-Object -First 1)
      importedAt = (Get-Date).ToString('o')
    } | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $reportDir 'HADO_APP_3.0.0.0_UPDATE02.2_JSON_IMPORT_AUDIT.json') -Encoding UTF8

    Step 'COMPLETED'
    Write-Host 'JSON反映と監査が完了しました。次のコマンドで確認・Commit・Pushしてください。' -ForegroundColor Green
    Write-Host 'git status -sb'
    Write-Host 'git add *.json HADO_DEV_INFO.json report/HADO_APP_3.0.0.0_UPDATE02.2_JSON_IMPORT_AUDIT.json'
    Write-Host "git commit -m 'data: import crawler 1.1.0.0 JSON set for app Update02.2'"
    Write-Host 'git push origin feature/app-3.0.0.0'
  }
  finally {
    if (Test-Path $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
  }
}
finally { Pop-Location }
