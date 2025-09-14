import { Order } from '@/types'

/**
 * Search orders by customer name, product name, or order number
 */
export function searchOrders(orders: Order[], searchTerm: string): Order[] {
  if (!searchTerm.trim()) {
    return orders
  }

  const trimmedSearchTerm = searchTerm.trim()
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase()

  return orders.filter(order => {
    // Search by order number (requires # prefix)
    if (trimmedSearchTerm.startsWith('#')) {
      const orderNumberSearch = trimmedSearchTerm.slice(1).toLowerCase() // Remove # and convert to lowercase
      const orderNumber = order.id.slice(-6).toLowerCase()
      if (orderNumber.includes(orderNumberSearch)) {
        return true
      }
    }

    // Search by customer name (only if not starting with #)
    if (!trimmedSearchTerm.startsWith('#') && order.customer?.name) {
      const customerName = order.customer.name.toLowerCase()
      if (customerName.includes(normalizedSearchTerm)) {
        return true
      }
    }

    // Search by product names in order items (only if not starting with #)
    if (!trimmedSearchTerm.startsWith('#')) {
      const hasMatchingProduct = order.items.some(item => {
        const productName = item.name.toLowerCase()
        return productName.includes(normalizedSearchTerm)
      })

      if (hasMatchingProduct) {
        return true
      }
    }

    // Search by table name (only if not starting with #)
    if (!trimmedSearchTerm.startsWith('#')) {
      const tableName = order.tableName.toLowerCase()
      if (tableName.includes(normalizedSearchTerm)) {
        return true
      }
    }

    // Search by special instructions (only if not starting with #)
    if (!trimmedSearchTerm.startsWith('#') && order.specialInstructions) {
      const specialInstructions = order.specialInstructions.toLowerCase()
      if (specialInstructions.includes(normalizedSearchTerm)) {
        return true
      }
    }

    return false
  })
}

/**
 * Get search suggestions based on available data
 */
export function getSearchSuggestions(orders: Order[], searchTerm: string): string[] {
  if (!searchTerm.trim()) {
    return []
  }

  const trimmedSearchTerm = searchTerm.trim()
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase()
  const suggestions = new Set<string>()

  // If searching with # prefix, suggest order numbers
  if (trimmedSearchTerm.startsWith('#')) {
    const orderNumberSearch = trimmedSearchTerm.slice(1).toLowerCase()
    orders.forEach(order => {
      const orderNumber = order.id.slice(-6).toLowerCase()
      if (orderNumber.includes(orderNumberSearch)) {
        suggestions.add(`#${orderNumber.toUpperCase()}`)
      }
    })
  } else {
    // Regular search suggestions for non-order number searches
    orders.forEach(order => {
      // Add customer names
      if (order.customer?.name) {
        const customerName = order.customer.name.toLowerCase()
        if (customerName.includes(normalizedSearchTerm)) {
          suggestions.add(order.customer.name)
        }
      }

      // Add product names
      order.items.forEach(item => {
        const productName = item.name.toLowerCase()
        if (productName.includes(normalizedSearchTerm)) {
          suggestions.add(item.name)
        }
      })

      // Add table names
      const tableName = order.tableName.toLowerCase()
      if (tableName.includes(normalizedSearchTerm)) {
        suggestions.add(`Table ${order.tableName}`)
      }
    })
  }

  return Array.from(suggestions).slice(0, 5) // Limit to 5 suggestions
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) {
    return text
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
}
