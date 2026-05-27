import { useState } from 'react'
import { useAppStore } from '../store'
import { getUserLocation, findBestShelter } from '../utils/geolocation'

export default function GeolocationButton() {
  const { userLocation, recommendedShelterId, setUserLocation, setRecommendedShelter, selectShelter, shelters } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetLocation = async () => {
    setLoading(true)
    setError(null)

    try {
      const location = await getUserLocation()
      setUserLocation(location)

      // Find the best shelter
      const best = findBestShelter(shelters, location)
      if (best) {
        setRecommendedShelter(best.shelter.id)
        selectShelter(best.shelter.id)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get location'
      setError(errorMsg)
      console.error('Geolocation error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if already located
  if (userLocation) {
    return (
      <div className="fixed bottom-28 left-6 z-10 bg-green-900/90 border border-green-700 rounded-lg px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <div>
            <p className="text-sm font-bold text-green-300">Location Found</p>
            {recommendedShelterId && (
              <p className="text-xs text-green-200">
                Recommended shelter selected
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-28 left-6 z-10">
      <button
        onClick={handleGetLocation}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all shadow-lg ${
          loading
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
        }`}
      >
        <span className="text-xl">{loading ? '⏳' : '📍'}</span>
        <span>{loading ? 'Getting location...' : 'Find My Shelter'}</span>
      </button>

      {error && (
        <div className="mt-2 bg-red-900/90 border border-red-700 rounded-lg px-4 py-2 backdrop-blur-sm text-xs text-red-200">
          {error}
        </div>
      )}
    </div>
  )
}
