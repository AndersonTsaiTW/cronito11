import { create } from 'zustand'
import { shelters as initialShelters } from './data/shelters'
import type { ForecastOffset, ForecastTemperaturePoint, LayerId, Shelter } from './types'

type TabType = 'map' | 'profile' | 'reports' | 'dashboard'
type UserRole = 'shelter_manager' | 'user' | null

interface UserLocation {
  latitude: number
  longitude: number
}

interface AppState {
  // Auth/User
  userRole: UserRole
  setUserRole: (role: 'shelter_manager' | 'user') => void

  // Shelters
  visibleLayers: Record<LayerId, boolean>
  shelters: Shelter[]
  selectedShelterId: string | null
  activeTab: TabType
  forecastPoints: ForecastTemperaturePoint[]
  forecastOffset: ForecastOffset
  userLocation: UserLocation | null
  recommendedShelterId: string | null

  // Filters
  filterOccupancy: 'all' | 'available' | 'full'
  filterPower: 'all' | 'online' | 'unstable' | 'outage'
  filterServices: string[]

  // Methods
  toggleLayer: (id: LayerId) => void
  setShelters: (shelters: Shelter[]) => void
  selectShelter: (id: string | null) => void
  setActiveTab: (tab: TabType) => void
  setForecastPoints: (points: ForecastTemperaturePoint[]) => void
  setForecastOffset: (offset: ForecastOffset) => void
  setUserLocation: (location: UserLocation | null) => void
  setRecommendedShelter: (id: string | null) => void
  setFilterOccupancy: (filter: 'all' | 'available' | 'full') => void
  setFilterPower: (filter: 'all' | 'online' | 'unstable' | 'outage') => void
  setFilterServices: (services: string[]) => void
  clearFilters: () => void
  addReport: (shelterId: string, message: string) => void
  addRequest: (shelterId: string, message: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  userRole: null,
  setUserRole: (role) => set({ userRole: role }),

  visibleLayers: {
    heat: false,
    flood: false,
    outage: false,
    grid_stress: false,
    social_vulnerability: false,
    older_adults: false,
    forecast_temperature: false,
  },
  shelters: initialShelters,
  selectedShelterId: null,
  activeTab: 'map',
  forecastPoints: [],
  forecastOffset: 'current',
  userLocation: null,
  recommendedShelterId: null,
  filterOccupancy: 'all',
  filterPower: 'all',
  filterServices: [],

  toggleLayer: (id) =>
    set((state) => ({
      visibleLayers: {
        ...state.visibleLayers,
        [id]: !state.visibleLayers[id],
      },
    })),
  setShelters: (shelters) => set({ shelters }),
  selectShelter: (id) => set({ selectedShelterId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setForecastPoints: (points) => set({ forecastPoints: points }),
  setForecastOffset: (offset) => set({ forecastOffset: offset }),
  setUserLocation: (location) => set({ userLocation: location }),
  setRecommendedShelter: (id) => set({ recommendedShelterId: id }),
  setFilterOccupancy: (filter) => set({ filterOccupancy: filter }),
  setFilterPower: (filter) => set({ filterPower: filter }),
  setFilterServices: (services) => set({ filterServices: services }),
  clearFilters: () =>
    set({
      filterOccupancy: 'all',
      filterPower: 'all',
      filterServices: [],
    }),
  addReport: (shelterId, message) =>
    set((state) => ({
      shelters: state.shelters.map((shelter) =>
        shelter.id === shelterId
          ? { ...shelter, reports: [...shelter.reports, message] }
          : shelter
      ),
    })),
  addRequest: (shelterId, message) =>
    set((state) => ({
      shelters: state.shelters.map((shelter) =>
        shelter.id === shelterId
          ? { ...shelter, requests: [...shelter.requests, message] }
          : shelter
      ),
    })),
}))
