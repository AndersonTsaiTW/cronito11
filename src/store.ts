import { create } from 'zustand'
import { shelters as initialShelters } from './data/shelters'
import type { ForecastOffset, ForecastTemperaturePoint, LayerId, Shelter } from './types'

interface AppState {
  visibleLayers: Record<LayerId, boolean>
  shelters: Shelter[]
  selectedShelterId: string | null
  forecastPoints: ForecastTemperaturePoint[]
  forecastOffset: ForecastOffset
  toggleLayer: (id: LayerId) => void
  setShelters: (shelters: Shelter[]) => void
  selectShelter: (id: string | null) => void
  setForecastPoints: (points: ForecastTemperaturePoint[]) => void
  setForecastOffset: (offset: ForecastOffset) => void
}

export const useAppStore = create<AppState>((set) => ({
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
  forecastPoints: [],
  forecastOffset: 'current',
  toggleLayer: (id) =>
    set((state) => ({
      visibleLayers: {
        ...state.visibleLayers,
        [id]: !state.visibleLayers[id],
      },
    })),
  setShelters: (shelters) => set({ shelters }),
  selectShelter: (id) => set({ selectedShelterId: id }),
  setForecastPoints: (points) => set({ forecastPoints: points }),
  setForecastOffset: (offset) => set({ forecastOffset: offset }),
}))
