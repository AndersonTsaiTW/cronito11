import { useAppStore } from '../store'

const SERVICE_OPTIONS = [
  { id: 'cooling', label: '❄️ Cooling', key: 'cooling' },
  { id: 'heating', label: '🔥 Heating', key: 'heating' },
  { id: 'charging', label: '🔌 Charging', key: 'charging' },
  { id: 'medicalSupport', label: '⚕️ Medical', key: 'medicalSupport' },
  { id: 'water', label: '💧 Water', key: 'water' },
  { id: 'food', label: '🍽️ Food', key: 'food' },
  { id: 'accessible', label: '♿ Accessible', key: 'accessible' },
]

export default function ShelterFilters() {
  const {
    shelters,
    filterOccupancy,
    filterPower,
    filterServices,
    setFilterOccupancy,
    setFilterPower,
    setFilterServices,
    clearFilters,
  } = useAppStore()

  const getFilteredShelters = () => {
    return shelters.filter((s) => {
      // Occupancy filter
      if (filterOccupancy === 'available' && s.occupancy >= s.capacity) return false
      if (filterOccupancy === 'full' && s.occupancy < s.capacity) return false

      // Power filter
      if (filterPower !== 'all' && s.gridStatus !== filterPower) return false

      // Services filter
      if (filterServices.length > 0) {
        const hasAllServices = filterServices.every((service) => {
          const key = SERVICE_OPTIONS.find(o => o.id === service)?.key
          return key ? s[key as keyof typeof s] : false
        })
        if (!hasAllServices) return false
      }

      return true
    })
  }

  const filteredCount = getFilteredShelters().length

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">🔍 Filters</h3>
        {(filterOccupancy !== 'all' || filterPower !== 'all' || filterServices.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Occupancy Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Available Space</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'available', label: 'Has Space' },
              { value: 'full', label: 'Full' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterOccupancy(opt.value as any)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterOccupancy === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Power Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Grid Status</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All Status', color: 'bg-gray-700', badge: '◉' },
              { value: 'online', label: 'Online', color: 'bg-green-600', badge: '✓' },
              { value: 'unstable', label: 'Unstable', color: 'bg-yellow-600', badge: '⚠' },
              { value: 'outage', label: 'Outage', color: 'bg-red-600', badge: '✕' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterPower(opt.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform ${
                  filterPower === opt.value
                    ? `${opt.color} text-white shadow-lg scale-105`
                    : `${opt.color} text-white opacity-70 hover:opacity-100`
                }`}
              >
                <span className="mr-2">{opt.badge}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Filter */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Services</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {SERVICE_OPTIONS.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  if (filterServices.includes(service.id)) {
                    setFilterServices(filterServices.filter(s => s !== service.id))
                  } else {
                    setFilterServices([...filterServices, service.id])
                  }
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  filterServices.includes(service.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {service.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Showing <span className="font-bold text-blue-400">{filteredCount}</span> of{' '}
            <span className="font-bold text-gray-300">{shelters.length}</span> shelters
          </p>
        </div>
      </div>
    </div>
  )
}
