'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrderNotifications } from '@/contexts/OrderNotificationContext'
import { useNotificationSettings } from '@/contexts/NotificationSettingsContext'
import { useSoundNotifications } from '@/contexts/SoundNotificationContext'
import { createTestOrder, createMultipleTestOrders } from '@/lib/test-orders'
import { testOrderUpdates, testMultipleOrderUpdates } from '@/lib/test-order-updates'
import { createNotificationAudio } from '@/lib/sound-generator'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Plus, TestTube, RefreshCw, Volume2 } from 'lucide-react'

export function TestOrderNotifications() {
  const { user } = useAuth()
  const { totalActiveOrders, pendingOrders, isLoading, error } = useOrderNotifications()
  const { showOrderCount, isInQuietHours, settings } = useNotificationSettings()
  const { initializeAudio, isAudioInitialized } = useSoundNotifications()
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

  const handleTestOrderUpdates = async () => {
    if (!user) return
    
    setIsCreating(true)
    try {
      // Get the first restaurant
      const { getUserRestaurants } = await import('@/lib/firestore')
      const restaurants = await getUserRestaurants(user.uid)
      if (restaurants.length === 0) {
        console.error('No restaurant found')
        return
      }
      
      const restaurantId = restaurants[0].id
      const testTableId = 'test-table-updates'
      
      await testOrderUpdates(restaurantId, testTableId)
      setLastCreatedOrder('Order update test completed')
    } catch (error) {
      console.error('Error testing order updates:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleTestMultipleOrderUpdates = async () => {
    if (!user) return
    
    setIsCreating(true)
    try {
      // Get the first restaurant
      const { getUserRestaurants } = await import('@/lib/firestore')
      const restaurants = await getUserRestaurants(user.uid)
      if (restaurants.length === 0) {
        console.error('No restaurant found')
        return
      }
      
      const restaurantId = restaurants[0].id
      const testTableId = 'test-table-multiple-updates'
      
      await testMultipleOrderUpdates(restaurantId, testTableId)
      setLastCreatedOrder('Multiple order updates test completed')
    } catch (error) {
      console.error('Error testing multiple order updates:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Local test sound function that uses current settings
  const handleTestSound = () => {
    console.log('🧪 Testing sound from test component with settings:', settings.soundNotifications)
    
    // Don't play sound if sound type is 'off'
    if (settings.soundNotifications.soundType === 'off') {
      console.log('❌ Sound type is set to off, not playing test sound')
      return
    }
    
    // Initialize audio if not already done
    if (!isAudioInitialized) {
      console.log('🔄 Audio not initialized, attempting to initialize...')
      initializeAudio()
      // Give a small delay for audio context to be ready
      setTimeout(() => {
        console.log('🎵 Playing test sound after initialization:', settings.soundNotifications.soundType)
        createNotificationAudio(settings.soundNotifications.soundType as 'default' | 'gentle' | 'loud')
      }, 100)
    } else {
      console.log('🎵 Playing test sound immediately:', settings.soundNotifications.soundType)
      createNotificationAudio(settings.soundNotifications.soundType as 'default' | 'gentle' | 'loud')
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
        <div className="grid grid-cols-5 gap-4">
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
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-800">
              {isInQuietHours ? 'QUIET' : 'ACTIVE'}
            </div>
            <div className="text-sm text-yellow-600">Quiet Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-800">
              {isAudioInitialized ? 'READY' : 'NOT READY'}
            </div>
            <div className="text-sm text-yellow-600">Audio Status</div>
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

        <div className="flex gap-2 flex-wrap">
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
          <Button
            onClick={handleTestOrderUpdates}
            disabled={isCreating || !user}
            size="sm"
            variant="outline"
            className="border-blue-400 text-blue-800 hover:bg-blue-100"
          >
            <TestTube className="h-4 w-4 mr-1" />
            Test Order Updates
          </Button>
          <Button
            onClick={handleTestMultipleOrderUpdates}
            disabled={isCreating || !user}
            size="sm"
            variant="outline"
            className="border-blue-400 text-blue-800 hover:bg-blue-100"
          >
            <TestTube className="h-4 w-4 mr-1" />
            Test Multiple Updates
          </Button>
          {!isAudioInitialized && (
            <Button
              onClick={initializeAudio}
              size="sm"
              variant="outline"
              className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
            >
              <Volume2 className="h-4 w-4 mr-1" />
              Initialize Audio
            </Button>
          )}
          <Button
            onClick={handleTestSound}
            disabled={settings.soundNotifications.soundType === 'off'}
            size="sm"
            variant="outline"
            className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
          >
            <Volume2 className="h-4 w-4 mr-1" />
            Test Sound
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
          <div>
            <strong>Sound Notifications:</strong> Sound will play for new orders when enabled in notification settings.
            {!isAudioInitialized && ' Audio needs to be initialized first.'}
          </div>
          {settings.quietHours.enabled && (
            <div>
              <strong>Quiet Hours:</strong> {settings.quietHours.startTime} - {settings.quietHours.endTime} 
              {isInQuietHours && ' (Currently Active)'}
            </div>
          )}
          <div>
            <strong>Debug:</strong> Check browser console for detailed logging of order detection and sound playback.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
