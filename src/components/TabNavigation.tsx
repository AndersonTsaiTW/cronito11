import { useAppStore } from '../store'

const TABS = [
  { id: 'map' as const, label: 'Map', icon: '🗺️' },
  { id: 'dashboard' as const, label: 'Stats', icon: '📊' },
  { id: 'profile' as const, label: 'Shelters', icon: '🏢' },
  { id: 'reports' as const, label: 'Updates', icon: '📢' },
]

export default function TabNavigation() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-gray-950/98 backdrop-blur border-t border-gray-800 px-2 py-2">
      <div className="flex gap-2 max-w-2xl mx-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg font-medium text-xs transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

