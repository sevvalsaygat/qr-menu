'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { getUserRestaurants, getTables, getProducts, getOrders } from '../../lib/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { QrCode, Users, ShoppingBag, BarChart3, Plus, Loader2, DollarSign } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import MonthlyRevenueBarChart from '../../components/charts/MonthlyRevenueBarChart'
import { calculateMonthlyRevenueData, generateSampleMonthlyRevenueData, MonthlyRevenueStats } from '../../lib/monthly-revenue-analytics'

interface DashboardStats {
  totalTables: number
  menuItems: number
  todaysOrders: number
  dailyRevenue: number
  totalRevenue: number
}

export default function DashboardHome() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    menuItems: 0,
    todaysOrders: 0,
    dailyRevenue: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Monthly revenue chart state
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyRevenueStats>({
    totalRevenue: 0,
    growthPercentage: 0,
    data: []
  })
  const [chartLoading, setChartLoading] = useState(true)

  // Load dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')

      // Get user's restaurant
      const restaurants = await getUserRestaurants(user.uid)
      if (restaurants.length === 0) {
        setStats({
          totalTables: 0,
          menuItems: 0,
          todaysOrders: 0,
          dailyRevenue: 0,
          totalRevenue: 0
        })
        setLoading(false)
        return
      }

      const restaurantId = restaurants[0].id

      // Fetch all data in parallel
      const [tables, products, orders] = await Promise.all([
        getTables(restaurantId),
        getProducts(restaurantId),
        getOrders(restaurantId, true, 100) // Get more orders to calculate today's stats
      ])

      // Calculate today's orders and revenue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = today.getTime()

      const todaysOrders = orders.filter(order => {
        const orderDate = (order.createdAt as Timestamp).toDate()
        return orderDate.getTime() >= todayTimestamp
      })

      // Calculate daily revenue (today's completed orders only)
      const todaysCompletedOrders = todaysOrders.filter(order => order.isCompleted)
      
      const todaysRevenue = todaysCompletedOrders.reduce((total, order) => {
        return total + (order.summary?.total || 0)
      }, 0)

      // Calculate total revenue (all completed orders)
      const allCompletedOrders = orders.filter(order => order.isCompleted)
      const totalRevenue = allCompletedOrders.reduce((total, order) => {
        return total + (order.summary?.total || 0)
      }, 0)

      // Update stats
      setStats({
        totalTables: tables.length,
        menuItems: products.length,
        todaysOrders: todaysOrders.length,
        dailyRevenue: todaysRevenue,
        totalRevenue: totalRevenue
      })

    } catch {
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load monthly revenue data
  const loadMonthlyRevenueData = useCallback(async () => {
    if (!user) return

    try {
      setChartLoading(true)

      // Get user's restaurant
      const restaurants = await getUserRestaurants(user.uid)
      if (restaurants.length === 0) {
        // Use sample data if no restaurant found
        const sampleData = generateSampleMonthlyRevenueData(6)
        setMonthlyRevenueData(sampleData)
        return
      }

      const restaurantId = restaurants[0].id

      // Try to get real revenue data, fallback to sample data
      try {
        console.log('🏪 Loading real monthly revenue data for restaurant:', restaurantId)
        const revenueData = await calculateMonthlyRevenueData(restaurantId, 6)
        
        // Check if we got real data or if we need sample data
        if (revenueData.totalRevenue > 0) {
          console.log('✅ Using real revenue data:', revenueData.totalRevenue)
          setMonthlyRevenueData(revenueData)
        } else {
          console.log('📊 No completed orders found, using sample data for demonstration')
          const sampleData = generateSampleMonthlyRevenueData(6)
          setMonthlyRevenueData(sampleData)
        }
      } catch (revenueError) {
        console.error('❌ Error loading monthly revenue data, using sample data:', revenueError)
        const sampleData = generateSampleMonthlyRevenueData(6)
        setMonthlyRevenueData(sampleData)
      }

    } catch (error) {
      console.error('Error loading monthly revenue data:', error)
      // Use sample data as fallback
      const sampleData = generateSampleMonthlyRevenueData(6)
      setMonthlyRevenueData(sampleData)
    } finally {
      setChartLoading(false)
    }
  }, [user])

  // Load stats when component mounts or user changes
  useEffect(() => {
    loadDashboardStats()
    loadMonthlyRevenueData()
  }, [loadDashboardStats, loadMonthlyRevenueData])

  const quickActions = [
    {
      title: 'Manage Tables',
      description: 'Add and manage your restaurant tables',
      icon: QrCode,
      href: '/dashboard/tables',
      color: 'bg-blue-500'
    },
    {
      title: 'Menu Categories',
      description: 'Organize your menu items',
      icon: ShoppingBag,
      href: '/dashboard/categories',
      color: 'bg-green-500'
    },
    {
      title: 'Products',
      description: 'Add and edit menu items',
      icon: Plus,
      href: '/dashboard/products',
      color: 'bg-purple-500'
    },
    {
      title: 'Orders',
      description: 'View and manage orders',
      icon: BarChart3,
      href: '/dashboard/orders',
      color: 'bg-orange-500'
    }
  ]

  const statsDisplay = [
    { label: 'Total Tables', value: stats.totalTables.toString(), icon: QrCode },
    { label: 'Menu Items', value: stats.menuItems.toString(), icon: ShoppingBag },
    { label: 'Today\'s Orders', value: stats.todaysOrders.toString(), icon: Users },
    { label: 'Daily Revenue', value: `$${stats.dailyRevenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: BarChart3 }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back!
          </h2>
          <p className="text-gray-600 mt-2">
            Manage your restaurant {userData?.restaurantName} from your dashboard
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadDashboardStats}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BarChart3 className="h-4 w-4" />
          )}
          Refresh Stats
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statsDisplay.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? (
                      <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <stat.icon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue Chart - Half Width */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Half - Monthly Revenue Chart */}
          <div>
            <MonthlyRevenueBarChart 
              data={monthlyRevenueData} 
              loading={chartLoading} 
            />
          </div>
          
          {/* Right Half - Empty Space */}
          <div>
            {/* Intentionally left empty as requested */}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className={`inline-flex p-3 rounded-lg ${action.color} w-fit`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => router.push(action.href)}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to set up your QR menu system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create your first table</h4>
                <p className="text-sm text-gray-600">Add tables and generate QR codes for customers to scan</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Set up menu categories</h4>
                <p className="text-sm text-gray-600">Organize your menu with categories like Appetizers, Main Courses, etc.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add menu items</h4>
                <p className="text-sm text-gray-600">Add products with descriptions, prices, and images</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Start receiving orders</h4>
                <p className="text-sm text-gray-600">Customers can now scan QR codes and place orders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
