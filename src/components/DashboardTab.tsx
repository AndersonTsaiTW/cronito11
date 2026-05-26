import { useAppStore } from '../store'

export default function DashboardTab() {
  const { shelters } = useAppStore()

  const stats = {
    totalShelters: shelters.length,
    atCapacity: shelters.filter(s => (s.occupancy / s.capacity) >= 1).length,
    activeOutages: shelters.filter(s => s.gridStatus === 'outage').length,
    avgResilienceScore: Math.round(
      shelters.reduce((sum, s) => sum + s.resilienceScore, 0) / shelters.length
    ),
    totalOccupancy: shelters.reduce((sum, s) => sum + s.occupancy, 0),
    totalCapacity: shelters.reduce((sum, s) => sum + s.capacity, 0),
    avgRuntimeHours: Math.round(
      shelters.reduce((sum, s) => sum + s.estimatedRuntimeHours, 0) / shelters.length
    ),
  }

  const occupancyPct = Math.round((stats.totalOccupancy / stats.totalCapacity) * 100)

  return (
    <div className="pt-6 pb-32 px-6 h-screen overflow-y-auto bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Shelter Resilience Dashboard</h1>
        <p className="text-gray-400 mb-8">Real-time overview of shelter capacity, energy, and resilience</p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Shelters"
            value={stats.totalShelters}
            icon="🏢"
          />
          <MetricCard
            label="At Capacity"
            value={stats.atCapacity}
            color="text-red-400"
            icon="⚠️"
          />
          <MetricCard
            label="Active Outages"
            value={stats.activeOutages}
            color={stats.activeOutages > 0 ? 'text-red-400' : 'text-green-400'}
            icon="⚡"
          />
          <MetricCard
            label="Avg Resilience Score"
            value={`${stats.avgResilienceScore}%`}
            color={stats.avgResilienceScore >= 70 ? 'text-green-400' : stats.avgResilienceScore >= 40 ? 'text-yellow-400' : 'text-red-400'}
            icon="📈"
          />
        </div>

        {/* Occupancy Overview */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Shelter Occupancy</h2>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-5xl font-bold text-blue-400 mb-2">
                {stats.totalOccupancy}
              </div>
              <p className="text-gray-400">
                of {stats.totalCapacity} people
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    occupancyPct >= 100
                      ? 'bg-red-500'
                      : occupancyPct >= 85
                      ? 'bg-yellow-400'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, occupancyPct)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{occupancyPct}% capacity</p>
            </div>
          </div>
        </div>

        {/* Energy Resilience */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">⚡ Energy Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">With Active Generators</span>
                <span className="text-green-400 font-bold">
                  {shelters.filter(s => s.generator !== 'none').length}/{stats.totalShelters}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">With Battery Storage</span>
                <span className="text-blue-400 font-bold">
                  {shelters.filter(s => s.batteryKWh > 0).length}/{stats.totalShelters}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">With Solar</span>
                <span className="text-yellow-400 font-bold">
                  {shelters.filter(s => s.solarKW > 0).length}/{stats.totalShelters}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                <span className="text-gray-400">Avg Runtime (no grid)</span>
                <span className="text-purple-400 font-bold">{stats.avgRuntimeHours}h</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">🔧 Services Available</h3>
            <div className="space-y-3">
              <ServiceBadge icon="❄️" label="Cooling" count={shelters.filter(s => s.cooling).length} total={stats.totalShelters} />
              <ServiceBadge icon="🔥" label="Heating" count={shelters.filter(s => s.heating).length} total={stats.totalShelters} />
              <ServiceBadge icon="🔌" label="Device Charging" count={shelters.filter(s => s.charging).length} total={stats.totalShelters} />
              <ServiceBadge icon="⚕️" label="Medical Support" count={shelters.filter(s => s.medicalSupport).length} total={stats.totalShelters} />
            </div>
          </div>
        </div>

        {/* Active Issues */}
        <div className="mt-8 bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">🚨 Active Issues</h3>
          {stats.activeOutages > 0 || stats.atCapacity > 0 ? (
            <div className="space-y-2">
              {stats.activeOutages > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-900/30 rounded border border-red-700">
                  <span className="text-red-400 text-lg">⚡</span>
                  <span className="text-gray-300">{stats.activeOutages} shelter{stats.activeOutages > 1 ? 's' : ''} experiencing power outages</span>
                </div>
              )}
              {stats.atCapacity > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-900/30 rounded border border-yellow-700">
                  <span className="text-yellow-400 text-lg">⚠️</span>
                  <span className="text-gray-300">{stats.atCapacity} shelter{stats.atCapacity > 1 ? 's' : ''} at or near capacity</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-green-400">✓ All systems operating normally</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  color = 'text-white',
  icon,
}: {
  label: string
  value: string | number
  color?: string
  icon: string
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ServiceBadge({
  icon,
  label,
  count,
  total,
}: {
  icon: string
  label: string
  count: number
  total: number
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-gray-300">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-blue-400 font-bold">{count}/{total}</span>
    </div>
  )
}
