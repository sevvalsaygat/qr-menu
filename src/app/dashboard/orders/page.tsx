'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserRestaurants, getOrders, markOrderAsCompleted, markOrderAsActive } from '@/lib/firestore'
import { Restaurant, Order } from '@/types'
import { Timestamp, FieldValue } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Utensils,
  DollarSign,
  Users,
  RefreshCw
} from 'lucide-react'

interface OrderStats {
  activeCount: number
  completedCount: number
  totalCount: number
  totalRevenue: number
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  isUpdating?: boolean
}

function StatCard({ title, value, icon: Icon, iconColor, isUpdating }: StatCardProps) {
  return (
    <Card className={`transition-all duration-300 ${isUpdating ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold transition-all duration-300 ${isUpdating ? 'scale-105' : ''}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    activeCount: 0,
    completedCount: 0,
    totalCount: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const [showCompleted, setShowCompleted] = useState(false)
  const [statsUpdating, setStatsUpdating] = useState(false)

  // Calculate statistics from orders
  const calculateStats = useCallback((ordersList: Order[]): OrderStats => {
    const activeOrders = ordersList.filter(order => !order.isCompleted)
    const completedOrders = ordersList.filter(order => order.isCompleted)
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.summary.total, 0)

    return {
      activeCount: activeOrders.length,
      completedCount: completedOrders.length,
      totalCount: ordersList.length,
      totalRevenue
    }
  }, [])

  // Update stats whenever orders change
  useEffect(() => {
    const newStats = calculateStats(orders)
    const statsChanged = JSON.stringify(stats) !== JSON.stringify(newStats)
    
    if (statsChanged) {
      setStatsUpdating(true)
      setStats(newStats)
      
      // Remove the updating animation after a short delay
      setTimeout(() => {
        setStatsUpdating(false)
      }, 1000)
    }
  }, [orders, calculateStats, stats])

  const loadRestaurant = useCallback(async () => {
    if (!user) return

    try {
      const restaurants = await getUserRestaurants(user.uid)
      if (restaurants.length > 0) {
        setRestaurant(restaurants[0])
      } else {
        setError('No restaurant found. Please contact support.')
      }
    } catch (err) {
      console.error('Error loading restaurant:', err)
      setError('Failed to load restaurant data.')
    }
  }, [user])

  const loadOrders = useCallback(async () => {
    if (!restaurant) return

    try {
      setLoading(true)
      // Always load all orders for accurate statistics
      const allOrders = await getOrders(restaurant.id, true) // true = include completed
      setOrders(allOrders)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [restaurant])

  const handleMarkAsCompleted = async (orderId: string) => {
    if (!restaurant) return

    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))
      await markOrderAsCompleted(restaurant.id, orderId)
      
      // Update the order locally for immediate UI feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, isCompleted: true }
            : order
        )
      )
      
      // Also refresh from server to ensure consistency
      await loadOrders()
    } catch (err) {
      console.error('Error marking order as completed:', err)
      setError('Failed to mark order as completed.')
      // Revert local changes on error
      await loadOrders()
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const handleMarkAsActive = async (orderId: string) => {
    if (!restaurant) return

    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))
      await markOrderAsActive(restaurant.id, orderId)
      
      // Update the order locally for immediate UI feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, isCompleted: false }
            : order
        )
      )
      
      // Also refresh from server to ensure consistency
      await loadOrders()
    } catch (err) {
      console.error('Error marking order as active:', err)
      setError('Failed to mark order as active.')
      // Revert local changes on error
      await loadOrders()
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  useEffect(() => {
    loadRestaurant()
  }, [loadRestaurant])

  useEffect(() => {
    if (restaurant) {
      loadOrders()
    }
  }, [restaurant, loadOrders])

  const getTimeAgo = (timestamp: Timestamp | FieldValue | null | undefined) => {
    if (!timestamp || !(timestamp as Timestamp).toDate) return ''
    const now = new Date()
    const orderTime = (timestamp as Timestamp).toDate()
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ${diffMinutes % 60}m ago`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Filter orders for display based on showCompleted toggle
  const displayedOrders = showCompleted 
    ? orders.filter(order => order.isCompleted)
    : orders.filter(order => !order.isCompleted)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage orders from your restaurant
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Orders"
          value={stats.activeCount}
          icon={AlertCircle}
          iconColor="text-blue-500"
          isUpdating={statsUpdating}
        />
        
        <StatCard
          title="Completed Orders"
          value={stats.completedCount}
          icon={CheckCircle}
          iconColor="text-green-500"
          isUpdating={statsUpdating}
        />
        
        <StatCard
          title="Total Orders"
          value={stats.totalCount}
          icon={Utensils}
          iconColor="text-purple-500"
          isUpdating={statsUpdating}
        />
        
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          iconColor="text-yellow-500"
          isUpdating={statsUpdating}
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={!showCompleted ? 'default' : 'outline'}
          onClick={() => setShowCompleted(false)}
          size="sm"
        >
          Active Orders ({stats.activeCount})
        </Button>
        <Button
          variant={showCompleted ? 'default' : 'outline'}
          onClick={() => setShowCompleted(true)}
          size="sm"
        >
          Completed Orders ({stats.completedCount})
        </Button>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {showCompleted ? 'No completed orders yet' : 'No active orders'}
            </h3>
            <p className="text-muted-foreground">
              {showCompleted 
                ? 'Completed orders will appear here.'
                : 'New orders will appear here when customers place them using your QR codes.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const isUpdating = updatingOrders.has(order.id)

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${order.isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {order.isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Table {order.tableName}</span>
                          <span>•</span>
                          <span>{getTimeAgo(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={order.isCompleted ? 'secondary' : 'default'}>
                        {order.isCompleted ? 'Completed' : 'Active'}
                      </Badge>
                      {order.isCompleted ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleMarkAsActive(order.id)}
                          disabled={isUpdating}
                        >
                          Reopen
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleMarkAsCompleted(order.id)}
                          disabled={isUpdating}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                        </div>
                        <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Order Summary */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{order.summary.itemCount} items</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${order.summary.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800">Special Instructions:</p>
                      <p className="text-sm text-yellow-700 mt-1">{order.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
