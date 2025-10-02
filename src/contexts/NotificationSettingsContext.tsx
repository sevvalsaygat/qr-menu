'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

interface NotificationSettingsContextType {
  settings: NotificationSettings
  isLoading: boolean
  error: string | null
  showOrderCount: boolean
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined)

const defaultSettings: NotificationSettings = {
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
}

export function NotificationSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate whether to show order count based on push notification settings
  const showOrderCount = settings.pushNotifications.newOrders

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false)
      return
    }

    // Set up real-time listener for notification settings
    const settingsRef = doc(db, 'users', user.uid)
    
    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        try {
          if (doc.exists()) {
            const userData = doc.data()
            if (userData.notificationSettings) {
              setSettings(userData.notificationSettings)
            } else {
              setSettings(defaultSettings)
            }
          } else {
            setSettings(defaultSettings)
          }
          setError(null)
        } catch (err) {
          console.error('Error processing notification settings:', err)
          setError('Failed to load notification settings')
          setSettings(defaultSettings)
        } finally {
          setIsLoading(false)
        }
      },
      (err) => {
        console.error('Error listening to notification settings:', err)
        setError('Failed to load notification settings')
        setSettings(defaultSettings)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  const value: NotificationSettingsContextType = {
    settings,
    isLoading,
    error,
    showOrderCount
  }

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  )
}

export function useNotificationSettings() {
  const context = useContext(NotificationSettingsContext)
  if (context === undefined) {
    throw new Error('useNotificationSettings must be used within a NotificationSettingsProvider')
  }
  return context
}
