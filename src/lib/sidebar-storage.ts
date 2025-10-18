/**
 * Utility functions for persisting sidebar state in localStorage
 * 
 * RESTAURANT-SPECIFIC STORAGE:
 * Each restaurant has its own independent sidebar state stored with a unique key.
 * This ensures that when Restaurant A collapses their sidebar, it doesn't affect
 * Restaurant B's sidebar state. Each restaurant owner can have their own preference.
 * 
 * Storage Key Format: 'qr-menu-sidebar-collapsed-{restaurantId}'
 * Example: 'qr-menu-sidebar-collapsed-user123' for restaurant with ID 'user123'
 */

const SIDEBAR_STORAGE_PREFIX = 'qr-menu-sidebar-collapsed'

/**
 * Generate restaurant-specific storage key
 * @param restaurantId - The restaurant's unique identifier
 * @returns string key for localStorage
 */
function getSidebarStorageKey(restaurantId: string): string {
  return `${SIDEBAR_STORAGE_PREFIX}-${restaurantId}`
}

/**
 * Get the saved sidebar collapsed state from localStorage for a specific restaurant
 * @param restaurantId - The restaurant's unique identifier
 * @returns boolean indicating if sidebar should be collapsed
 */
export function getSidebarState(restaurantId: string): boolean {
  if (typeof window === 'undefined') {
    // Return default state during SSR
    return false
  }

  if (!restaurantId) {
    console.warn('Restaurant ID is required to get sidebar state')
    return false
  }

  try {
    const key = getSidebarStorageKey(restaurantId)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : false
  } catch (error) {
    console.warn('Failed to load sidebar state from localStorage:', error)
    return false
  }
}

/**
 * Save the sidebar collapsed state to localStorage for a specific restaurant
 * @param restaurantId - The restaurant's unique identifier
 * @param isCollapsed - boolean indicating if sidebar is collapsed
 */
export function saveSidebarState(restaurantId: string, isCollapsed: boolean): void {
  if (typeof window === 'undefined') {
    // Skip saving during SSR
    return
  }

  if (!restaurantId) {
    console.warn('Restaurant ID is required to save sidebar state')
    return
  }

  try {
    const key = getSidebarStorageKey(restaurantId)
    localStorage.setItem(key, JSON.stringify(isCollapsed))
  } catch (error) {
    console.warn('Failed to save sidebar state to localStorage:', error)
  }
}

/**
 * Clear the saved sidebar state from localStorage for a specific restaurant
 * @param restaurantId - The restaurant's unique identifier
 */
export function clearSidebarState(restaurantId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!restaurantId) {
    console.warn('Restaurant ID is required to clear sidebar state')
    return
  }

  try {
    const key = getSidebarStorageKey(restaurantId)
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear sidebar state from localStorage:', error)
  }
}

/**
 * Clear all sidebar states from localStorage (useful for cleanup)
 */
export function clearAllSidebarStates(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(SIDEBAR_STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.warn('Failed to clear all sidebar states from localStorage:', error)
  }
}
