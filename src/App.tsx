import { useAppStore } from './store'
import MapView from './components/MapView'
import LayerControls from './components/LayerControls'
import ShelterPanel from './components/ShelterPanel'
import QuickStats from './components/QuickStats'
import TabNavigation from './components/TabNavigation'
import DashboardTab from './components/DashboardTab'
import ProfileTab from './components/ProfileTab'
import ReportsTab from './components/ReportsTab'

export default function App() {
  const { activeTab } = useAppStore()

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      {/* Map - Main view */}
      <div className="absolute inset-0">
        <MapView />
      </div>

      {/* Map Controls - always visible on map */}
      {activeTab === 'map' && (
        <>
          <QuickStats />
          <LayerControls />
          <ShelterPanel />
        </>
      )}

      {/* Overlay Content Tabs */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'reports' && <ReportsTab />}

      {/* Bottom Navigation */}
      <TabNavigation />
    </div>
  )
}
