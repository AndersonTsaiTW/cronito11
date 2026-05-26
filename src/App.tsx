import MapView from './components/MapView'
import LayerControls from './components/LayerControls'

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <div className="absolute inset-0">
        <MapView />
      </div>
      <LayerControls />
    </div>
  )
}
