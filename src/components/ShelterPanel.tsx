import { useAppStore } from '../store'
import type { Shelter } from '../types'

const TYPE_LABELS: Record<Shelter['type'], string> = {
  shelter: 'Shelter',
  cooling_center: 'Cooling Center',
  warming_center: 'Warming Center',
  resilience_hub: 'Resilience Hub',
}

const TYPE_COLORS: Record<Shelter['type'], string> = {
  shelter: 'bg-blue-900 text-blue-300',
  cooling_center: 'bg-cyan-900 text-cyan-300',
  warming_center: 'bg-orange-900 text-orange-300',
  resilience_hub: 'bg-purple-900 text-purple-300',
}

const GRID_CONFIG: Record<Shelter['gridStatus'], { label: string; color: string; dot: string }> = {
  online:   { label: 'Online',   color: 'text-green-400',  dot: 'bg-green-400'  },
  unstable: { label: 'Unstable', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  outage:   { label: 'Outage',   color: 'text-red-400',    dot: 'bg-red-400'    },
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Section({ title, titleColor = 'text-gray-400', children }: {
  title: string
  titleColor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${titleColor}`}>{title}</p>
      {children}
    </div>
  )
}

function ShelterDetails({ shelter }: { shelter: Shelter }) {
  const occupancyPct = Math.min(100, Math.round((shelter.occupancy / shelter.capacity) * 100))
  const scoreColor = shelter.resilienceScore >= 70 ? 'text-green-400' : shelter.resilienceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreBarColor = shelter.resilienceScore >= 70 ? 'bg-green-500' : shelter.resilienceScore >= 40 ? 'bg-yellow-400' : 'bg-red-500'
  const occupancyBarColor = occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 85 ? 'bg-yellow-400' : 'bg-green-500'
  const grid = GRID_CONFIG[shelter.gridStatus]
  const runtimeColor = shelter.estimatedRuntimeHours >= 24 ? 'text-green-400' : shelter.estimatedRuntimeHours >= 8 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col gap-4">
      {/* Resilience Score */}
      <Section title="Resilience Score">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-500 text-xs">0 – 100</span>
          <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>{shelter.resilienceScore}</span>
        </div>
        <Bar pct={shelter.resilienceScore} color={scoreBarColor} />
      </Section>

      {/* Capacity */}
      <Section title="Capacity">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-300 text-sm">{shelter.occupancy} / {shelter.capacity} occupied</span>
          <span className="text-gray-500 text-xs">{occupancyPct}%</span>
        </div>
        <Bar pct={occupancyPct} color={occupancyBarColor} />
      </Section>

      {/* Energy */}
      <Section title="Energy">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${grid.dot}`} />
            <span className="text-gray-400">Grid:</span>
            <span className={grid.color}>{grid.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 bg-gray-600" />
            <span className="text-gray-400">Generator:</span>
            <span className="text-gray-300">
              {shelter.generator === 'none' ? 'None' : shelter.generator === 'manual' ? 'Manual' : 'Automatic'}
              {shelter.generatorFuelType ? ` · ${shelter.generatorFuelType}` : ''}
            </span>
          </div>
          {shelter.batteryKWh > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-gray-600" />
              <span className="text-gray-400">Battery:</span>
              <span className="text-gray-300">
                {shelter.batteryKWh} kWh{shelter.batterySOC !== undefined ? ` (${shelter.batterySOC}%)` : ''}
              </span>
            </div>
          )}
          {shelter.solarKW > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-gray-600" />
              <span className="text-gray-400">Solar:</span>
              <span className="text-gray-300">{shelter.solarKW} kW</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 bg-gray-600" />
            <span className="text-gray-400">Backup runtime:</span>
            <span className={`font-medium ${runtimeColor}`}>{shelter.estimatedRuntimeHours}h</span>
          </div>
        </div>
      </Section>

      {/* Services */}
      {shelter.services.length > 0 && (
        <Section title="Services">
          <div className="flex flex-wrap gap-1.5">
            {shelter.services.map((s) => (
              <span key={s} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Requests */}
      {shelter.requests.length > 0 && (
        <Section title="Needs Support" titleColor="text-yellow-400">
          <div className="flex flex-col gap-1">
            {shelter.requests.map((r) => (
              <p key={r} className="text-sm text-yellow-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">!</span>
                {r}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* Reports */}
      {shelter.reports.length > 0 && (
        <Section title="Reports" titleColor="text-red-400">
          <div className="flex flex-col gap-1">
            {shelter.reports.map((r) => (
              <p key={r} className="text-sm text-red-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">·</span>
                {r}
              </p>
            ))}
          </div>
        </Section>
      )}

      {/* Source */}
      <div className="pt-2 border-t border-gray-800">
        <p className="text-gray-600 text-xs leading-relaxed">
          {shelter.sourceName}
          {shelter.lastUpdated ? ` · ${shelter.lastUpdated}` : ''}
        </p>
      </div>
    </div>
  )
}

export default function ShelterPanel() {
  const { shelters, selectedShelterId, selectShelter } = useAppStore()
  const shelter = shelters.find((s) => s.id === selectedShelterId)

  if (!shelter) return null

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl overflow-y-auto z-10 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-4 py-3 z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1.5 ${TYPE_COLORS[shelter.type]}`}>
              {TYPE_LABELS[shelter.type]}
            </span>
            <h2 className="text-white font-semibold text-sm leading-snug">{shelter.name}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{shelter.address}, {shelter.city}</p>
          </div>
          <button
            onClick={() => selectShelter(null)}
            className="text-gray-500 hover:text-white transition-colors shrink-0 p-1 -mr-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-4 py-4 flex-1">
        <ShelterDetails shelter={shelter} />
      </div>
    </div>
  )
}
