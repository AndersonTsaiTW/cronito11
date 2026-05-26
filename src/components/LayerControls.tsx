import { useAppStore } from '../store'
import type { LayerId } from '../types'

const LAYERS: { id: LayerId; label: string; color: string }[] = [
  { id: 'heat', label: 'Heat Risk', color: 'bg-orange-500' },
  { id: 'flood', label: 'Flood Risk', color: 'bg-blue-500' },
  { id: 'outage', label: 'Power Outage', color: 'bg-yellow-400' },
  { id: 'grid_stress', label: 'Grid Stress', color: 'bg-purple-500' },
  { id: 'social_vulnerability', label: 'Community Need', color: 'bg-green-500' },
]

export default function LayerControls() {
  const { visibleLayers, toggleLayer } = useAppStore()

  return (
    <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700 min-w-44">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
        Layers
      </p>
      <div className="flex flex-col gap-1">
        {LAYERS.map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => toggleLayer(id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left w-full ${
              visibleLayers[id]
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${color} transition-opacity ${
                visibleLayers[id] ? 'opacity-100' : 'opacity-30'
              }`}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
