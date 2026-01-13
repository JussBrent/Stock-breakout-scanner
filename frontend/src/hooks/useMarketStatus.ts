import { useState, useEffect } from 'react'

type MarketStatus = {
  isOpen: boolean
  nextEvent: 'open' | 'close'
  nextEventTime: Date | null
}

// US Stock Market Hours: 9:30 AM - 4:00 PM ET (Monday-Friday)
export function useMarketStatus(): MarketStatus {
  const [status, setStatus] = useState<MarketStatus>(() => calculateMarketStatus())

  useEffect(() => {
    // Update status immediately
    setStatus(calculateMarketStatus())

    // Update every minute
    const interval = setInterval(() => {
      setStatus(calculateMarketStatus())
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [])

  return status
}

function calculateMarketStatus(): MarketStatus {
  const now = new Date()
  
  // Convert to ET (UTC-5 or UTC-4 depending on DST)
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  const day = etTime.getDay() // 0 = Sunday, 6 = Saturday
  const hours = etTime.getHours()
  const minutes = etTime.getMinutes()
  const currentMinutes = hours * 60 + minutes

  // Weekend check
  if (day === 0 || day === 6) {
    // Next open is Monday 9:30 AM
    const nextMonday = new Date(etTime)
    const daysUntilMonday = day === 0 ? 1 : 2
    nextMonday.setDate(etTime.getDate() + daysUntilMonday)
    nextMonday.setHours(9, 30, 0, 0)
    
    return {
      isOpen: false,
      nextEvent: 'open',
      nextEventTime: nextMonday,
    }
  }

  // Market hours: 9:30 AM (570 minutes) - 4:00 PM (960 minutes)
  const marketOpen = 9 * 60 + 30 // 570 minutes (9:30 AM)
  const marketClose = 16 * 60 // 960 minutes (4:00 PM)

  if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    // Market is open
    const closeTime = new Date(etTime)
    closeTime.setHours(16, 0, 0, 0)
    
    return {
      isOpen: true,
      nextEvent: 'close',
      nextEventTime: closeTime,
    }
  } else if (currentMinutes < marketOpen) {
    // Before market open today
    const openTime = new Date(etTime)
    openTime.setHours(9, 30, 0, 0)
    
    return {
      isOpen: false,
      nextEvent: 'open',
      nextEventTime: openTime,
    }
  } else {
    // After market close - next open is tomorrow (or Monday if Friday)
    const nextOpen = new Date(etTime)
    const daysToAdd = day === 5 ? 3 : 1 // If Friday, add 3 days to get to Monday
    nextOpen.setDate(etTime.getDate() + daysToAdd)
    nextOpen.setHours(9, 30, 0, 0)
    
    return {
      isOpen: false,
      nextEvent: 'open',
      nextEventTime: nextOpen,
    }
  }
}
