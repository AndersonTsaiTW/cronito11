import { useAppStore } from '../store'

export default function QuickStats() {
  const { shelters } = useAppStore()

  const stats = {
    activeOutages: shelters.filter(s => s.gridStatus === 'outage').length,
    atCapacity: shelters.filter(s => (s.occupancy / s.capacity) >= 1).length,
    avgResilienceScore: Math.round(
      shelters.reduce((sum, s) => sum + s.resilienceScore, 0) / shelters.length
    ),
  }

  return (
    <div className="fixed top-4 right-20 z-10 backdrop-blur-md bg-gray-900/80 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-700">
        {/* Outages */}
        <div className="px-4 py-3 text-center hover:bg-gray-800/50 transition-colors cursor-help" title="Active power outages">
          <div className="text-lg font-bold">
            <span className={stats.activeOutages > 0 ? 'text-red-400' : 'text-green-400'}>
              ⚡
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Outages</div>
          <div className="text-sm font-bold text-white">{stats.activeOutages}</div>
        </div>

        {/* Capacity */}
        <div className="px-4 py-3 text-center hover:bg-gray-800/50 transition-colors cursor-help" title="Shelters at full capacity">
          <div className="text-lg font-bold">
            <span className={stats.atCapacity > 0 ? 'text-yellow-400' : 'text-green-400'}>
              🚫
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Full</div>
          <div className="text-sm font-bold text-white">{stats.atCapacity}</div>
        </div>

        {/* Resilience Score */}
        <div className="px-4 py-3 text-center hover:bg-gray-800/50 transition-colors cursor-help" title="Average resilience score">
          <div className="text-lg font-bold">
            <span className={
              stats.avgResilienceScore >= 70 ? 'text-green-400' :
              stats.avgResilienceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
            }>
              📈
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Health</div>
          <div className="text-sm font-bold text-white">{stats.avgResilienceScore}%</div>
        </div>
      </div>
    </div>
  )
}
