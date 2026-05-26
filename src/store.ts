import { create } from 'zustand'
import { shelters as initialShelters } from './data/shelters'
import type { LayerId, Shelter } from './types'

type TabType = 'map' | 'profile' | 'reports' | 'dashboard'

interface AppState {
  visibleLayers: Record<LayerId, boolean>
  shelters: Shelter[]
  selectedShelterId: string | null
  activeTab: TabType
  toggleLayer: (id: LayerId) => void
  setShelters: (shelters: Shelter[]) => void
  selectShelter: (id: string | null) => void
  setActiveTab: (tab: TabType) => void
}

export const useAppStore = create<AppState>((set) => ({
  visibleLayers: {
    heat: false,
    flood: false,
    outage: false,
    grid_stress: false,
    social_vulnerability: false,
    older_adults: false,
  },
  shelters: initialShelters,
  selectedShelterId: null,
  activeTab: 'map',
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
}))
