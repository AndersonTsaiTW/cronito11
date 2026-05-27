import { useState } from 'react'
import { useAppStore } from '../store'

const REPORT_TYPES = [
  { id: 'capacity', label: 'Capacity Update', emoji: '👥', color: 'bg-blue-600' },
  { id: 'food', label: 'Food Status', emoji: '🍽️', color: 'bg-yellow-600' },
  { id: 'power', label: 'Power Issue', emoji: '⚡', color: 'bg-red-600' },
  { id: 'water', label: 'Water Issue', emoji: '💧', color: 'bg-cyan-600' },
  { id: 'cooling', label: 'AC/Cooling', emoji: '❄️', color: 'bg-blue-700' },
  { id: 'heating', label: 'Heating', emoji: '🔥', color: 'bg-orange-600' },
  { id: 'medical', label: 'Medical Needs', emoji: '⚕️', color: 'bg-green-600' },
  { id: 'staff', label: 'Staff Needed', emoji: '👨‍⚕️', color: 'bg-purple-600' },
  { id: 'supplies', label: 'Supplies Needed', emoji: '📦', color: 'bg-amber-600' },
  { id: 'generator', label: 'Generator Status', emoji: '⚙️', color: 'bg-gray-600' },
]

export default function ShelterManagerTab() {
  const { shelters, selectedShelterId, selectShelter, addReport } = useAppStore()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const shelter = selectedShelterId ? shelters.find(s => s.id === selectedShelterId) : null

  const handleSubmitReport = () => {
    if (!shelter || !selectedType || !message.trim()) return

    // Add report to the store
    const reportType = REPORT_TYPES.find(t => t.id === selectedType)
    const fullMessage = `${reportType?.emoji} ${reportType?.label}: ${message}`
    addReport(shelter.id, fullMessage)

    setSubmitted(true)
    setTimeout(() => {
      setSelectedType(null)
      setMessage('')
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="pt-6 pb-40 px-6 h-screen overflow-y-auto bg-gray-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">🏢 Shelter Manager</h1>
        <p className="text-gray-400 mb-8">Report updates and issues for your shelter</p>

        {/* Shelter Selection */}
        {!shelter ? (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-8">
            <h2 className="text-xl font-bold text-white mb-4">Select Your Shelter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shelters.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectShelter(s.id)}
                  className="text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 transition-colors"
                >
                  <p className="font-bold text-white">{s.name}</p>
                  <p className="text-sm text-gray-400">{s.address}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {s.occupancy}/{s.capacity} people
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Selected Shelter Info */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{shelter.name}</h2>
                  <p className="text-gray-400">{shelter.address}</p>
                </div>
                <button
                  onClick={() => selectShelter(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Quick Status */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-xs text-gray-400">Occupancy</p>
                  <p className="text-xl font-bold text-white">{shelter.occupancy}/{shelter.capacity}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-xs text-gray-400">Grid Status</p>
                  <p className={`text-lg font-bold ${
                    shelter.gridStatus === 'online' ? 'text-green-400' :
                    shelter.gridStatus === 'unstable' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {shelter.gridStatus === 'online' ? '🟢' : shelter.gridStatus === 'unstable' ? '🟡' : '🔴'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-xs text-gray-400">Generator</p>
                  <p className="text-lg font-bold text-white">{shelter.generator === 'automatic' ? '✓' : shelter.generator === 'manual' ? '⚠️' : '✗'}</p>
                </div>
                <div className="bg-gray-700/50 rounded p-3">
                  <p className="text-xs text-gray-400">Resilience</p>
                  <p className={`text-lg font-bold ${
                    shelter.resilienceScore >= 70 ? 'text-green-400' :
                    shelter.resilienceScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {shelter.resilienceScore}%
                  </p>
                </div>
              </div>
            </div>

            {/* Report Form */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6">Report an Update</h3>

              {/* Report Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-300 mb-4">What's the issue?</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {REPORT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-3 rounded-lg font-bold text-sm transition-all ${
                        selectedType === type.id
                          ? `${type.color} text-white scale-105`
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-xl mb-1">{type.emoji}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              {selectedType && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-300 mb-3">Details</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue or update..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                  />
                  <div className="text-xs text-gray-500 mt-2">
                    {message.length} characters
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {selectedType && (
                <button
                  onClick={handleSubmitReport}
                  disabled={!message.trim() || submitted}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    submitted
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500'
                  }`}
                >
                  {submitted ? '✓ Report Submitted!' : 'Submit Report'}
                </button>
              )}
            </div>

            {/* Recent Reports */}
            {(shelter.requests.length > 0 || shelter.reports.length > 0) && (
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Recent Reports</h3>
                <div className="space-y-3">
                  {shelter.reports.map((report, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded p-3">
                      <p className="text-gray-200">{report}</p>
                      <p className="text-xs text-gray-500 mt-1">Today</p>
                    </div>
                  ))}
                  {shelter.requests.map((request, i) => (
                    <div key={i} className="bg-red-900/20 border border-red-700 rounded p-3">
                      <p className="text-red-200">🆘 {request}</p>
                      <p className="text-xs text-red-500 mt-1">Active Request</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
