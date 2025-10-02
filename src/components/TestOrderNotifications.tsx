'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrderNotifications } from '@/contexts/OrderNotificationContext'
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext'
import { createTestOrder, createMultipleTestOrders } from '@/lib/test-orders'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Plus, TestTube, RefreshCw } from 'lucide-react'

export function TestOrderNotifications() {
  const { user } = useAuth()
  const { totalActiveOrders, pendingOrders, isLoading, error } = useOrderNotifications()
  const { showOrderCount } = useNotificationSettings()
  const [isCreating, setIsCreating] = useState(false)
  const [lastCreatedOrder, setLastCreatedOrder] = useState<string | null>(null)

  const handleCreateTestOrder = async () => {
    if (!user) return
    
    setIsCreating(true)
    try {
      // Use a test table ID - in a real scenario, you'd get this from your tables
      const testTableId = 'test-table-1'
      const orderId = await createTestOrder(user.uid, testTableId)
      setLastCreatedOrder(orderId)
    } catch (error) {
      console.error('Error creating test order:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateMultipleTestOrders = async () => {
    if (!user) return
    
    setIsCreating(true)
    try {
      const testTableId = 'test-table-1'
      const orderIds = await createMultipleTestOrders(user.uid, testTableId, 3)
      setLastCreatedOrder(orderIds[orderIds.length - 1])
    } catch (error) {
      console.error('Error creating test orders:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Card className="border-dashed border-2 border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <TestTube className="h-5 w-5" />
          Order Notification Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-800">{totalActiveOrders}</div>
            <div className="text-sm text-yellow-600">Active Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-800">{pendingOrders.length}</div>
            <div className="text-sm text-yellow-600">Pending Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-800">
              {showOrderCount ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-yellow-600">Badge Display</div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-yellow-600">Loading orders...</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleCreateTestOrder}
            disabled={isCreating || !user}
            size="sm"
            variant="outline"
            className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Test Order
          </Button>
          <Button
            onClick={handleCreateMultipleTestOrders}
            disabled={isCreating || !user}
            size="sm"
            variant="outline"
            className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create 3 Test Orders
          </Button>
        </div>

        {lastCreatedOrder && (
          <div className="text-sm text-yellow-700">
            Last created order: <Badge variant="secondary">{lastCreatedOrder.slice(-6)}</Badge>
          </div>
        )}

        <div className="text-xs text-yellow-600 space-y-2">
          <div>
            <strong>Note:</strong> This component only appears in development mode. 
            Watch the sidebar &ldquo;Orders&rdquo; menu item for the notification badge to update in real-time.
          </div>
          <div>
            <strong>Badge Control:</strong> The order count badge is controlled by the &ldquo;New Orders&rdquo; setting in 
            <Button variant="link" size="sm" className="h-auto p-0 text-yellow-600 underline" asChild>
              <a href="/dashboard/settings/notifications">Notification Settings</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
