import { create } from 'zustand'
import { shelters as initialShelters } from './data/shelters'
import type { LayerId, Shelter } from './types'

interface AppState {
  visibleLayers: Record<LayerId, boolean>
  shelters: Shelter[]
  selectedShelterId: string | null
  toggleLayer: (id: LayerId) => void
  setShelters: (shelters: Shelter[]) => void
  selectShelter: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  visibleLayers: {
    heat: false,
    flood: false,
    outage: false,
    grid_stress: false,
    social_vulnerability: false,
  },
  shelters: initialShelters,
  selectedShelterId: null,
  toggleLayer: (id) =>
    set((state) => ({
      visibleLayers: {
        ...state.visibleLayers,
        [id]: !state.visibleLayers[id],
      },
    })),
  setShelters: (shelters) => set({ shelters }),
  selectShelter: (id) => set({ selectedShelterId: id }),
}))
