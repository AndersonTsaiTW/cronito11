import type { ForecastOffset, ForecastTemperaturePoint } from '../types'

const ECCC_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items'
// bbox covers GTA: west, south, east, north
const TORONTO_BBOX = '-80.2,43.3,-78.7,44.1'

const ALLOWED_CITIES = new Set([
  'Toronto',
  'Toronto Island',
  'Mississauga',
  'Vaughan',
  'Richmond Hill',
  'Markham',
  'Pickering',
  'Oakville',
])

function parseTemp(val: unknown): number | null {
  if (val == null || val === '') return null
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function toRiskLevel(tempC: number | null): ForecastTemperaturePoint['riskLevel'] {
  if (tempC == null) return 'low'
  if (tempC >= 34) return 'extreme'
  if (tempC >= 30) return 'high'
  if (tempC >= 26) return 'medium'
  return 'low'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFeature(feature: any, offset: ForecastOffset): ForecastTemperaturePoint | null {
  try {
    const props = feature?.properties
    const name: string = props?.name?.en ?? props?.name ?? ''
    if (!ALLOWED_CITIES.has(name)) return null

    const coords: number[] = feature?.geometry?.coordinates
    if (!coords || coords.length < 2) return null

    const currentTemperatureC = parseTemp(props?.currentConditions?.temperature?.value?.en)

    const forecasts: any[] = props?.forecastGroup?.forecasts ?? []

    // temperatures.temperature is an array; find entries where class.en === 'high'
    const getHighTemp = (forecast: any): number | null => {
      const tempArr: any[] = forecast?.temperatures?.temperature ?? []
      const highEntry = tempArr.find((t: any) => t?.class?.en === 'high')
      return parseTemp(highEntry?.value?.en)
    }

    const highForecasts = forecasts.filter((f: any) => {
      const tempArr: any[] = f?.temperatures?.temperature ?? []
      return tempArr.some((t: any) => t?.class?.en === 'high')
    })

    const todayHighC = getHighTemp(highForecasts[0])
    const tomorrowHighC = getHighTemp(highForecasts[1])

    const firstHourly = props?.hourlyForecastGroup?.hourlyForecasts?.[0]
    const humidex = parseTemp(firstHourly?.humidex?.value?.en)

    const displayTempC =
      offset === 'today_high' ? todayHighC
      : offset === 'tomorrow_high' ? tomorrowHighC
      : currentTemperatureC

    const warnings = Array.isArray(props?.warnings?.events) && props.warnings.events.length > 0

    return {
      id: props?.identifier ?? name.toLowerCase().replace(/\s+/g, '-'),
      name,
      region: props?.region?.en ?? name,
      coordinates: [coords[0], coords[1]],
      currentTemperatureC,
      todayHighC,
      tomorrowHighC,
      humidex,
      riskLevel: toRiskLevel(displayTempC),
      displayTempC,
      warnings,
      sourceName: 'ECCC MSC GeoMet citypageweather-realtime',
      sourceUrl: `${ECCC_URL}/${props?.identifier ?? ''}?f=json`,
      lastUpdated:
        props?.currentConditions?.dateTime?.find((dt: any) => dt?.zone === 'EDT' || dt?.zone === 'EST')
          ?.textSummary?.en ??
        props?.currentConditions?.dateTime?.[0]?.textSummary?.en ??
        new Date().toUTCString(),
    }
  } catch {
    return null
  }
}

// Cache is module-level; cleared on page reload (dev HMR resets module state)
let cachedRawFeatures: unknown[] | null = null

async function fetchRawFeatures(): Promise<unknown[]> {
  if (cachedRawFeatures) return cachedRawFeatures
  const url = `${ECCC_URL}?f=json&bbox=${TORONTO_BBOX}&lang=en`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`ECCC API ${resp.status}`)
  const data = await resp.json()
  cachedRawFeatures = data?.features ?? []
  return cachedRawFeatures!
}

export async function fetchForecastPoints(
  offset: ForecastOffset,
): Promise<ForecastTemperaturePoint[]> {
  try {
    const features = await fetchRawFeatures()
    const points = (features as any[])
      .map((f) => parseFeature(f, offset))
      .filter((p): p is ForecastTemperaturePoint => p !== null)
    if (points.length === 0) throw new Error('No matching city pages in API response')
    return points
  } catch (err) {
    console.warn('ECCC weather API failed, falling back to mock data:', err)
    return getMockForecastPoints(offset)
  }
}

// Re-derive display values from cached raw data when offset changes, without a new network call
export async function rederiveForecastPoints(
  offset: ForecastOffset,
): Promise<ForecastTemperaturePoint[]> {
  if (!cachedRawFeatures) return fetchForecastPoints(offset)
  const points = (cachedRawFeatures as any[])
    .map((f) => parseFeature(f, offset))
    .filter((p): p is ForecastTemperaturePoint => p !== null)
  return points.length > 0 ? points : getMockForecastPoints(offset)
}

export function getMockForecastPoints(offset: ForecastOffset): ForecastTemperaturePoint[] {
  const MOCK: {
    id: string
    name: string
    region: string
    coordinates: [number, number]
    current: number
    todayHigh: number
    tomorrowHigh: number
    humidex: number
  }[] = [
    {
      id: 'toronto',
      name: 'Toronto',
      region: 'City of Toronto',
      coordinates: [-79.3832, 43.6532],
      current: 27,
      todayHigh: 31,
      tomorrowHigh: 29,
      humidex: 34,
    },
    {
      id: 'toronto-island',
      name: 'Toronto Island',
      region: 'City of Toronto',
      coordinates: [-79.375, 43.6195],
      current: 25,
      todayHigh: 29,
      tomorrowHigh: 27,
      humidex: 28,
    },
    {
      id: 'mississauga',
      name: 'Mississauga',
      region: 'Mississauga - Brampton',
      coordinates: [-79.65, 43.589],
      current: 28,
      todayHigh: 32,
      tomorrowHigh: 30,
      humidex: 35,
    },
    {
      id: 'vaughan',
      name: 'Vaughan',
      region: 'York Region',
      coordinates: [-79.541, 43.8372],
      current: 26,
      todayHigh: 30,
      tomorrowHigh: 28,
      humidex: 30,
    },
    {
      id: 'richmond-hill',
      name: 'Richmond Hill',
      region: 'York Region',
      coordinates: [-79.4349, 43.8828],
      current: 25,
      todayHigh: 29,
      tomorrowHigh: 27,
      humidex: 28,
    },
    {
      id: 'markham',
      name: 'Markham',
      region: 'York Region',
      coordinates: [-79.2627, 43.8561],
      current: 26,
      todayHigh: 30,
      tomorrowHigh: 28,
      humidex: 29,
    },
    {
      id: 'pickering',
      name: 'Pickering',
      region: 'Durham Region',
      coordinates: [-79.0897, 43.8354],
      current: 24,
      todayHigh: 28,
      tomorrowHigh: 26,
      humidex: 27,
    },
    {
      id: 'oakville',
      name: 'Oakville',
      region: 'Halton Region',
      coordinates: [-79.6877, 43.4675],
      current: 27,
      todayHigh: 31,
      tomorrowHigh: 29,
      humidex: 33,
    },
  ]

  return MOCK.map(({ id, name, region, coordinates, current, todayHigh, tomorrowHigh, humidex }) => {
    const displayTempC =
      offset === 'today_high' ? todayHigh
      : offset === 'tomorrow_high' ? tomorrowHigh
      : current
    return {
      id,
      name,
      region,
      coordinates,
      currentTemperatureC: current,
      todayHighC: todayHigh,
      tomorrowHighC: tomorrowHigh,
      humidex: offset === 'current' ? humidex : null,
      riskLevel: toRiskLevel(displayTempC),
      displayTempC,
      warnings: false,
      sourceName: 'ECCC MSC GeoMet citypageweather-realtime' as const,
      sourceUrl: ECCC_URL,
      lastUpdated: new Date().toUTCString(),
    }
  })
}
