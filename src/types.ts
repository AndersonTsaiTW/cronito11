export type Shelter = {
  id: string
  name: string
  type: 'shelter' | 'cooling_center' | 'warming_center' | 'resilience_hub'
  address: string
  city: string
  stateProvince: string
  coordinates: [number, number] // [longitude, latitude]
  capacity: number
  occupancy: number
  gridStatus: 'online' | 'unstable' | 'outage'
  generator: 'none' | 'manual' | 'automatic'
  generatorFuelType?: 'diesel' | 'natural_gas' | 'propane'
  fuelHoursRemaining?: number
  batteryKWh: number
  batterySOC?: number
  solarKW: number
  estimatedRuntimeHours: number
  cooling: boolean
  heating: boolean
  charging: boolean
  medicalSupport: boolean
  water: boolean
  food: boolean
  accessible: boolean
  petsAllowed?: boolean
  services: string[]
  requests: string[]
  reports: string[]
  resilienceScore: number // computed by src/utils/scoring.ts
  sourceName: string
  sourceUrl: string
  lastUpdated?: string
}

export type LayerId =
  | 'heat'
  | 'flood'
  | 'outage'
  | 'grid_stress'
  | 'social_vulnerability'
  | 'older_adults'
  | 'forecast_temperature'

export type ForecastOffset = 'current' | 'today_high' | 'tomorrow_high'

export type ForecastTemperaturePoint = {
  id: string
  name: string
  region: string
  coordinates: [number, number]
  currentTemperatureC: number | null
  todayHighC: number | null
  tomorrowHighC: number | null
  humidex: number | null
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  displayTempC: number | null
  warnings: boolean
  sourceName: 'ECCC MSC GeoMet citypageweather-realtime'
  sourceUrl: string
  lastUpdated: string
}

export type RiskLayerFeatureProperties = {
  id: string
  type: LayerId
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  label: string
  sourceName: string
  sourceUrl: string
  lastUpdated?: string
}

export type RiskLayer = GeoJSON.FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  RiskLayerFeatureProperties
>
