import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from './supabase'
import Navigation from './components/Navigation'
import ConfigError from './components/ConfigError'
import SchedulePage from './pages/SchedulePage'
import ContactsPage from './pages/ContactsPage'
import HistoryPage from './pages/HistoryPage'
import GoogleCalendarPage from './pages/GoogleCalendarPage'
import {
  DEFAULT_REGION,
  formatRegionName,
  getSavedRegion,
  isInGreaterAustin,
  saveRegion,
} from './lib/regions'

export default function App() {
  const savedRegion = getSavedRegion()
  const [selectedRegion, setSelectedRegion] = useState(savedRegion || DEFAULT_REGION)
  const [regions, setRegions] = useState([DEFAULT_REGION])
  const hasManualSelection = useRef(Boolean(savedRegion))

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchRegions = async () => {
      const { data } = await supabase
        .from('bsg_region_cities')
        .select('region_name')

      if (!data) return

      const regionNames = [...new Set(data.map((region) => region.region_name).filter(Boolean))]
      if (regionNames.length > 0) setRegions(regionNames)
    }

    fetchRegions()
  }, [])

  useEffect(() => {
    if (hasManualSelection.current || typeof navigator === 'undefined' || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!hasManualSelection.current && isInGreaterAustin(coords.latitude, coords.longitude)) {
          setSelectedRegion(DEFAULT_REGION)
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 86400000, timeout: 5000 }
    )
  }, [])

  const handleRegionChange = (event) => {
    const regionName = event.target.value
    hasManualSelection.current = true
    saveRegion(regionName)
    setSelectedRegion(regionName)
  }

  if (!isSupabaseConfigured) {
    return <ConfigError />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-end mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              Region
              <select
                aria-label="Region"
                value={selectedRegion}
                onChange={handleRegionChange}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {regions.map((regionName) => (
                  <option key={regionName} value={regionName}>{formatRegionName(regionName)}</option>
                ))}
              </select>
            </label>
          </div>
          <Routes>
            <Route path="/" element={<SchedulePage selectedRegion={selectedRegion} />} />
            <Route path="/contacts" element={<ContactsPage selectedRegion={selectedRegion} />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/google-calendar" element={<GoogleCalendarPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
