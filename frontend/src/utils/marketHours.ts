/**
 * Utility functions for checking US stock market hours
 * Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
 */

export interface MarketStatus {
  isOpen: boolean
  nextOpen: Date | null
  nextClose: Date | null
  statusText: string
}

/**
 * Check if the US stock market is currently open
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  
  // Convert to ET (Eastern Time)
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  // Check if it's a weekend
  const day = etTime.getDay()
  if (day === 0 || day === 6) {
    return false // Sunday or Saturday
  }
  
  // Get hours and minutes in ET
  const hours = etTime.getHours()
  const minutes = etTime.getMinutes()
  const timeInMinutes = hours * 60 + minutes
  
  // Market hours: 9:30 AM (570 minutes) - 4:00 PM (960 minutes)
  const marketOpen = 9 * 60 + 30  // 9:30 AM
  const marketClose = 16 * 60      // 4:00 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes < marketClose
}

/**
 * Get detailed market status including next open/close times
 */
export function getMarketStatus(): MarketStatus {
  const now = new Date()
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  const day = etTime.getDay()
  const hours = etTime.getHours()
  const minutes = etTime.getMinutes()
  const timeInMinutes = hours * 60 + minutes
  
  const marketOpen = 9 * 60 + 30  // 9:30 AM
  const marketClose = 16 * 60      // 4:00 PM
  
  // Check if market is currently open
  const isOpen = day !== 0 && day !== 6 && timeInMinutes >= marketOpen && timeInMinutes < marketClose
  
  let statusText = ''
  let nextOpen: Date | null = null
  let nextClose: Date | null = null
  
  if (isOpen) {
    statusText = 'Market Open'
    // Calculate next close (today at 4:00 PM ET)
    nextClose = new Date(etTime)
    nextClose.setHours(16, 0, 0, 0)
  } else {
    statusText = 'Market Closed'
    
    // Calculate next open
    nextOpen = new Date(etTime)
    
    if (day === 0) {
      // Sunday - opens Monday at 9:30 AM
      nextOpen.setDate(nextOpen.getDate() + 1)
      nextOpen.setHours(9, 30, 0, 0)
    } else if (day === 6) {
      // Saturday - opens Monday at 9:30 AM
      nextOpen.setDate(nextOpen.getDate() + 2)
      nextOpen.setHours(9, 30, 0, 0)
    } else if (timeInMinutes < marketOpen) {
      // Before market open today
      nextOpen.setHours(9, 30, 0, 0)
    } else {
      // After market close - opens tomorrow (or Monday if Friday)
      if (day === 5) {
        // Friday - opens Monday
        nextOpen.setDate(nextOpen.getDate() + 3)
      } else {
        // Monday-Thursday - opens next day
        nextOpen.setDate(nextOpen.getDate() + 1)
      }
      nextOpen.setHours(9, 30, 0, 0)
    }
  }
  
  return {
    isOpen,
    nextOpen,
    nextClose,
    statusText
  }
}

/**
 * Format time until next market event (open or close)
 */
export function formatTimeUntil(targetTime: Date): string {
  const now = new Date()
  const diff = targetTime.getTime() - now.getTime()
  
  if (diff <= 0) return 'Now'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours === 0) {
    return `${minutes}m`
  } else if (hours < 24) {
    return `${hours}h ${minutes}m`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
}
