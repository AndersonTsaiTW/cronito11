import { useState } from 'react'
import { useAppStore } from '../store'
import type { LayerId } from '../types'

const LAYERS: { id: LayerId; label: string; color: string; info?: string }[] = [
  { id: 'heat', label: 'Heat Risk', color: 'bg-orange-500' },
  { id: 'flood', label: 'Flood Risk', color: 'bg-blue-500' },
  { id: 'outage', label: 'Power Outage', color: 'bg-yellow-400' },
  { id: 'grid_stress', label: 'Grid Stress', color: 'bg-purple-500' },
  {
    id: 'social_vulnerability',
    label: 'Community Need',
    color: 'bg-green-500',
    info: 'Demo composite score.\nSource: City of Toronto Neighbourhood Profiles 2021.\nFactors (each normalized 0–1, then averaged):\n• Children share\n• Older-adult share\n• Low-income rate\n• Unemployment rate\n• Tenant shelter cost burden rate',
  },
  { id: 'older_adults', label: 'Older Adults 65+', color: 'bg-pink-500' },
]

export default function LayerControls() {
  const { visibleLayers, toggleLayer } = useAppStore()
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-xl border border-gray-700 min-w-44">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
        Layers
      </p>
      <div className="flex flex-col gap-1">
        {LAYERS.map(({ id, label, color, info }) => (
          <div key={id} className="flex items-center gap-1">
            <button
              onClick={() => toggleLayer(id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors text-left flex-1 ${
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
            {info && (
              <div className="relative">
                <button
                  onMouseEnter={() => setTooltip(id)}
                  onMouseLeave={() => setTooltip(null)}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-200 hover:bg-gray-700 text-xs transition-colors"
                  aria-label={`Info about ${label}`}
                >
                  ℹ
                </button>
                {tooltip === id && (
                  <div className="absolute left-6 top-0 z-20 w-64 bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-2xl text-xs text-gray-200 whitespace-pre-line leading-relaxed">
                    {info}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
