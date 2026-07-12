export const DEFAULT_REGION = 'central_texas'
export const REGION_STORAGE_KEY = 'bsg-selected-region'

const AUSTIN_COORDINATES = { latitude: 30.2672, longitude: -97.7431 }
const GREATER_AUSTIN_RADIUS_MILES = 75
const EARTH_RADIUS_MILES = 3958.8

const toRadians = (degrees) => (degrees * Math.PI) / 180

export const getSavedRegion = () => {
  if (typeof window === 'undefined') return null

  return window.localStorage.getItem(REGION_STORAGE_KEY)
}

export const saveRegion = (regionName) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(REGION_STORAGE_KEY, regionName)
}

export const isInGreaterAustin = (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false

  const latitudeDelta = toRadians(latitude - AUSTIN_COORDINATES.latitude)
  const longitudeDelta = toRadians(longitude - AUSTIN_COORDINATES.longitude)
  const latitudeStart = toRadians(AUSTIN_COORDINATES.latitude)
  const latitudeEnd = toRadians(latitude)
  const distance = 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(
    Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(latitudeStart) * Math.cos(latitudeEnd) * Math.sin(longitudeDelta / 2) ** 2
  ))

  return distance <= GREATER_AUSTIN_RADIUS_MILES
}

export const formatRegionName = (regionName) =>
  regionName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
