import { useState } from 'react'
import { useAppStore } from '../store'

export default function ReportsTab() {
  const { shelters, selectShelter, setActiveTab } = useAppStore()
  const [filterType, setFilterType] = useState<'all' | 'requests' | 'reports'>('all')

  // Collect all reports and requests with metadata
  const allUpdates = shelters.flatMap((shelter) => [
    ...shelter.reports.map((report) => ({
      id: `${shelter.id}-report-${report}`,
      type: 'report' as const,
      shelterId: shelter.id,
      shelterName: shelter.name,
      shelterType: shelter.type,
      message: report,
      timestamp: new Date(Date.now() - Math.random() * 3600000), // Random within last hour
      severity: determineSeverity(report),
    })),
    ...shelter.requests.map((request) => ({
      id: `${shelter.id}-request-${request}`,
      type: 'request' as const,
      shelterId: shelter.id,
      shelterName: shelter.name,
      shelterType: shelter.type,
      message: request,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      severity: 'high' as const,
    })),
  ])

  const filtered = allUpdates.filter((update) => {
    if (filterType === 'all') return true
    return update.type === filterType
  })

  const sorted = [...filtered].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  const handleShelterClick = (shelterId: string) => {
    selectShelter(shelterId)
    setActiveTab('profile')
  }

  return (
    <div className="pt-6 pb-32 px-6 h-screen overflow-y-auto bg-gray-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Live Updates</h1>
        <p className="text-gray-400 mb-6">Real-time reports and requests from shelters</p>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all' as const, label: 'All Updates', count: allUpdates.length },
            { value: 'reports' as const, label: 'Reports', count: allUpdates.filter(u => u.type === 'report').length },
            { value: 'requests' as const, label: 'Requests', count: allUpdates.filter(u => u.type === 'request').length },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter.label}
              <span className="ml-2 text-sm opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>

        {/* Updates List */}
        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                onShelterClick={() => handleShelterClick(update.shelterId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No updates found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function UpdateCard({
  update,
  onShelterClick,
}: {
  update: {
    id: string
    type: 'report' | 'request'
    shelterName: string
    shelterType: string
    message: string
    timestamp: Date
    severity: 'low' | 'medium' | 'high'
  }
  onShelterClick: () => void
}) {
  const icon = update.type === 'request' ? '🆘' : '📋'
  const bgColor =
    update.type === 'request'
      ? 'bg-red-900/20 border-red-700'
      : update.severity === 'high'
      ? 'bg-red-900/20 border-red-700'
      : update.severity === 'medium'
      ? 'bg-yellow-900/20 border-yellow-700'
      : 'bg-blue-900/20 border-blue-700'

  const textColor =
    update.type === 'request'
      ? 'text-red-400'
      : update.severity === 'high'
      ? 'text-red-400'
      : update.severity === 'medium'
      ? 'text-yellow-400'
      : 'text-blue-400'

  return (
    <div className={`border rounded-lg p-4 ${bgColor} hover:opacity-80 transition-opacity`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl mt-1">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white">{update.shelterName}</p>
            <p className={`text-sm font-medium mb-2 ${textColor}`}>
              {update.type === 'request' ? '🆘 REQUEST' : '📋 REPORT'}
            </p>
            <p className="text-gray-200">{update.message}</p>
          </div>
        </div>
        <button
          onClick={onShelterClick}
          className="shrink-0 ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
        >
          View
        </button>
      </div>
      <p className="text-xs text-gray-400">{formatTime(update.timestamp)}</p>
    </div>
  )
}

function determineSeverity(report: string): 'low' | 'medium' | 'high' {
  const lower = report.toLowerCase()
  if (
    lower.includes('critical') ||
    lower.includes('generator') ||
    lower.includes('outage') ||
    lower.includes('failure')
  ) {
    return 'high'
  }
  if (
    lower.includes('warning') ||
    lower.includes('degraded') ||
    lower.includes('capacity')
  ) {
    return 'medium'
  }
  return 'low'
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}
