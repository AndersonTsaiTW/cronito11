import { useAppStore } from '../store'
import type { Shelter } from '../types'

const TYPE_LABELS: Record<Shelter['type'], string> = {
  shelter: 'Shelter',
  cooling_center: 'Cooling Center',
  warming_center: 'Warming Center',
  resilience_hub: 'Resilience Hub',
}

const TYPE_ICONS: Record<Shelter['type'], string> = {
  shelter: '🏢',
  cooling_center: '❄️',
  warming_center: '🔥',
  resilience_hub: '⚡',
}

export default function ProfileTab() {
  const { shelters, selectedShelterId, selectShelter } = useAppStore()

  return (
    <div className="pt-6 pb-32 px-6 h-screen overflow-y-auto bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Shelter Directory</h1>
        <p className="text-gray-400 mb-6">Browse shelter profiles and energy capacity details</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shelter List */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">Shelters ({shelters.length})</h2>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {shelters.map((shelter) => (
                  <ShelterListItem
                    key={shelter.id}
                    shelter={shelter}
                    isSelected={selectedShelterId === shelter.id}
                    onClick={() => selectShelter(shelter.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Shelter Details */}
          <div className="lg:col-span-2">
            {selectedShelterId ? (
              <>
                {shelters
                  .filter((s) => s.id === selectedShelterId)
                  .map((shelter) => (
                    <ShelterDetailCard key={shelter.id} shelter={shelter} />
                  ))}
              </>
            ) : (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-gray-400 text-lg">Select a shelter to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShelterListItem({
  shelter,
  isSelected,
  onClick,
}: {
  shelter: Shelter
  isSelected: boolean
  onClick: () => void
}) {
  const occupancyPct = Math.round((shelter.occupancy / shelter.capacity) * 100)
  const occupancyColor =
    occupancyPct >= 100
      ? 'text-red-400'
      : occupancyPct >= 85
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-blue-900/40 border-blue-600 ring-2 ring-blue-500'
          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{TYPE_ICONS[shelter.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{shelter.name}</p>
          <p className="text-xs text-gray-400 truncate">{shelter.address}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Occupancy:</span>
          <span className={`font-bold ${occupancyColor}`}>{occupancyPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              occupancyPct >= 100
                ? 'bg-red-500'
                : occupancyPct >= 85
                ? 'bg-yellow-400'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, occupancyPct)}%` }}
          />
        </div>
      </div>
    </button>
  )
}

function ShelterDetailCard({ shelter }: { shelter: Shelter }) {
  const occupancyPct = Math.round((shelter.occupancy / shelter.capacity) * 100)
  const gridStatusColor =
    shelter.gridStatus === 'online'
      ? 'text-green-400'
      : shelter.gridStatus === 'unstable'
      ? 'text-yellow-400'
      : 'text-red-400'

  const gridStatusBg =
    shelter.gridStatus === 'online'
      ? 'bg-green-900/30'
      : shelter.gridStatus === 'unstable'
      ? 'bg-yellow-900/30'
      : 'bg-red-900/30'

  const resilienceColor =
    shelter.resilienceScore >= 70
      ? 'text-green-400'
      : shelter.resilienceScore >= 40
      ? 'text-yellow-400'
      : 'text-red-400'

  const runtimeColor =
    shelter.estimatedRuntimeHours >= 24
      ? 'text-green-400'
      : shelter.estimatedRuntimeHours >= 8
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-5xl">{TYPE_ICONS[shelter.type]}</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{shelter.name}</h2>
            <p className="text-gray-400 mb-2">{TYPE_LABELS[shelter.type]}</p>
            <p className="text-sm text-gray-500">{shelter.address}</p>
          </div>
        </div>
      </div>

      {/* Grid and Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-lg border p-6 ${gridStatusBg}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
            ⚡ Grid Status
          </h3>
          <p className={`text-2xl font-bold ${gridStatusColor}`}>
            {shelter.gridStatus.charAt(0).toUpperCase() + shelter.gridStatus.slice(1)}
          </p>
        </div>

        <div className="bg-blue-900/30 rounded-lg border border-blue-700 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
            📊 Occupancy
          </h3>
          <div className="mb-3">
            <p className="text-2xl font-bold text-blue-400 mb-1">
              {shelter.occupancy} / {shelter.capacity}
            </p>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  occupancyPct >= 100
                    ? 'bg-red-500'
                    : occupancyPct >= 85
                    ? 'bg-yellow-400'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, occupancyPct)}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-400">{occupancyPct}% capacity</p>
        </div>
      </div>

      {/* Resilience & Energy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-900/30 rounded-lg border border-purple-700 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
            📈 Resilience Score
          </h3>
          <p className={`text-4xl font-bold ${resilienceColor} mb-2`}>
            {shelter.resilienceScore}
          </p>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                shelter.resilienceScore >= 70
                  ? 'bg-green-500'
                  : shelter.resilienceScore >= 40
                  ? 'bg-yellow-400'
                  : 'bg-red-500'
              }`}
              style={{ width: `${shelter.resilienceScore}%` }}
            />
          </div>
        </div>

        <div className="bg-cyan-900/30 rounded-lg border border-cyan-700 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
            ⏱️ Runtime Without Grid
          </h3>
          <p className={`text-4xl font-bold ${runtimeColor}`}>
            {shelter.estimatedRuntimeHours}h
          </p>
          <p className="text-sm text-gray-400 mt-2">estimated with current battery & generator capacity</p>
        </div>
      </div>

      {/* Energy Details */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4">⚡ Energy Infrastructure</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase mb-2">Generator</p>
            <p className="text-white font-semibold">
              {shelter.generator === 'none'
                ? 'None'
                : shelter.generator === 'manual'
                ? 'Manual'
                : 'Automatic'}
            </p>
            {shelter.generatorFuelType && (
              <p className="text-sm text-gray-400 mt-1">
                {shelter.generatorFuelType} · {shelter.fuelHoursRemaining}h fuel
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-2">Battery Storage</p>
            <p className="text-white font-semibold">{shelter.batteryKWh} kWh</p>
            {shelter.batterySOC !== undefined && (
              <p className="text-sm text-gray-400 mt-1">
                {shelter.batterySOC}% charge
              </p>
            )}
          </div>
          {shelter.solarKW > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase mb-2">Solar Generation</p>
              <p className="text-white font-semibold">{shelter.solarKW} kW</p>
            </div>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4">🔧 Available Services</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '❄️', label: 'Cooling', available: shelter.cooling },
            { icon: '🔥', label: 'Heating', available: shelter.heating },
            { icon: '🔌', label: 'Device Charging', available: shelter.charging },
            { icon: '⚕️', label: 'Medical Support', available: shelter.medicalSupport },
            { icon: '💧', label: 'Water', available: shelter.water },
            { icon: '🍽️', label: 'Food', available: shelter.food },
            { icon: '♿', label: 'Accessible', available: shelter.accessible },
            { icon: '🐾', label: 'Pets Allowed', available: shelter.petsAllowed === true },
          ].map((service) => (
            <div
              key={service.label}
              className={`p-3 rounded-lg border text-center ${
                service.available
                  ? 'bg-green-900/30 border-green-700'
                  : 'bg-gray-800 border-gray-700 opacity-50'
              }`}
            >
              <p className="text-2xl mb-1">{service.icon}</p>
              <p className={`text-xs font-medium ${service.available ? 'text-green-400' : 'text-gray-400'}`}>
                {service.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Requests & Reports */}
      {(shelter.requests.length > 0 || shelter.reports.length > 0) && (
        <div className="space-y-4">
          {shelter.requests.length > 0 && (
            <div className="bg-red-900/20 rounded-lg border border-red-700 p-4">
              <h4 className="text-red-400 font-bold mb-2">🆘 Active Requests</h4>
              <ul className="space-y-1">
                {shelter.requests.map((req, i) => (
                  <li key={i} className="text-sm text-gray-200">• {req}</li>
                ))}
              </ul>
            </div>
          )}
          {shelter.reports.length > 0 && (
            <div className="bg-yellow-900/20 rounded-lg border border-yellow-700 p-4">
              <h4 className="text-yellow-400 font-bold mb-2">📋 Recent Reports</h4>
              <ul className="space-y-1">
                {shelter.reports.map((rep, i) => (
                  <li key={i} className="text-sm text-gray-200">• {rep}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
