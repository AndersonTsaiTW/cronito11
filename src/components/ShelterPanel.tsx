import { useState } from 'react'
import { useAppStore } from '../store'
import type { Shelter } from '../types'

const TYPE_ICONS: Record<Shelter['type'], string> = {
  shelter: '🏢',
  cooling_center: '❄️',
  warming_center: '🔥',
  resilience_hub: '⚡',
}

const GRID_CONFIG: Record<Shelter['gridStatus'], { label: string; color: string; dot: string }> = {
  online:   { label: 'Online',   color: 'text-green-400',  dot: 'bg-green-400'  },
  unstable: { label: 'Unstable', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  outage:   { label: 'Outage',   color: 'text-red-400',    dot: 'bg-red-400'    },
}

export default function ShelterPanel() {
  const { selectedShelterId, selectShelter, shelters } = useAppStore()
  const [showFullDetails, setShowFullDetails] = useState(false)

  const shelter = selectedShelterId ? shelters.find(s => s.id === selectedShelterId) : null

  if (!shelter) return null

  const occupancyPct = Math.min(100, Math.round((shelter.occupancy / shelter.capacity) * 100))
  const grid = GRID_CONFIG[shelter.gridStatus]

  const isAtCapacity = occupancyPct >= 100
  const hasOutage = shelter.gridStatus === 'outage'
  const hasRequests = shelter.requests.length > 0

  return (
    <>
      {/* Floating Card - Bottom-Right (Waze-style) */}
      <div className="fixed bottom-28 right-6 z-10 w-96 max-w-[calc(100vw-48px)]">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-4xl">{TYPE_ICONS[shelter.type]}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-lg leading-tight">{shelter.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{shelter.address}</p>
              </div>
            </div>
            <button
              onClick={() => selectShelter(null)}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Quick Stats */}
          <div className="px-6 py-4 space-y-3 border-b border-gray-700">
            {/* Occupancy */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Occupancy</span>
                <span className={`text-lg font-bold ${
                  occupancyPct >= 100 ? 'text-red-400' : occupancyPct >= 85 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {shelter.occupancy}/{shelter.capacity}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 85 ? 'bg-yellow-400' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, occupancyPct)}%` }}
                />
              </div>
            </div>

            {/* Grid & Resilience */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-750 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">⚡ Grid</p>
                <p className={`font-bold ${grid.color}`}>{grid.label}</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">📈 Resilience</p>
                <p className={`font-bold ${
                  shelter.resilienceScore >= 70 ? 'text-green-400' : 
                  shelter.resilienceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{shelter.resilienceScore}</p>
              </div>
            </div>
          </div>

          {/* Status Alerts */}
          {(hasOutage || isAtCapacity || hasRequests) && (
            <div className="px-6 py-3 space-y-2 border-b border-gray-700 bg-gray-850">
              {hasOutage && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <span>⚡</span>
                  <span className="font-medium">Power outage</span>
                </div>
              )}
              {isAtCapacity && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <span>🚫</span>
                  <span className="font-medium">At full capacity</span>
                </div>
              )}
              {hasRequests && (
                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                  <span>🆘</span>
                  <span className="font-medium">{shelter.requests.length} active request(s)</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 py-3 space-y-2">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>ℹ️</span>
              {showFullDetails ? 'Hide Details' : 'View Full Details'}
            </button>
            <button className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-600/50">
              <span>📋</span>
              Report Issue
            </button>
            <button className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-cyan-600/50">
              <span>✏️</span>
              Share Update
            </button>
          </div>
        </div>
      </div>

      {/* Full Details Modal */}
      {showFullDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4 flex items-center justify-between border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{shelter.name}</h2>
              <button
                onClick={() => setShowFullDetails(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Energy Info */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">⚡ Energy Infrastructure</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase mb-2">Generator</p>
                    <p className="font-bold text-white">
                      {shelter.generator === 'none' ? 'None' : 
                       shelter.generator === 'manual' ? 'Manual' : 'Automatic'}
                    </p>
                    {shelter.generatorFuelType && (
                      <p className="text-sm text-gray-400 mt-1">
                        {shelter.generatorFuelType} · {shelter.fuelHoursRemaining}h fuel
                      </p>
                    )}
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase mb-2">Battery</p>
                    <p className="font-bold text-white">{shelter.batteryKWh} kWh</p>
                    {shelter.batterySOC && (
                      <p className="text-sm text-gray-400 mt-1">{shelter.batterySOC}% charged</p>
                    )}
                  </div>
                  {shelter.solarKW > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-xs text-gray-400 uppercase mb-2">Solar</p>
                      <p className="font-bold text-white">{shelter.solarKW} kW</p>
                    </div>
                  )}
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase mb-2">Runtime</p>
                    <p className="font-bold text-white">{shelter.estimatedRuntimeHours}h</p>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">🔧 Services</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { emoji: '❄️', label: 'Cooling', value: shelter.cooling },
                    { emoji: '🔥', label: 'Heating', value: shelter.heating },
                    { emoji: '🔌', label: 'Charging', value: shelter.charging },
                    { emoji: '⚕️', label: 'Medical', value: shelter.medicalSupport },
                    { emoji: '💧', label: 'Water', value: shelter.water },
                    { emoji: '🍽️', label: 'Food', value: shelter.food },
                    { emoji: '♿', label: 'Accessible', value: shelter.accessible },
                    { emoji: '🐾', label: 'Pets', value: shelter.petsAllowed },
                  ].map((service) => (
                    <div
                      key={service.label}
                      className={`p-3 rounded-lg border text-center ${
                        service.value
                          ? 'bg-green-900/30 border-green-700'
                          : 'bg-gray-800 border-gray-700 opacity-40'
                      }`}
                    >
                      <p className="text-2xl mb-1">{service.emoji}</p>
                      <p className={`text-xs font-medium ${
                        service.value ? 'text-green-400' : 'text-gray-500'
                      }`}>
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
                    <div>
                      <h4 className="text-red-400 font-bold mb-2">🆘 Active Requests</h4>
                      <div className="space-y-2">
                        {shelter.requests.map((req, i) => (
                          <div key={i} className="bg-red-900/20 border border-red-700 rounded p-2 text-sm text-gray-200">
                            {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {shelter.reports.length > 0 && (
                    <div>
                      <h4 className="text-yellow-400 font-bold mb-2">📋 Recent Reports</h4>
                      <div className="space-y-2">
                        {shelter.reports.map((rep, i) => (
                          <div key={i} className="bg-yellow-900/20 border border-yellow-700 rounded p-2 text-sm text-gray-200">
                            {rep}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
