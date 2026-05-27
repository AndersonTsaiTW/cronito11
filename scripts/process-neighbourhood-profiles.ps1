Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
$xlsxPath = Join-Path $root 'data/neighbourhood-profiles-2021-158-model.xlsx'
$boundaryPath = Join-Path $root 'data/toronto-neighbourhoods-158.geojson'
$jsonOutputPath = Join-Path $root 'data/toronto-social-vulnerability-2021.json'
$geojsonOutputPath = Join-Path $root 'data/toronto-social-vulnerability-2021.geojson'

if (-not (Test-Path -LiteralPath $xlsxPath)) {
  throw "Missing input file: $xlsxPath"
}

if (-not (Test-Path -LiteralPath $boundaryPath)) {
  throw "Missing input file: $boundaryPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempDir = Join-Path $env:TEMP ('neighbourhood-profiles-' + [guid]::NewGuid().ToString('N'))
[System.IO.Compression.ZipFile]::ExtractToDirectory($xlsxPath, $tempDir)

try {
  $sharedStrings = New-Object System.Collections.Generic.List[string]
  $sharedStringsPath = Join-Path $tempDir 'xl/sharedStrings.xml'

  if (Test-Path -LiteralPath $sharedStringsPath) {
    $sharedXml = [xml](Get-Content -LiteralPath $sharedStringsPath)
    $sharedNs = New-Object System.Xml.XmlNamespaceManager($sharedXml.NameTable)
    $sharedNs.AddNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

    foreach ($item in $sharedXml.SelectNodes('//m:si', $sharedNs)) {
      $textParts = @($item.SelectNodes('.//m:t', $sharedNs) | ForEach-Object { $_.'#text' })
      [void]$sharedStrings.Add(($textParts -join ''))
    }
  }

  function Get-ColumnNumber {
    param([Parameter(Mandatory = $true)][string]$CellReference)

    $letters = ($CellReference -replace '[0-9]', '').ToUpperInvariant()
    $number = 0

    foreach ($char in $letters.ToCharArray()) {
      $number = ($number * 26) + ([int][char]$char - [int][char]'A' + 1)
    }

    return $number
  }

  function Get-CellText {
    param([Parameter(Mandatory = $false)]$Cell)

    if ($null -eq $Cell -or $null -eq $Cell.v) {
      return ''
    }

    $cellType = $Cell.GetAttribute('t')

    if ($cellType -eq 's') {
      return $sharedStrings[[int]$Cell.v]
    }

    return [string]$Cell.v
  }

  function Read-RowMap {
    param(
      [Parameter(Mandatory = $true)]$Sheet,
      [Parameter(Mandatory = $true)]$NamespaceManager,
      [Parameter(Mandatory = $true)][int]$RowNumber
    )

    $row = $Sheet.SelectSingleNode("//m:sheetData/m:row[@r='$RowNumber']", $NamespaceManager)
    $values = @{}

    foreach ($cell in $row.SelectNodes('m:c', $NamespaceManager)) {
      $columnNumber = Get-ColumnNumber -CellReference $cell.r
      $values[$columnNumber] = Get-CellText -Cell $cell
    }

    return $values
  }

  function Convert-ToNumber {
    param([Parameter(Mandatory = $false)]$Value)

    if ($null -eq $Value -or $Value -eq '') {
      return $null
    }

    $text = ([string]$Value).Replace(',', '').Trim()
    $number = 0.0

    if ([double]::TryParse($text, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$number)) {
      return $number
    }

    return $null
  }

  function Get-Value {
    param(
      [Parameter(Mandatory = $true)]$RowMap,
      [Parameter(Mandatory = $true)][int]$ColumnNumber
    )

    if ($RowMap.ContainsKey($ColumnNumber)) {
      return Convert-ToNumber -Value $RowMap[$ColumnNumber]
    }

    return $null
  }

  function Normalize-Values {
    param([Parameter(Mandatory = $true)][object[]]$Values)

    $numbers = @($Values | Where-Object { $null -ne $_ })
    $min = ($numbers | Measure-Object -Minimum).Minimum
    $max = ($numbers | Measure-Object -Maximum).Maximum

    if ($null -eq $min -or $null -eq $max -or $max -eq $min) {
      return @($Values | ForEach-Object { if ($null -eq $_) { $null } else { 0.5 } })
    }

    return @($Values | ForEach-Object {
      if ($null -eq $_) {
        $null
      } else {
        [math]::Round((($_ - $min) / ($max - $min)), 4)
      }
    })
  }

  $sheetXml = [xml](Get-Content -LiteralPath (Join-Path $tempDir 'xl/worksheets/sheet1.xml'))
  $sheetNs = New-Object System.Xml.XmlNamespaceManager($sheetXml.NameTable)
  $sheetNs.AddNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')

  $nameRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 1
  $numberRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 2
  $designationRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 3
  $populationRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 4
  $childrenRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 5
  $olderAdultsRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 20
  $lowIncomeRateRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 179
  $unemploymentRateRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 1972
  $visibleMinorityRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 1643
  $immigrantRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 1488
  $tenantShelterCostBurdenRow = Read-RowMap -Sheet $sheetXml -NamespaceManager $sheetNs -RowNumber 378

  $records = New-Object System.Collections.Generic.List[object]

  for ($column = 2; $column -le 159; $column++) {
    $id = Get-Value -RowMap $numberRow -ColumnNumber $column

    if ($null -eq $id) {
      continue
    }

    $population = Get-Value -RowMap $populationRow -ColumnNumber $column
    $children = Get-Value -RowMap $childrenRow -ColumnNumber $column
    $olderAdults = Get-Value -RowMap $olderAdultsRow -ColumnNumber $column
    $visibleMinority = Get-Value -RowMap $visibleMinorityRow -ColumnNumber $column
    $immigrants = Get-Value -RowMap $immigrantRow -ColumnNumber $column

    [void]$records.Add([pscustomobject]@{
      id = [string][int]$id
      name = $nameRow[$column]
      tsnsDesignation = $designationRow[$column]
      population = $population
      children = $children
      childrenShare = if ($population -and $population -gt 0) { [math]::Round(($children / $population) * 100, 2) } else { $null }
      olderAdults = $olderAdults
      olderAdultsShare = if ($population -and $population -gt 0) { [math]::Round(($olderAdults / $population) * 100, 2) } else { $null }
      lowIncomeRate = Get-Value -RowMap $lowIncomeRateRow -ColumnNumber $column
      unemploymentRate = Get-Value -RowMap $unemploymentRateRow -ColumnNumber $column
      tenantShelterCostBurdenRate = Get-Value -RowMap $tenantShelterCostBurdenRow -ColumnNumber $column
      visibleMinorityPopulation = $visibleMinority
      visibleMinorityShare = if ($population -and $population -gt 0) { [math]::Round(($visibleMinority / $population) * 100, 2) } else { $null }
      immigrantPopulation = $immigrants
      immigrantShare = if ($population -and $population -gt 0) { [math]::Round(($immigrants / $population) * 100, 2) } else { $null }
      sourceName = 'City of Toronto Neighbourhood Profiles 2021'
      sourceUrl = 'https://open.toronto.ca/dataset/neighbourhood-profiles/'
      lastUpdated = '2026-02-20'
    })
  }

  $scoreInputs = @(
    @{ Name = 'childrenShare'; Values = @($records | ForEach-Object { $_.childrenShare }) },
    @{ Name = 'olderAdultsShare'; Values = @($records | ForEach-Object { $_.olderAdultsShare }) },
    @{ Name = 'lowIncomeRate'; Values = @($records | ForEach-Object { $_.lowIncomeRate }) },
    @{ Name = 'unemploymentRate'; Values = @($records | ForEach-Object { $_.unemploymentRate }) },
    @{ Name = 'tenantShelterCostBurdenRate'; Values = @($records | ForEach-Object { $_.tenantShelterCostBurdenRate }) }
  )

  $normalizedByField = @{}

  foreach ($input in $scoreInputs) {
    $normalizedByField[$input.Name] = Normalize-Values -Values $input.Values
  }

  for ($index = 0; $index -lt $records.Count; $index++) {
    $parts = New-Object System.Collections.Generic.List[double]

    foreach ($input in $scoreInputs) {
      $value = $normalizedByField[$input.Name][$index]

      if ($null -ne $value) {
        [void]$parts.Add([double]$value)
      }
    }

    $score = if ($parts.Count -gt 0) {
      [math]::Round((($parts | Measure-Object -Average).Average), 4)
    } else {
      $null
    }

    $riskLevel = if ($score -ge 0.75) {
      'extreme'
    } elseif ($score -ge 0.5) {
      'high'
    } elseif ($score -ge 0.25) {
      'medium'
    } else {
      'low'
    }

    $records[$index] | Add-Member -NotePropertyName communityNeedIndex -NotePropertyValue $score
    $records[$index] | Add-Member -NotePropertyName socialVulnerabilityIndex -NotePropertyValue $score
    $records[$index] | Add-Member -NotePropertyName riskLevel -NotePropertyValue $riskLevel
    $records[$index] | Add-Member -NotePropertyName scoreName -NotePropertyValue 'Community Need Index'
    $records[$index] | Add-Member -NotePropertyName scoreMethod -NotePropertyValue 'Demo composite created by this project, not an official City of Toronto index. It averages normalized children share, older-adult share, low-income rate, unemployment rate, and tenant shelter cost burden rate.'
  }

  $boundaryGeoJson = Get-Content -LiteralPath $boundaryPath -Raw | ConvertFrom-Json
  $recordsById = @{}

  foreach ($record in $records) {
    $recordsById[$record.id] = $record
  }

  foreach ($feature in $boundaryGeoJson.features) {
    $hoodId = [string][int]$feature.properties.HOOD_ID
    $record = $recordsById[$hoodId]

    if ($null -eq $record) {
      continue
    }

    $feature.properties = [pscustomobject]@{
      id = $record.id
      type = 'social_vulnerability'
      riskLevel = $record.riskLevel
      label = $record.name
      sourceName = $record.sourceName
      sourceUrl = $record.sourceUrl
      lastUpdated = $record.lastUpdated
      communityNeedIndex = $record.socialVulnerabilityIndex
      socialVulnerabilityIndex = $record.socialVulnerabilityIndex
      population = $record.population
      children = $record.children
      childrenShare = $record.childrenShare
      olderAdults = $record.olderAdults
      olderAdultsShare = $record.olderAdultsShare
      lowIncomeRate = $record.lowIncomeRate
      unemploymentRate = $record.unemploymentRate
      tenantShelterCostBurdenRate = $record.tenantShelterCostBurdenRate
      visibleMinorityPopulation = $record.visibleMinorityPopulation
      visibleMinorityShare = $record.visibleMinorityShare
      immigrantPopulation = $record.immigrantPopulation
      immigrantShare = $record.immigrantShare
      tsnsDesignation = $record.tsnsDesignation
      isMock = $false
      scoreName = 'Community Need Index'
      scoreMethod = 'Demo composite created by this project, not an official City of Toronto index. It averages normalized children share, older-adult share, low-income rate, unemployment rate, and tenant shelter cost burden rate.'
    }
  }

  $records |
    ConvertTo-Json -Depth 8 |
    Set-Content -LiteralPath $jsonOutputPath -Encoding utf8

  $boundaryGeoJson |
    ConvertTo-Json -Depth 100 |
    Set-Content -LiteralPath $geojsonOutputPath -Encoding utf8

  Write-Output "Wrote $($records.Count) records to $jsonOutputPath"
  Write-Output "Wrote GeoJSON to $geojsonOutputPath"
}
finally {
  if (Test-Path -LiteralPath $tempDir) {
    Remove-Item -LiteralPath $tempDir -Recurse -Force
  }
}
