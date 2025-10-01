'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Switch } from '../../../../components/ui/switch'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Separator } from '../../../../components/ui/separator'
import { Bell, ArrowLeft, CheckCircle, AlertCircle, Loader2, Volume2, VolumeX, Mail } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'

interface NotificationSettings {
  emailNotifications: {
    newOrders: boolean
    orderUpdates: boolean
    dailyReports: boolean
    weeklyReports: boolean
  }
  soundNotifications: {
    newOrders: boolean
    orderUpdates: boolean
    soundType: 'default' | 'gentle' | 'loud' | 'off'
  }
  pushNotifications: {
    enabled: boolean
    newOrders: boolean
    orderUpdates: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: {
      newOrders: true,
      orderUpdates: true,
      dailyReports: false,
      weeklyReports: false
    },
    soundNotifications: {
      newOrders: true,
      orderUpdates: false,
      soundType: 'default'
    },
    pushNotifications: {
      enabled: true,
      newOrders: true,
      orderUpdates: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load notification settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        const settingsRef = doc(db, 'users', user.uid)
        const settingsDoc = await getDoc(settingsRef)
        
        if (settingsDoc.exists()) {
          const userData = settingsDoc.data()
          if (userData.notificationSettings) {
            setSettings(userData.notificationSettings)
          }
        }
      } catch (err) {
        console.error('Error loading notification settings:', err)
        setError('Failed to load notification settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user?.uid])

  const handleSave = async () => {
    if (!user?.uid) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const settingsRef = doc(db, 'users', user.uid)
      await setDoc(settingsRef, {
        notificationSettings: settings
      }, { merge: true })

      setSuccess('Notification settings saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving notification settings:', err)
      setError('Failed to save notification settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/settings')
  }

  const updateEmailSettings = (key: keyof NotificationSettings['emailNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value
      }
    }))
  }

  const updateSoundSettings = (key: keyof NotificationSettings['soundNotifications'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      soundNotifications: {
        ...prev.soundNotifications,
        [key]: value
      }
    }))
  }

  const updatePushSettings = (key: keyof NotificationSettings['pushNotifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      pushNotifications: {
        ...prev.pushNotifications,
        [key]: value
      }
    }))
  }

  const updateQuietHours = (key: keyof NotificationSettings['quietHours'], value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-2">
          <Bell className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
            <p className="text-gray-600">Configure how you receive notifications</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading notification settings...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center space-x-2">
        <Bell className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Configure how you receive notifications</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Settings</span>
        </Button>
      </div>

      {/* Success */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure email alerts for important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-orders-email" className="text-base">
                New Orders
              </Label>
              <p className="text-sm text-gray-600">
                Get notified when customers place new orders
              </p>
            </div>
            <Switch
              id="new-orders-email"
              checked={settings.emailNotifications.newOrders}
              onCheckedChange={(checked) => updateEmailSettings('newOrders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="order-updates-email" className="text-base">
                Order Updates
              </Label>
              <p className="text-sm text-gray-600">
                Receive updates when orders change status
              </p>
            </div>
            <Switch
              id="order-updates-email"
              checked={settings.emailNotifications.orderUpdates}
              onCheckedChange={(checked) => updateEmailSettings('orderUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-reports-email" className="text-base">
                Daily Reports
              </Label>
              <p className="text-sm text-gray-600">
                Receive daily summary of orders and revenue
              </p>
            </div>
            <Switch
              id="daily-reports-email"
              checked={settings.emailNotifications.dailyReports}
              onCheckedChange={(checked) => updateEmailSettings('dailyReports', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports-email" className="text-base">
                Weekly Reports
              </Label>
              <p className="text-sm text-gray-600">
                Receive weekly summary and analytics
              </p>
            </div>
            <Switch
              id="weekly-reports-email"
              checked={settings.emailNotifications.weeklyReports}
              onCheckedChange={(checked) => updateEmailSettings('weeklyReports', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sound Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {settings.soundNotifications.soundType === 'off' ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
            <span>Sound Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure audio alerts for real-time notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-orders-sound" className="text-base">
                New Orders Sound
              </Label>
              <p className="text-sm text-gray-600">
                Play sound when new orders arrive
              </p>
            </div>
            <Switch
              id="new-orders-sound"
              checked={settings.soundNotifications.newOrders}
              onCheckedChange={(checked) => updateSoundSettings('newOrders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="order-updates-sound" className="text-base">
                Order Updates Sound
              </Label>
              <p className="text-sm text-gray-600">
                Play sound when order status changes
              </p>
            </div>
            <Switch
              id="order-updates-sound"
              checked={settings.soundNotifications.orderUpdates}
              onCheckedChange={(checked) => updateSoundSettings('orderUpdates', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sound-type" className="text-base">
              Sound Type
            </Label>
            <Select
              value={settings.soundNotifications.soundType}
              onValueChange={(value) => updateSoundSettings('soundType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sound type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="gentle">Gentle</SelectItem>
                <SelectItem value="loud">Loud</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              Choose the notification sound that works best for your environment
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Push Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure browser push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-enabled" className="text-base">
                Enable Push Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Allow browser to send push notifications
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={settings.pushNotifications.enabled}
              onCheckedChange={(checked) => updatePushSettings('enabled', checked)}
            />
          </div>

          {settings.pushNotifications.enabled && (
            <>
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-new-orders" className="text-base">
                    New Orders
                  </Label>
                  <p className="text-sm text-gray-600">
                    Push notification for new orders
                  </p>
                </div>
                <Switch
                  id="push-new-orders"
                  checked={settings.pushNotifications.newOrders}
                  onCheckedChange={(checked) => updatePushSettings('newOrders', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-order-updates" className="text-base">
                    Order Updates
                  </Label>
                  <p className="text-sm text-gray-600">
                    Push notification for order status changes
                  </p>
                </div>
                <Switch
                  id="push-order-updates"
                  checked={settings.pushNotifications.orderUpdates}
                  onCheckedChange={(checked) => updatePushSettings('orderUpdates', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Quiet Hours</span>
          </CardTitle>
          <CardDescription>
            Set times when you don&apos;t want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours-enabled" className="text-base">
                Enable Quiet Hours
              </Label>
              <p className="text-sm text-gray-600">
                Pause notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={settings.quietHours.enabled}
              onCheckedChange={(checked) => updateQuietHours('enabled', checked)}
            />
          </div>

          {settings.quietHours.enabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-base">
                    Start Time
                  </Label>
                  <input
                    id="start-time"
                    type="time"
                    value={settings.quietHours.startTime}
                    onChange={(e) => updateQuietHours('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-time" className="text-base">
                    End Time
                  </Label>
                  <input
                    id="end-time"
                    type="time"
                    value={settings.quietHours.endTime}
                    onChange={(e) => updateQuietHours('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Notifications will be paused during these hours
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-8"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  )
}
