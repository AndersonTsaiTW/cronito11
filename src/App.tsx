import { useAppStore } from './store'
import MapView from './components/MapView'
import LayerControls from './components/LayerControls'
import ShelterPanel from './components/ShelterPanel'
import QuickStats from './components/QuickStats'
import GeolocationButton from './components/GeolocationButton'
import TabNavigation from './components/TabNavigation'
import DashboardTab from './components/DashboardTab'
import ProfileTab from './components/ProfileTab'
import ReportsTab from './components/ReportsTab'
import ShelterManagerTab from './components/ShelterManagerTab'
import LoginScreen from './components/LoginScreen'
import ShelterFilters from './components/ShelterFilters'

export default function App() {
  const { activeTab, userRole } = useAppStore()

  // Show login screen if no role selected
  if (userRole === null) {
    return <LoginScreen />
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      {/* Map - Main view */}
      <div className="absolute inset-0 z-0">
        <MapView />
      </div>

      {/* Map Controls - only on map tab */}
      {activeTab === 'map' && (
        <>
          <QuickStats />
          <LayerControls />
          <GeolocationButton />
          <ShelterPanel />
        </>
      )}

      {/* User Role Specific UI - Content overlays on top */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {userRole === 'user' ? (
          <>
            {/* User Interface */}
            {activeTab === 'dashboard' && (
              <div className="pointer-events-auto">
                <DashboardTab />
              </div>
            )}
            {activeTab === 'profile' && (
              <div className="pointer-events-auto">
                <div className="pt-6 pb-40 px-6 h-screen overflow-y-auto bg-gray-950">
                  <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">🏢 Find a Shelter</h1>
                    <p className="text-gray-400 mb-8">Discover nearby shelters with real-time status</p>
                    <ShelterFilters />
                    <ProfileTab />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'reports' && (
              <div className="pointer-events-auto">
                <ReportsTab />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Shelter Manager Interface */}
            {activeTab === 'dashboard' && (
              <div className="pointer-events-auto">
                <ShelterManagerTab />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <TabNavigation />
    </div>
  )
}
