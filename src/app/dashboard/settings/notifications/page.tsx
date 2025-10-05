'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Switch } from '../../../../components/ui/switch'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Separator } from '../../../../components/ui/separator'
import { Bell, ArrowLeft, CheckCircle, AlertCircle, Loader2, Volume2, VolumeX, Clock, Play, X } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { useNotificationSettings } from '../../../../contexts/NotificationSettingsContext'
import { useSoundNotifications } from '../../../../contexts/SoundNotificationContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../../../lib/firebase'
import { createNotificationAudio } from '../../../../lib/sound-generator'

interface NotificationSettings {
  soundNotifications: {
    newOrders: boolean
    soundType: 'default' | 'gentle' | 'loud' | 'off'
  }
  pushNotifications: {
    newOrders: boolean
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
  const { isInQuietHours } = useNotificationSettings()
  const { initializeAudio, isAudioInitialized } = useSoundNotifications()
  const [settings, setSettings] = useState<NotificationSettings>({
    soundNotifications: {
      newOrders: true,
      soundType: 'default'
    },
    pushNotifications: {
      newOrders: true
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
  const [saveSuccess, setSaveSuccess] = useState(false)

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
      setSaveSuccess(false)

      const settingsRef = doc(db, 'users', user.uid)
      await setDoc(settingsRef, {
        notificationSettings: settings
      }, { merge: true })

      setSuccess('Notification settings saved successfully!')
      setSaveSuccess(true)
      
      // Clear success message after 5 seconds (increased from 3 seconds)
      setTimeout(() => {
        setSuccess(null)
        setSaveSuccess(false)
      }, 5000)
    } catch (err) {
      console.error('Error saving notification settings:', err)
      setError('Failed to save notification settings. Please try again.')
      setSaveSuccess(false)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/settings')
  }

  // Local test sound function that uses current local state
  const handleTestSound = () => {
    console.log('🧪 Testing sound with current selection:', settings.soundNotifications.soundType)
    
    // Don't play sound if sound type is 'off'
    if (settings.soundNotifications.soundType === 'off') {
      console.log('❌ Sound type is set to off, not playing test sound')
      return
    }
    
    // Always initialize audio if not already done (automatic initialization)
    if (!isAudioInitialized) {
      console.log('🔄 Audio not initialized, automatically initializing...')
      initializeAudio()
      // Give a small delay for audio context to be ready
      setTimeout(() => {
        console.log('🎵 Playing test sound after automatic initialization:', settings.soundNotifications.soundType)
        createNotificationAudio(settings.soundNotifications.soundType as 'default' | 'gentle' | 'loud')
      }, 100)
    } else {
      console.log('🎵 Playing test sound immediately:', settings.soundNotifications.soundType)
      createNotificationAudio(settings.soundNotifications.soundType as 'default' | 'gentle' | 'loud')
    }
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

      {/* Success Message - Prominent Display */}
      {success && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <Card className="border-green-500 bg-green-100 shadow-lg ring-1 ring-green-500/20 min-w-80 animate-pulse">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-green-900">Settings Saved!</p>
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSuccess(null)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-200 p-1 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Message - Prominent Display */}
      {error && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <Card className="border-red-500 bg-red-100 shadow-lg ring-1 ring-red-500/20 min-w-80">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-200 p-1 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


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
            {settings.soundNotifications.soundType !== 'off' && (
              <p className="text-xs text-blue-600 font-medium">
                Currently selected: <span className="font-semibold">{settings.soundNotifications.soundType}</span> sound
                <br />
                <span className="text-gray-500">Changes take effect immediately for testing</span>
              </p>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">
                Test Sound
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestSound}
                disabled={settings.soundNotifications.soundType === 'off'}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Sound
              </Button>
            </div>
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
              <Label htmlFor="push-new-orders" className="text-base">
                New Orders
              </Label>
              <p className="text-sm text-gray-600">
                Push notification for new orders and show order count badge in sidebar
              </p>
            </div>
            <Switch
              id="push-new-orders"
              checked={settings.pushNotifications.newOrders}
              onCheckedChange={(checked) => updatePushSettings('newOrders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Quiet Hours</span>
            {settings.quietHours.enabled && isInQuietHours && (
              <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                Currently Active
              </span>
            )}
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
          className={`px-8 transition-all duration-200 ${
            saveSuccess 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : saving 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  )
}
