'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getUserRestaurants, getOrders, markOrderAsCompleted, markOrderAsActive, cancelOrder, uncancelOrder } from '@/lib/firestore'
import { Restaurant, Order } from '@/types'
import { Timestamp, FieldValue, onSnapshot, collection, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Utensils,
  DollarSign,
  Users,
  RefreshCw,
  XCircle,
  Calendar,
  CalendarDays,
  Search,
  X
} from 'lucide-react'
import { 
  groupOrdersByDate, 
  groupOrdersByWeek, 
  getDefaultAccordionValue
} from '@/lib/date-utils'
import { searchOrders, getSearchSuggestions } from '@/lib/search-utils'
import { formatCurrency } from '@/lib/utils'
import { TestOrderNotifications } from '@/components/TestOrderNotifications'

interface OrderStats {
  activeCount: number
  completedCount: number
  cancelledCount: number
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

interface OrderCardProps {
  order: Order
  isUpdating: boolean
  onMarkAsCompleted: (orderId: string) => void
  onMarkAsActive: (orderId: string) => void
  onCancelOrder: (orderId: string) => void
  onUncancelOrder: (orderId: string) => void
  getTimeAgo: (timestamp: Timestamp | FieldValue | null | undefined) => string
  currencySymbol: '₺' | '$' | '€'
}

function OrderCard({ 
  order, 
  isUpdating, 
  onMarkAsCompleted, 
  onMarkAsActive, 
  onCancelOrder, 
  onUncancelOrder,
  getTimeAgo,
  currencySymbol
}: OrderCardProps) {
  return (
    <Card key={order.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              order.isCancelled ? 'bg-red-100' :
              order.isCompleted ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              {order.isCancelled ? (
                <XCircle className="h-4 w-4 text-red-600" />
              ) : order.isCompleted ? (
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
                {order.isCancelled && order.cancelledBy && (
                  <>
                    <span>•</span>
                    <span>Cancelled by {order.cancelledBy}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={
              order.isCancelled ? 'destructive' :
              order.isCompleted ? 'secondary' : 'default'
            }>
              {order.isCancelled ? 'Cancelled' :
               order.isCompleted ? 'Completed' : 'Active'}
            </Badge>
            {order.isCancelled ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onUncancelOrder(order.id)}
                disabled={isUpdating}
              >
                Reactivate
              </Button>
            ) : order.isCompleted ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onMarkAsActive(order.id)}
                disabled={isUpdating}
              >
                Reopen
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onMarkAsCompleted(order.id)}
                  disabled={isUpdating}
                >
                  Mark Complete
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => onCancelOrder(order.id)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
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
              <span className="font-medium">{formatCurrency(item.subtotal, currencySymbol)}</span>
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
            <p className="text-lg font-bold">{formatCurrency(order.summary.total, currencySymbol)}</p>
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
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const currencySymbol: '₺' | '$' | '€' = restaurant?.settings?.currency === '₺' || restaurant?.settings?.currency === '€' || restaurant?.settings?.currency === '$'
    ? restaurant!.settings!.currency as '₺' | '$' | '€'
    : '$'
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    activeCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalCount: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set())
  const [orderFilter, setOrderFilter] = useState<'active' | 'completed' | 'cancelled'>('active')
  const [statsUpdating, setStatsUpdating] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
  const [groupByWeek, setGroupByWeek] = useState(false)
  const [accordionValue, setAccordionValue] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)

  // Calculate statistics from orders
  const calculateStats = useCallback((ordersList: Order[]): OrderStats => {
    const activeOrders = ordersList.filter(order => !order.isCompleted && !order.isCancelled)
    const completedOrders = ordersList.filter(order => order.isCompleted && !order.isCancelled)
    const cancelledOrders = ordersList.filter(order => order.isCancelled)
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.summary.total, 0)

    return {
      activeCount: activeOrders.length,
      completedCount: completedOrders.length,
      cancelledCount: cancelledOrders.length,
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

  const handleCancelOrder = async (orderId: string) => {
    if (!restaurant) return

    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))
      await cancelOrder(restaurant.id, orderId, 'restaurant')
      
      // Update the order locally for immediate UI feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, isCancelled: true, cancelledBy: 'restaurant' as const }
            : order
        )
      )
      
      // Also refresh from server to ensure consistency
      await loadOrders()
      
      // Close the dialog
      setCancelDialogOpen(false)
      setOrderToCancel(null)
    } catch (err) {
      console.error('Error cancelling order:', err)
      setError('Failed to cancel order.')
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

  const openCancelDialog = (orderId: string) => {
    setOrderToCancel(orderId)
    setCancelDialogOpen(true)
  }

  const closeCancelDialog = () => {
    setCancelDialogOpen(false)
    setOrderToCancel(null)
  }

  const handleUncancelOrder = async (orderId: string) => {
    if (!restaurant) return

    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId))
      await uncancelOrder(restaurant.id, orderId)
      
      // Update the order locally for immediate UI feedback
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, isCancelled: false, cancelledBy: undefined }
            : order
        )
      )
      
      // Also refresh from server to ensure consistency
      await loadOrders()
    } catch (err) {
      console.error('Error uncancelling order:', err)
      setError('Failed to uncancel order.')
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

  // Listen for restaurant changes to update currency
  useEffect(() => {
    if (!user?.uid || !restaurant) return

    const checkForRestaurantUpdates = async () => {
      try {
        const restaurants = await getUserRestaurants(user.uid)
        if (restaurants.length > 0) {
          const currentCurrency = restaurants[0].settings?.currency || '$'
          const currentRestaurant = restaurants[0]
          if (currentCurrency !== currencySymbol || currentRestaurant.id !== restaurant.id) {
            setRestaurant(currentRestaurant)
          }
        }
      } catch (err) {
        console.error('Error checking restaurant updates:', err)
      }
    }

    // Check for updates every 5 seconds
    const interval = setInterval(checkForRestaurantUpdates, 5000)
    
    return () => clearInterval(interval)
  }, [user?.uid, restaurant, currencySymbol])

  useEffect(() => {
    if (restaurant) {
      loadOrders()

      // Real-time updates for orders
      const q = query(
        collection(db, 'restaurants', restaurant.id, 'orders'),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const next = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Order[]
        setOrders(next)
      }, (err) => {
        console.error('Error listening to orders:', err)
      })

      return () => unsubscribe()
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

  // Filter and search orders for display
  const displayedOrders = useMemo(() => {
    // First filter by status
    const filteredOrders = orders.filter(order => {
      switch (orderFilter) {
        case 'active':
          return !order.isCompleted && !order.isCancelled
        case 'completed':
          return order.isCompleted && !order.isCancelled
        case 'cancelled':
          return order.isCancelled
        default:
          return false
      }
    })

    // Then apply search filter
    return searchOrders(filteredOrders, searchTerm)
  }, [orders, orderFilter, searchTerm])

  // Group orders by date or week
  const dateGroups = useMemo(() => groupOrdersByDate(displayedOrders), [displayedOrders])
  const weekGroups = useMemo(() => groupOrdersByWeek(displayedOrders), [displayedOrders])

  // Update accordion value when grouping changes or orders change
  useEffect(() => {
    const newValue = getDefaultAccordionValue(dateGroups, groupByWeek)
    setAccordionValue(newValue)
  }, [groupByWeek, dateGroups])

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return []
    return getSearchSuggestions(orders, searchTerm)
  }, [orders, searchTerm])

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setShowSearchSuggestions(value.trim().length > 0)
  }

  // Handle search suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSearchSuggestions(false)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm('')
    setShowSearchSuggestions(false)
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
        <Button
          variant="outline"
          onClick={loadOrders}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Test Component - Only in Development */}
      <TestOrderNotifications />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          title="Cancelled Orders"
          value={stats.cancelledCount}
          icon={XCircle}
          iconColor="text-red-500"
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
          value={formatCurrency(stats.totalRevenue, restaurant?.settings?.currency || '$')}
          icon={DollarSign}
          iconColor="text-yellow-500"
          isUpdating={statsUpdating}
        />
      </div>

      {/* Search and Date/Week Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Search Bar - Left Aligned */}
        <div className="relative w-3/5">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by customer name, product name, or order number (use # for order number)..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSearchSuggestions(searchTerm.trim().length > 0)}
              onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              className="w-full pl-10 pr-10 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none first:rounded-t-md last:rounded-b-md"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date/Week Filter Toggle - Right Aligned */}
        <div className="flex items-center gap-3 bg-muted p-1 rounded-md">
          <Button
            variant={!groupByWeek ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setGroupByWeek(false)}
            className="h-8"
          >
            <Calendar className="h-4 w-4 mr-1" />
            By Date
          </Button>
          <Button
            variant={groupByWeek ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setGroupByWeek(true)}
            className="h-8"
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            By Week
          </Button>
        </div>
      </div>

      {/* Filter Toggle and Search Results */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={orderFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setOrderFilter('active')}
            size="sm"
          >
            Active Orders ({stats.activeCount})
          </Button>
          <Button
            variant={orderFilter === 'completed' ? 'default' : 'outline'}
            onClick={() => setOrderFilter('completed')}
            size="sm"
          >
            Completed Orders ({stats.completedCount})
          </Button>
          <Button
            variant={orderFilter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setOrderFilter('cancelled')}
            size="sm"
          >
            Cancelled Orders ({stats.cancelledCount})
          </Button>
        </div>
        
        {/* Search Results Indicator */}
        {searchTerm && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              {displayedOrders.length} result{displayedOrders.length !== 1 ? 's' : ''} found for &ldquo;{searchTerm}&rdquo;
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            {searchTerm ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-4">
                  No orders match your search for &ldquo;{searchTerm}&rdquo;
                </p>
                <Button variant="outline" onClick={clearSearch}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {orderFilter === 'active' && 'No active orders'}
                  {orderFilter === 'completed' && 'No completed orders yet'}
                  {orderFilter === 'cancelled' && 'No cancelled orders'}
                </h3>
                <p className="text-muted-foreground">
                  {orderFilter === 'active' && 'New orders will appear here when customers place them using your QR codes.'}
                  {orderFilter === 'completed' && 'Completed orders will appear here.'}
                  {orderFilter === 'cancelled' && 'Cancelled orders will appear here.'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion 
          type="multiple" 
          value={accordionValue} 
          onValueChange={setAccordionValue}
          className="space-y-2"
        >
          {groupByWeek ? (
            // Week-based grouping
            weekGroups.map((weekGroup) => (
              <AccordionItem 
                key={`week-${weekGroup.weekStart}`} 
                value={`week-${weekGroup.weekStart}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      <CalendarDays className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <div className="font-semibold">{weekGroup.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {weekGroup.dateGroups.length} day{weekGroup.dateGroups.length !== 1 ? 's' : ''} • {weekGroup.dateGroups.reduce((sum, day) => sum + day.orders.length, 0)} orders
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="multiple" className="space-y-2">
                    {weekGroup.dateGroups.map((dateGroup) => (
                      <AccordionItem 
                        key={`date-${dateGroup.date}`} 
                        value={`date-${dateGroup.date}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div className="text-left">
                                <div className="font-medium">{dateGroup.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {dateGroup.orders.length} order{dateGroup.orders.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {dateGroup.orders.map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                isUpdating={updatingOrders.has(order.id)}
                                onMarkAsCompleted={handleMarkAsCompleted}
                                onMarkAsActive={handleMarkAsActive}
                                onCancelOrder={openCancelDialog}
                                onUncancelOrder={handleUncancelOrder}
                                getTimeAgo={getTimeAgo}
                                currencySymbol={currencySymbol}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            // Date-based grouping
            dateGroups.map((dateGroup) => (
              <AccordionItem 
                key={`date-${dateGroup.date}`} 
                value={`date-${dateGroup.date}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <div className="font-semibold">{dateGroup.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {dateGroup.orders.length} order{dateGroup.orders.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {dateGroup.orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isUpdating={updatingOrders.has(order.id)}
                        onMarkAsCompleted={handleMarkAsCompleted}
                        onMarkAsActive={handleMarkAsActive}
                        onCancelOrder={openCancelDialog}
                        onUncancelOrder={handleUncancelOrder}
                        getTimeAgo={getTimeAgo}
                        currencySymbol={currencySymbol}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))
          )}
        </Accordion>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              You can reactivate the order later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancelDialog}>
              Keep Order
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => orderToCancel && handleCancelOrder(orderToCancel)}
              disabled={updatingOrders.has(orderToCancel || '')}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
