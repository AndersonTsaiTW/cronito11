import { useAppStore } from '../store'

export default function LoginScreen() {
  const { setUserRole } = useAppStore()

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-4xl font-bold text-white mb-2">ResilienceHub</h1>
          <p className="text-gray-400 text-lg">Real-time Shelter & Energy Platform</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => setUserRole('user')}
            className="w-full group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
          >
            <div className="text-4xl mb-2">👤</div>
            <div className="text-lg">I'm Looking for a Shelter</div>
            <p className="text-sm text-blue-200 mt-1">Find the best shelter near you</p>
          </button>

          <button
            onClick={() => setUserRole('shelter_manager')}
            className="w-full group bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold py-6 rounded-lg transition-all transform hover:scale-105 shadow-xl"
          >
            <div className="text-4xl mb-2">👨‍💼</div>
            <div className="text-lg">I Manage a Shelter</div>
            <p className="text-sm text-orange-200 mt-1">Report status & updates</p>
          </button>
        </div>

        {/* Info */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-400">
            You can switch roles anytime from the settings menu
          </p>
        </div>
      </div>
    </div>
  )
}
