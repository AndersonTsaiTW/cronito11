import { useState } from 'react'
import { useAppStore } from '../store'

const USER_TABS = [
  { id: 'map' as const, label: 'Map', icon: '🗺️' },
  { id: 'dashboard' as const, label: 'Stats', icon: '📊' },
  { id: 'profile' as const, label: 'Shelters', icon: '🏢' },
  { id: 'reports' as const, label: 'Updates', icon: '📢' },
]

const MANAGER_TABS = [
  { id: 'map' as const, label: 'Map', icon: '🗺️' },
  { id: 'dashboard' as const, label: 'My Shelter', icon: '⚙️' },
]

export default function TabNavigation() {
  const { activeTab, setActiveTab, userRole, setUserRole } = useAppStore()
  const [showSettings, setShowSettings] = useState(false)

  const tabs = userRole === 'user' ? USER_TABS : MANAGER_TABS

  return (
    <>
      <div className="fixed bottom-4 left-0 right-0 z-20 bg-gray-950/98 backdrop-blur border-t border-gray-800 px-2 py-2 rounded-t-xl">
        <div className="flex gap-2 max-w-2xl mx-auto">
          {tabs.map((tab) => (
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

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg font-medium text-xs transition-all ${
              showSettings
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="text-xl">⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-gray-900 w-full border-t border-gray-800 rounded-t-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Role Selector */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Switch User Role</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setUserRole('user')
                    setShowSettings(false)
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    userRole === 'user'
                      ? 'bg-blue-600/20 border-blue-600'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="font-bold text-white">Regular User</p>
                      <p className="text-xs text-gray-400">Find shelters, view updates, check status</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setUserRole('shelter_manager')
                    setShowSettings(false)
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    userRole === 'shelter_manager'
                      ? 'bg-orange-600/20 border-orange-600'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👨‍💼</span>
                    <div>
                      <p className="font-bold text-white">Shelter Manager</p>
                      <p className="text-xs text-gray-400">Report issues, update shelter status</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* About */}
            <div className="pt-6 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                ResilienceHub v1.0 • Real-time Shelter & Energy Platform
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

