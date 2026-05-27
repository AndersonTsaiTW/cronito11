import fs from 'node:fs/promises'
import path from 'node:path'

const RAW_DATA_PATH = 'data/daily-shelter-overnight-service-occupancy-capacity-2025.json'
const CACHE_PATH = 'data/geocoded-shelter-locations.json'
const OUTPUT_PATH = 'src/data/shelters.ts'
const SOURCE_URL = 'https://open.toronto.ca/dataset/daily-shelter-overnight-service-occupancy-capacity/'
const TORONTO_BBOX = [-79.65, 43.55, -79.1, 43.85]

const args = new Set(process.argv.slice(2))
const SHOULD_GEOCODE = args.has('--geocode')
const LIMIT = process.env.SHELTER_LIMIT ? Number(process.env.SHELTER_LIMIT) : undefined

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function readEnvToken() {
  if (process.env.VITE_MAPBOX_TOKEN) return process.env.VITE_MAPBOX_TOKEN

  try {
    const envFile = await fs.readFile('.env', 'utf8')
    const match = envFile.match(/^VITE_MAPBOX_TOKEN=(.+)$/m)
    return match?.[1]?.trim()
  } catch {
    return undefined
  }
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function fullAddress(row) {
  const parts = [
    row.LOCATION_ADDRESS,
    row.LOCATION_CITY,
    row.LOCATION_PROVINCE,
    'Canada',
  ].filter(Boolean)

  return parts.join(', ')
}

function classifyType(item) {
  const text = `${[...item.serviceTypes].join(' ')} ${[...item.programAreas].join(' ')} ${item.name}`.toLowerCase()

  if (text.includes('warming')) return 'warming_center'
  if (text.includes('cooling')) return 'cooling_center'
  if (text.includes('respite') || text.includes('community')) return 'resilience_hub'
  return 'shelter'
}

function buildServices(item, energyProfile) {
  const services = []

  if (energyProfile.cooling) services.push('Cooling')
  if (energyProfile.heating) services.push('Heating')
  if (energyProfile.charging) services.push('Device charging')
  if (energyProfile.medicalSupport) services.push('Medical support')
  if (energyProfile.water) services.push('Water')
  if (energyProfile.food) services.push('Food')
  if (energyProfile.accessible) services.push('Accessible')
  if (energyProfile.petsAllowed) services.push('Pet friendly')

  const serviceTypes = [...item.serviceTypes]
  if (serviceTypes.length > 0) services.push(...serviceTypes)

  return [...new Set(services)]
}

function mockEnergyProfile(item, index) {
  const occupancyRate = item.occupancy / Math.max(item.capacity, 1)
  const largeSite = item.capacity >= 180
  const mediumSite = item.capacity >= 100
  const outage = index % 11 === 3 || occupancyRate >= 1
  const unstable = !outage && (index % 5 === 1 || occupancyRate >= 0.92)
  const generator = largeSite ? 'automatic' : mediumSite ? 'manual' : index % 3 === 0 ? 'manual' : 'none'
  const batteryKWh = largeSite ? 320 + index * 8 : mediumSite ? 120 + index * 5 : 40 + index * 3
  const solarKW = largeSite ? 55 + (index % 4) * 10 : mediumSite ? 20 + (index % 3) * 6 : index % 2 === 0 ? 8 : 0
  const estimatedRuntimeHours = generator === 'automatic' ? 24 + (index % 5) * 3 : generator === 'manual' ? 8 + (index % 4) * 2 : 3 + (index % 3)
  const requests = []
  const reports = []

  if (outage) reports.push('Power outage affecting operations')
  if (unstable) reports.push('Grid instability reported')
  if (occupancyRate >= 0.98) reports.push('At or near capacity')
  if (occupancyRate >= 0.9) requests.push('Redistribution support')
  if (generator !== 'automatic' && unstable) requests.push('Backup generator')
  if (generator !== 'none' && estimatedRuntimeHours < 12) requests.push('Fuel delivery')

  return {
    gridStatus: outage ? 'outage' : unstable ? 'unstable' : 'online',
    generator,
    generatorFuelType: generator === 'none' ? undefined : largeSite ? 'natural_gas' : 'diesel',
    fuelHoursRemaining: generator === 'none' ? undefined : estimatedRuntimeHours + 6,
    batteryKWh,
    batterySOC: Math.max(25, 92 - index * 3),
    solarKW,
    estimatedRuntimeHours,
    cooling: index % 7 !== 2,
    heating: true,
    charging: generator !== 'none' || batteryKWh >= 80,
    medicalSupport: largeSite || index % 6 === 0,
    water: true,
    food: item.capacity >= 50,
    accessible: true,
    petsAllowed: index % 4 === 0,
    requests,
    reports,
  }
}

function scoreShelter(item, energy) {
  let score = 45
  const occupancyRate = item.occupancy / Math.max(item.capacity, 1)

  score += Math.max(0, 25 - occupancyRate * 25)
  if (energy.gridStatus === 'online') score += 12
  if (energy.gridStatus === 'unstable') score += 4
  if (energy.gridStatus === 'outage') score -= 16
  if (energy.generator === 'automatic') score += 12
  if (energy.generator === 'manual') score += 6
  if (energy.batteryKWh >= 200) score += 8
  if (energy.solarKW >= 40) score += 5
  if (energy.estimatedRuntimeHours >= 24) score += 8
  if (energy.cooling) score += 4
  if (energy.charging) score += 3
  if (energy.medicalSupport) score += 4
  score -= energy.requests.length * 4
  score -= energy.reports.length * 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

function aggregateLatestLocations(rows) {
  const dates = [...new Set(rows.map((row) => row.OCCUPANCY_DATE).filter(Boolean))].sort()
  const latestDate = dates.at(-1)
  const latestRows = rows.filter((row) => row.OCCUPANCY_DATE === latestDate)
  const locations = new Map()

  for (const row of latestRows) {
    const locationId = row.LOCATION_ID || `${row.LOCATION_NAME}|${row.LOCATION_ADDRESS}`
    if (!locationId || !row.LOCATION_NAME || !row.LOCATION_ADDRESS) continue

    const item = locations.get(locationId) || {
      locationId,
      name: row.LOCATION_NAME.trim(),
      address: row.LOCATION_ADDRESS.trim(),
      city: row.LOCATION_CITY || 'Toronto',
      stateProvince: row.LOCATION_PROVINCE || 'ON',
      capacity: 0,
      occupancy: 0,
      programs: 0,
      serviceTypes: new Set(),
      sectors: new Set(),
      programModels: new Set(),
      programAreas: new Set(),
      lastUpdated: latestDate,
    }

    const capacity =
      toNumber(row.CAPACITY_ACTUAL_BED) ||
      toNumber(row.CAPACITY_ACTUAL_ROOM) ||
      toNumber(row.CAPACITY_FUNDING_BED) ||
      toNumber(row.CAPACITY_FUNDING_ROOM)
    const occupancy =
      toNumber(row.OCCUPIED_BEDS) ||
      toNumber(row.OCCUPIED_ROOMS) ||
      toNumber(row.SERVICE_USER_COUNT)

    item.capacity += capacity
    item.occupancy += occupancy
    item.programs += 1

    if (row.OVERNIGHT_SERVICE_TYPE) item.serviceTypes.add(row.OVERNIGHT_SERVICE_TYPE)
    if (row.SECTOR) item.sectors.add(row.SECTOR)
    if (row.PROGRAM_MODEL) item.programModels.add(row.PROGRAM_MODEL)
    if (row.PROGRAM_AREA) item.programAreas.add(row.PROGRAM_AREA)

    locations.set(locationId, item)
  }

  return {
    latestDate,
    locations: [...locations.values()]
      .filter((item) => item.capacity > 0)
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, LIMIT),
  }
}

async function geocodeAddress(address, token) {
  const url = new URL(`https://api.mapbox.com/search/geocode/v6/forward`)
  url.searchParams.set('q', address)
  url.searchParams.set('access_token', token)
  url.searchParams.set('country', 'ca')
  url.searchParams.set('bbox', TORONTO_BBOX.join(','))
  url.searchParams.set('limit', '1')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  const feature = result.features?.[0]
  const coordinates = feature?.geometry?.coordinates
  if (!coordinates) return undefined

  return {
    longitude: coordinates[0],
    latitude: coordinates[1],
    geocodedAddress: address,
    geocodingStatus: 'success',
    geocodingSource: 'mapbox',
    geocodingConfidence: feature.properties?.match_code?.confidence,
  }
}

async function resolveCoordinates(locations) {
  const token = await readEnvToken()
  const cache = await readJson(CACHE_PATH, [])
  const byLocationId = new Map(cache.map((entry) => [entry.locationId, entry]))
  const nextCache = [...cache]

  for (const location of locations) {
    const cached = byLocationId.get(location.locationId)
    if (cached?.longitude && cached?.latitude) {
      location.geocode = cached
      continue
    }

    if (!SHOULD_GEOCODE) continue
    if (!token) throw new Error('Missing VITE_MAPBOX_TOKEN. Add it to .env or the environment.')

    const address = fullAddress({
      LOCATION_ADDRESS: location.address,
      LOCATION_CITY: location.city,
      LOCATION_PROVINCE: location.stateProvince,
    })
    const geocode = await geocodeAddress(address, token)
    if (!geocode) continue

    const entry = {
      locationId: location.locationId,
      name: location.name,
      address,
      ...geocode,
      addressSourceUrl: SOURCE_URL,
    }
    nextCache.push(entry)
    byLocationId.set(location.locationId, entry)
    location.geocode = entry
  }

  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true })
  await fs.writeFile(CACHE_PATH, `${JSON.stringify(nextCache, null, 2)}\n`)

  return locations.filter((location) => location.geocode?.longitude && location.geocode?.latitude)
}

function toTsString(value) {
  return JSON.stringify(value, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replaceAll('"shelter"', "'shelter'")
    .replaceAll('"cooling_center"', "'cooling_center'")
    .replaceAll('"warming_center"', "'warming_center'")
    .replaceAll('"resilience_hub"', "'resilience_hub'")
    .replaceAll('"online"', "'online'")
    .replaceAll('"unstable"', "'unstable'")
    .replaceAll('"outage"', "'outage'")
    .replaceAll('"none"', "'none'")
    .replaceAll('"manual"', "'manual'")
    .replaceAll('"automatic"', "'automatic'")
    .replaceAll('"diesel"', "'diesel'")
    .replaceAll('"natural_gas"', "'natural_gas'")
    .replaceAll('"propane"', "'propane'")
}

async function main() {
  const rawRows = await readJson(RAW_DATA_PATH)
  const { latestDate, locations } = aggregateLatestLocations(rawRows)
  const geocodedLocations = await resolveCoordinates(locations)

  const shelters = geocodedLocations.map((location, index) => {
    const energy = mockEnergyProfile(location, index)
    const services = buildServices(location, energy)
    const sourceName = 'City of Toronto Open Data + demo energy estimates'
    const shelter = {
      id: `toronto-${location.locationId}`,
      name: location.name,
      type: classifyType(location),
      address: location.address,
      city: location.city,
      stateProvince: location.stateProvince,
      coordinates: [location.geocode.longitude, location.geocode.latitude],
      capacity: location.capacity,
      occupancy: Math.min(location.occupancy, location.capacity),
      gridStatus: energy.gridStatus,
      generator: energy.generator,
      ...(energy.generatorFuelType ? { generatorFuelType: energy.generatorFuelType } : {}),
      ...(energy.fuelHoursRemaining ? { fuelHoursRemaining: energy.fuelHoursRemaining } : {}),
      batteryKWh: energy.batteryKWh,
      batterySOC: energy.batterySOC,
      solarKW: energy.solarKW,
      estimatedRuntimeHours: energy.estimatedRuntimeHours,
      cooling: energy.cooling,
      heating: energy.heating,
      charging: energy.charging,
      medicalSupport: energy.medicalSupport,
      water: energy.water,
      food: energy.food,
      accessible: energy.accessible,
      petsAllowed: energy.petsAllowed,
      services,
      requests: energy.requests,
      reports: energy.reports,
      resilienceScore: scoreShelter(location, energy),
      sourceName,
      sourceUrl: SOURCE_URL,
      lastUpdated: latestDate,
    }

    return shelter
  })

  const output = `import type { Shelter } from '../types'\n\n// Generated by scripts/process-shelters.js from City of Toronto shelter occupancy/capacity data.\n// Shelter names, addresses, capacity, and occupancy are real source data; energy fields are demo estimates.\nexport const shelters: Shelter[] = ${toTsString(shelters)}\n`

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, output)

  console.log(`Processed ${rawRows.length} rows from ${latestDate}.`)
  console.log(`Selected ${locations.length} locations; generated ${shelters.length} geocoded shelters.`)
  if (shelters.length < locations.length) {
    console.log(`${locations.length - shelters.length} selected locations need geocoding before they can appear on the map.`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
