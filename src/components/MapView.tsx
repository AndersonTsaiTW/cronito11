import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAppStore } from '../store'
import { fetchForecastPoints, rederiveForecastPoints } from '../services/weather'
import type { ForecastTemperaturePoint, Shelter } from '../types'

const TORONTO_CENTER: [number, number] = [-79.3832, 43.6532]
const INITIAL_ZOOM = 11

const RISK_BORDER: Record<string, string> = {
  extreme: '#ef4444',
  high: '#f97316',
  medium: '#fbbf24',
  low: '#34d399',
}

function getShelterStatusColor(shelter: Shelter) {
  const occupancyRate = shelter.occupancy / shelter.capacity
  if (shelter.gridStatus === 'outage' || occupancyRate >= 1) return '#ef4444'
  if (shelter.requests.length > 0) return '#38bdf8'
  if (shelter.gridStatus === 'unstable' || occupancyRate >= 0.85) return '#f59e0b'
  return '#22c55e'
}

function buildTempBadgeEl(p: ForecastTemperaturePoint): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = 'temp-badge'
  el.style.setProperty('--badge-color', RISK_BORDER[p.riskLevel] ?? '#6b7280')
  el.setAttribute('aria-label', `${p.name} ${p.displayTempC ?? '—'}°C`)

  const city = document.createElement('span')
  city.className = 'temp-badge__city'
  city.textContent = p.name

  const temp = document.createElement('span')
  temp.className = 'temp-badge__temp'
  temp.textContent = p.displayTempC != null ? `${Math.round(p.displayTempC)}°` : '—'

  if (p.warnings) {
    const warn = document.createElement('span')
    warn.className = 'temp-badge__warn'
    warn.textContent = '⚠'
    el.appendChild(warn)
  }

  el.appendChild(city)
  el.appendChild(temp)
  return el
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const shelterMarkersRef = useRef<mapboxgl.Marker[]>([])
  const weatherMarkersRef = useRef<mapboxgl.Marker[]>([])
  const weatherPopupRef = useRef<mapboxgl.Popup | null>(null)
  const hasFetchedWeatherRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)

  const {
    shelters,
    selectedShelterId,
    selectShelter,
    visibleLayers,
    forecastPoints,
    forecastOffset,
    setForecastPoints,
  } = useAppStore()

  // Map init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: TORONTO_CENTER,
      zoom: INITIAL_ZOOM,
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current.on('load', () => setMapReady(true))
    return () => {
      shelterMarkersRef.current.forEach((m) => m.remove())
      shelterMarkersRef.current = []
      weatherMarkersRef.current.forEach((m) => m.remove())
      weatherMarkersRef.current = []
      weatherPopupRef.current?.remove()
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Load GeoJSON polygon risk layers once map is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    fetch('/layers/flood.geojson')
      .then((r) => r.json())
      .then((data) => {
        if (!mapRef.current || map.getSource('flood')) return
        const vis = useAppStore.getState().visibleLayers.flood ? 'visible' : 'none'
        map.addSource('flood', { type: 'geojson', data })
        map.addLayer({
          id: 'flood-fill',
          type: 'fill',
          source: 'flood',
          layout: { visibility: vis },
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.35 },
        })
        map.addLayer({
          id: 'flood-line',
          type: 'line',
          source: 'flood',
          layout: { visibility: vis },
          paint: { 'line-color': '#60a5fa', 'line-width': 0.8, 'line-opacity': 0.7 },
        })
      })
      .catch((err) => console.warn('Flood layer load failed:', err))

    fetch('/layers/community-need.geojson')
      .then((r) => r.json())
      .then((data) => {
        if (!mapRef.current || map.getSource('community-need')) return
        const vis = useAppStore.getState().visibleLayers

        map.addSource('community-need', { type: 'geojson', data })

        map.addLayer({
          id: 'community-need-fill',
          type: 'fill',
          source: 'community-need',
          layout: { visibility: vis.social_vulnerability ? 'visible' : 'none' },
          paint: {
            'fill-color': [
              'match',
              ['get', 'riskLevel'],
              'low', '#4ade80',
              'medium', '#fbbf24',
              'high', '#f97316',
              'extreme', '#ef4444',
              '#6b7280',
            ] as unknown as mapboxgl.FillPaint['fill-color'],
            'fill-opacity': 0.45,
          },
        })
        map.addLayer({
          id: 'community-need-line',
          type: 'line',
          source: 'community-need',
          layout: { visibility: vis.social_vulnerability ? 'visible' : 'none' },
          paint: { 'line-color': '#9ca3af', 'line-width': 0.5, 'line-opacity': 0.5 },
        })

        map.addLayer({
          id: 'older-adults-fill',
          type: 'fill',
          source: 'community-need',
          layout: { visibility: vis.older_adults ? 'visible' : 'none' },
          paint: {
            'fill-color': [
              'step',
              ['get', 'olderAdultsShare'],
              '#4ade80', 12,
              '#fbbf24', 18,
              '#f97316', 24,
              '#ef4444',
            ] as unknown as mapboxgl.FillPaint['fill-color'],
            'fill-opacity': 0.45,
          },
        })
        map.addLayer({
          id: 'older-adults-line',
          type: 'line',
          source: 'community-need',
          layout: { visibility: vis.older_adults ? 'visible' : 'none' },
          paint: { 'line-color': '#d1d5db', 'line-width': 0.5, 'line-opacity': 0.5 },
        })
      })
      .catch((err) => console.warn('Community Need layer load failed:', err))
  }, [mapReady])

  // Sync polygon layer visibility
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    const setVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      }
    }

    setVis('flood-fill', visibleLayers.flood)
    setVis('flood-line', visibleLayers.flood)
    setVis('community-need-fill', visibleLayers.social_vulnerability)
    setVis('community-need-line', visibleLayers.social_vulnerability)
    setVis('older-adults-fill', visibleLayers.older_adults)
    setVis('older-adults-line', visibleLayers.older_adults)
  }, [mapReady, visibleLayers])

  // Show/hide weather badge markers when toggle changes
  useEffect(() => {
    weatherMarkersRef.current.forEach((m) => {
      const el = m.getElement()
      el.style.display = visibleLayers.forecast_temperature ? '' : 'none'
    })
  }, [visibleLayers.forecast_temperature])

  // Fetch weather when layer turns on for the first time, or offset changes
  useEffect(() => {
    if (!mapReady) return
    if (!visibleLayers.forecast_temperature && !hasFetchedWeatherRef.current) return

    const load = hasFetchedWeatherRef.current
      ? rederiveForecastPoints(forecastOffset)
      : fetchForecastPoints(forecastOffset)

    hasFetchedWeatherRef.current = true
    load.then(setForecastPoints).catch(console.error)
  }, [mapReady, visibleLayers.forecast_temperature, forecastOffset, setForecastPoints])

  // Rebuild weather badge HTML markers whenever forecastPoints changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || forecastPoints.length === 0) return

    // Remove old markers
    weatherMarkersRef.current.forEach((m) => m.remove())
    weatherMarkersRef.current = []

    weatherMarkersRef.current = forecastPoints.map((p) => {
      const el = buildTempBadgeEl(p)
      const isVisible = useAppStore.getState().visibleLayers.forecast_temperature
      if (!isVisible) el.style.display = 'none'

      el.addEventListener('click', () => {
        weatherPopupRef.current?.remove()
        weatherPopupRef.current = new mapboxgl.Popup({ offset: [0, -8], className: 'weather-popup' })
          .setLngLat(p.coordinates)
          .setHTML(buildWeatherPopupHtml(p))
          .addTo(mapRef.current!)
      })

      return new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(p.coordinates)
        .addTo(mapRef.current!)
    })
  }, [mapReady, forecastPoints])

  // Shelter markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    shelterMarkersRef.current.forEach((m) => m.remove())
    shelterMarkersRef.current = shelters.map((shelter) => {
      const isSelected = shelter.id === selectedShelterId
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `shelter-marker${isSelected ? ' shelter-marker--selected' : ''}`
      el.style.setProperty('--marker-color', getShelterStatusColor(shelter))
      el.title = `${shelter.name} - ${shelter.occupancy}/${shelter.capacity} occupied`
      el.setAttribute('aria-label', `Select ${shelter.name}`)
      const inner = document.createElement('span')
      inner.className = 'shelter-marker__inner'
      el.appendChild(inner)
      el.addEventListener('click', () => selectShelter(shelter.id))
      return new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(shelter.coordinates)
        .addTo(mapRef.current!)
    })
  }, [mapReady, shelters, selectedShelterId, selectShelter])

  return <div ref={containerRef} className="w-full h-full" />
}

function buildWeatherPopupHtml(p: ForecastTemperaturePoint): string {
  const fmt = (v: number | null) => (v != null ? `${v}°C` : '—')
  const warnBadge = p.warnings
    ? `<span style="color:#f97316;font-weight:600;">⚠ Weather warning active</span><br/>`
    : ''
  return `
    <div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.55;color:#1f2937;min-width:190px">
      <div style="font-weight:700;font-size:15px;margin-bottom:2px">${p.name}</div>
      <div style="color:#6b7280;font-size:12px;margin-bottom:8px">${p.region}</div>
      ${warnBadge}
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="color:#6b7280;padding:1px 8px 1px 0">Current</td><td style="font-weight:600">${fmt(p.currentTemperatureC)}</td></tr>
        ${p.humidex != null ? `<tr><td style="color:#6b7280;padding:1px 8px 1px 0">Humidex</td><td style="font-weight:600">${fmt(p.humidex)}</td></tr>` : ''}
        <tr><td style="color:#6b7280;padding:1px 8px 1px 0">Today high</td><td style="font-weight:600">${fmt(p.todayHighC)}</td></tr>
        <tr><td style="color:#6b7280;padding:1px 8px 1px 0">Tomorrow high</td><td style="font-weight:600">${fmt(p.tomorrowHighC)}</td></tr>
      </table>
      <div style="margin-top:8px;font-size:11px;color:#9ca3af">
        Updated: ${p.lastUpdated}<br/>
        Source: <a href="${p.sourceUrl}" target="_blank" rel="noopener" style="color:#60a5fa">ECCC MSC GeoMet</a>
      </div>
    </div>
  `
}
