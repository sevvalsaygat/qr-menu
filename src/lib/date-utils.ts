import { Timestamp, FieldValue } from 'firebase/firestore'
import { Order } from '@/types'

export interface DateGroup {
  date: string // YYYY-MM-DD format
  label: string // Display label like "Today", "Yesterday", "September 10, 2025"
  orders: Order[]
}

export interface WeekGroup {
  weekStart: string // YYYY-MM-DD format
  weekEnd: string // YYYY-MM-DD format
  label: string // Display label like "Week of September 9, 2025"
  dateGroups: DateGroup[]
}

/**
 * Get the date string in YYYY-MM-DD format using local date
 */
export function getDateString(timestamp: Timestamp | FieldValue | null | undefined): string {
  if (!timestamp || !(timestamp as Timestamp).toDate) return ''
  const date = (timestamp as Timestamp).toDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get a user-friendly date label
 */
export function getDateLabel(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Use local date strings for comparison
  const todayStr = getLocalDateString(today)
  const yesterdayStr = getLocalDateString(yesterday)

  if (dateString === todayStr) {
    return 'Today'
  } else if (dateString === yesterdayStr) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  weekStart.setDate(weekStart.getDate() - day)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekEnd = new Date(date)
  const day = weekEnd.getDay()
  weekEnd.setDate(weekEnd.getDate() + (6 - day))
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

/**
 * Get a user-friendly week label
 */
export function getWeekLabel(weekStart: string): string {
  const startDate = new Date(weekStart)
  const endDate = getWeekEnd(startDate)
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' })
  const startDay = startDate.getDate()
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' })
  const endDay = endDate.getDate()
  const year = startDate.getFullYear()

  if (startMonth === endMonth) {
    return `Week of ${startMonth} ${startDay}-${endDay}, ${year}`
  } else {
    return `Week of ${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
  }
}

/**
 * Group orders by date
 */
export function groupOrdersByDate(orders: Order[]): DateGroup[] {
  const dateMap = new Map<string, Order[]>()

  // Group orders by date
  orders.forEach(order => {
    const dateString = getDateString(order.createdAt)
    if (!dateMap.has(dateString)) {
      dateMap.set(dateString, [])
    }
    dateMap.get(dateString)!.push(order)
  })

  // Convert to array and sort by date (newest first)
  const dateGroups: DateGroup[] = Array.from(dateMap.entries())
    .map(([date, orders]) => ({
      date,
      label: getDateLabel(date),
      orders: orders        .sort((a, b) => {
          const aTime = (a.createdAt as Timestamp)?.toDate?.() || new Date(0)
          const bTime = (b.createdAt as Timestamp)?.toDate?.() || new Date(0)
          return bTime.getTime() - aTime.getTime() // Newest first
        })
    }))
    .sort((a, b) => b.date.localeCompare(a.date)) // Newest dates first

  return dateGroups
}

/**
 * Group orders by week, then by date within each week
 */
export function groupOrdersByWeek(orders: Order[]): WeekGroup[] {
  const weekMap = new Map<string, Map<string, Order[]>>()

  // Group orders by week, then by date within week
  orders.forEach(order => {
    const dateString = getDateString(order.createdAt)
    if (!dateString) return

    const date = new Date(dateString)
    const weekStart = getWeekStart(date)
    const weekStartString = getLocalDateString(weekStart)

    if (!weekMap.has(weekStartString)) {
      weekMap.set(weekStartString, new Map())
    }

    const dateMap = weekMap.get(weekStartString)!
    if (!dateMap.has(dateString)) {
      dateMap.set(dateString, [])
    }
    dateMap.get(dateString)!.push(order)
  })

  // Convert to array and sort by week (newest first)
  const weekGroups: WeekGroup[] = Array.from(weekMap.entries())
    .map(([weekStartString, dateMap]) => {
      const weekEnd = getWeekEnd(new Date(weekStartString))
      const weekEndString = getLocalDateString(weekEnd)

      // Convert date map to date groups
      const dateGroups: DateGroup[] = Array.from(dateMap.entries())
        .map(([date, orders]) => ({
          date,
          label: getDateLabel(date),
          orders: orders        .sort((a, b) => {
          const aTime = (a.createdAt as Timestamp)?.toDate?.() || new Date(0)
          const bTime = (b.createdAt as Timestamp)?.toDate?.() || new Date(0)
          return bTime.getTime() - aTime.getTime() // Newest first
        })
        }))
        .sort((a, b) => b.date.localeCompare(a.date)) // Newest dates first

      return {
        weekStart: weekStartString,
        weekEnd: weekEndString,
        label: getWeekLabel(weekStartString),
        dateGroups
      }
    })
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart)) // Newest weeks first

  return weekGroups
}

/**
 * Get the appropriate accordion value for auto-expanding today's date/week
 */
export function getDefaultAccordionValue(dateGroups: DateGroup[], useWeeks: boolean = false): string[] {
  if (useWeeks) {
    // For weeks, expand the current week
    const today = new Date()
    const currentWeekStart = getWeekStart(today)
    const currentWeekStartStr = getLocalDateString(currentWeekStart)
    return [`week-${currentWeekStartStr}`]
  } else {
    // For dates, expand today if it exists
    const today = new Date()
    const todayStr = getLocalDateString(today)
    const todayGroup = dateGroups.find(group => group.date === todayStr)
    return todayGroup ? [`date-${todayGroup.date}`] : []
  }
}
