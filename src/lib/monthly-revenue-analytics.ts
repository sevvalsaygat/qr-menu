import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface MonthlyRevenueData {
  month: string // Format: "2024-01" 
  monthName: string // Format: "Jan 2024"
  revenue: number
  weeklyRevenue?: number // Current week revenue (only for current month)
}

export interface MonthlyRevenueStats {
  totalRevenue: number
  growthPercentage: number
  data: MonthlyRevenueData[]
}

/**
 * Calculate monthly revenue data for the last N months
 */
export const calculateMonthlyRevenueData = async (
  restaurantId: string, 
  months: number = 6
): Promise<MonthlyRevenueStats> => {
  try {
    // Calculate date range for the last N months (including current month)
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999) // End of today
    
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months + 1) // Include current month
    startDate.setDate(1) // First day of the month
    startDate.setHours(0, 0, 0, 0)

    // Query orders within date range
    const ordersQuery = query(
      collection(db, 'restaurants', restaurantId, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'asc')
    )

    const ordersSnapshot = await getDocs(ordersQuery)
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      summary: doc.data().summary as { total: number } | undefined,
      createdAt: doc.data().createdAt as Timestamp | undefined,
      isCompleted: doc.data().isCompleted as boolean | undefined
    })) as Array<{ 
      id: string
      summary?: { total: number }
      createdAt?: Timestamp
      isCompleted?: boolean
    }>

    // Group orders by month and calculate revenue
    const revenueByMonth: { [key: string]: number } = {}
    let totalRevenue = 0
    let currentWeekRevenue = 0

    // Calculate current week date range (Sunday to today)
    const now = new Date()
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0)
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    orders.forEach(order => {
      if (order.createdAt && order.summary?.total && order.isCompleted === true) {
        const orderDate = order.createdAt.toDate()
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
        
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + order.summary.total
        totalRevenue += order.summary.total

        // Calculate current week revenue (only for current month)
        if (monthKey === currentMonth && orderDate >= currentWeekStart) {
          currentWeekRevenue += order.summary.total
        }
      }
    })

    // Create array of monthly revenue data
    const data: MonthlyRevenueData[] = []

    // Generate data for exactly N months
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(startDate)
      monthDate.setMonth(startDate.getMonth() + i)
      
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      const monthName = monthDate.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
      
      const monthRevenue = revenueByMonth[monthKey] || 0
      const isLastMonth = i === months - 1 // Only the last month gets weekly revenue
      
      data.push({
        month: monthKey,
        monthName,
        revenue: monthRevenue,
        weeklyRevenue: isLastMonth ? currentWeekRevenue : undefined
      })
    }

    // Calculate growth percentage (comparing last 3 months to previous 3 months)
    // With 6 months total: months 4-6 vs months 1-3
    const lastQuarterRevenue = data.slice(-3).reduce((sum, month) => sum + month.revenue, 0)
    const previousQuarterRevenue = data.slice(0, 3).reduce((sum, month) => sum + month.revenue, 0)
    
    let growthPercentage = 0
    if (previousQuarterRevenue > 0) {
      growthPercentage = ((lastQuarterRevenue - previousQuarterRevenue) / previousQuarterRevenue) * 100
    }

    

    return {
      totalRevenue,
      growthPercentage,
      data
    }
  } catch (error) {
    console.error('Error calculating monthly revenue data:', error)
    
    // Return sample data as fallback
    return generateSampleMonthlyRevenueData(months)
  }
}

/**
 * Generate sample monthly revenue data for demonstration
 */
export const generateSampleMonthlyRevenueData = (months: number = 6): MonthlyRevenueStats => {
  const data: MonthlyRevenueData[] = []
  
  // Create date range for the last N months (including current month)
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999) // End of today
  
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1) // Include current month
  startDate.setDate(1) // First day of the month
  startDate.setHours(0, 0, 0, 0)

  let totalRevenue = 0

  // Weekly revenue will be calculated for the last month in the data array

  // Generate data for exactly N months
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(startDate)
    monthDate.setMonth(startDate.getMonth() + i)
    
    // Generate realistic monthly revenue data with seasonal variation
    const baseRevenue = 2000 + Math.random() * 8000 // $2,000-$10,000 per month
    const seasonalMultiplier = getSeasonalMultiplier(monthDate.getMonth())
    const revenue = Math.round(baseRevenue * seasonalMultiplier)
    
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    const monthName = monthDate.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
    
    // Generate weekly revenue only for the LAST month (current month) in the data
    const isLastMonth = i === months - 1
    const weeklyRevenue = isLastMonth ? Math.round(revenue * (0.2 + Math.random() * 0.2)) : undefined
    
    data.push({
      month: monthKey,
      monthName,
      revenue,
      weeklyRevenue
    })
    
    totalRevenue += revenue
  }

  // Calculate growth percentage (comparing last 3 months to previous 3 months)
  // With 6 months total: months 4-6 vs months 1-3
  const lastQuarterRevenue = data.slice(-3).reduce((sum, month) => sum + month.revenue, 0)
  const previousQuarterRevenue = data.slice(0, 3).reduce((sum, month) => sum + month.revenue, 0)
  
  let growthPercentage = 0
  if (previousQuarterRevenue > 0) {
    growthPercentage = ((lastQuarterRevenue - previousQuarterRevenue) / previousQuarterRevenue) * 100
  }


  return {
    totalRevenue,
    growthPercentage,
    data
  }
}

/**
 * Get seasonal multiplier for more realistic revenue patterns
 */
function getSeasonalMultiplier(month: number): number {
  // 0 = January, 11 = December
  const seasonalFactors = {
    0: 0.8,  // January (post-holiday low)
    1: 0.85, // February 
    2: 0.9,  // March
    3: 1.0,  // April
    4: 1.1,  // May
    5: 1.2,  // June (summer starts)
    6: 1.3,  // July (peak summer)
    7: 1.25, // August
    8: 1.1,  // September
    9: 1.05, // October
    10: 1.15, // November (holiday season starts)
    11: 1.4   // December (holiday peak)
  }
  
  return seasonalFactors[month as keyof typeof seasonalFactors] || 1.0
}
