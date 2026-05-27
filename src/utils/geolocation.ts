import type { Shelter } from '../types'

export interface UserLocation {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two coordinates in kilometers
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Score a shelter based on multiple factors
 */
export function calculateShelterScore(shelter: Shelter, distance: number): number {
  let score = 100

  // Resilience score is primary factor (0-40 points)
  score += (shelter.resilienceScore / 100) * 40

  // Occupancy (0-30 points) - prefer less crowded shelters
  const occupancyRate = shelter.occupancy / shelter.capacity
  const occupancyScore = Math.max(0, 30 - occupancyRate * 30)
  score += occupancyScore

  // Grid status (0-20 points)
  if (shelter.gridStatus === 'online') {
    score += 20
  } else if (shelter.gridStatus === 'unstable') {
    score += 10
  }
  // outage = 0 points

  // Distance penalty (0-30 points) - prefer closer shelters
  // Consider shelters within 5km as good distance
  const distanceScore = Math.max(0, 30 - (distance / 5) * 30)
  score += distanceScore

  // Active requests penalty
  score -= shelter.requests.length * 5

  return Math.max(0, score)
}

/**
 * Find the best shelter for the user based on location
 */
export function findBestShelter(
  shelters: Shelter[],
  userLocation: UserLocation
): { shelter: Shelter; distance: number; score: number } | null {
  if (shelters.length === 0) return null

  let best = null
  let bestScore = -Infinity

  for (const shelter of shelters) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      shelter.coordinates[1],
      shelter.coordinates[0]
    )

    const score = calculateShelterScore(shelter, distance)

    if (score > bestScore) {
      bestScore = score
      best = { shelter, distance, score }
    }
  }

  return best
}

/**
 * Get user's geolocation
 */
export function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // 5 minutes cache
      }
    )
  })
}
