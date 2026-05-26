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
  const { shelters, selectedShelterId, selectShelter } = useAppStore()

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
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = shelters.map((shelter) => {
      const isSelected = shelter.id === selectedShelterId
      const markerElement = document.createElement('button')
      markerElement.type = 'button'
      markerElement.className = `shelter-marker${isSelected ? ' shelter-marker--selected' : ''}`
      markerElement.style.setProperty('--marker-color', getShelterStatusColor(shelter))
      markerElement.title = `${shelter.name} - ${shelter.occupancy}/${shelter.capacity} occupied`
      markerElement.setAttribute('aria-label', `Select ${shelter.name}`)

      const markerInner = document.createElement('span')
      markerInner.className = 'shelter-marker__inner'
      markerElement.appendChild(markerInner)

      markerElement.addEventListener('click', () => {
        selectShelter(shelter.id)
      })

      return new mapboxgl.Marker({ element: markerElement, anchor: 'center' })
        .setLngLat(shelter.coordinates)
        .addTo(mapRef.current!)
    })
  }, [mapReady, shelters, selectedShelterId, selectShelter])

  return <div ref={containerRef} className="w-full h-full" />
}
