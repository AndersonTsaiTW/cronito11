import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useAppStore } from '../store'
import type { Shelter } from '../types'

const TORONTO_CENTER: [number, number] = [-79.3832, 43.6532]
const INITIAL_ZOOM = 11

function getShelterStatusColor(shelter: Shelter) {
  const occupancyRate = shelter.occupancy / shelter.capacity
  if (shelter.gridStatus === 'outage' || occupancyRate >= 1) return '#ef4444'
  if (shelter.requests.length > 0) return '#38bdf8'
  if (shelter.gridStatus === 'unstable' || occupancyRate >= 0.85) return '#f59e0b'
  return '#22c55e'
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const { shelters, selectedShelterId, selectShelter, visibleLayers } = useAppStore()

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
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Load GeoJSON risk layers once map is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current

    // Flood risk (TRCA flood plain)
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

    // Community Need Index + Older Adults 65+ (share same source)
    fetch('/layers/community-need.geojson')
      .then((r) => r.json())
      .then((data) => {
        if (!mapRef.current || map.getSource('community-need')) return
        const vis = useAppStore.getState().visibleLayers
        map.addSource('community-need', { type: 'geojson', data })

        // Community Need Index choropleth (green → yellow → orange → red)
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

        // Older Adults 65+ choropleth (thresholds: 12 / 18 / 24 %)
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

  // Sync layer visibility whenever toggles change
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

  // Shelter markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = shelters.map((shelter) => {
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
