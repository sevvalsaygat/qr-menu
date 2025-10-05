'use client'

import React, { createContext, useContext, useCallback, useEffect } from 'react'
import { useNotificationSettings } from './NotificationSettingsContext'
import { createNotificationAudio } from '@/lib/sound-generator'

interface SoundNotificationContextType {
  playNewOrderSound: () => void
  playTestSound: () => void
  initializeAudio: () => void
  isAudioInitialized: boolean
}

const SoundNotificationContext = createContext<SoundNotificationContextType | undefined>(undefined)

export function SoundNotificationProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useNotificationSettings()
  const [isAudioInitialized, setIsAudioInitialized] = React.useState(false)

  // Initialize audio context on first user interaction
  const initializeAudio = useCallback(() => {
    if (typeof window === 'undefined') return
    
    // Create a dummy audio context to initialize it
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          setIsAudioInitialized(true)
        }).catch(error => {
          console.warn('Failed to resume audio context:', error)
        })
      } else {
        setIsAudioInitialized(true)
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error)
    }
  }, [])

  // Initialize audio on first user interaction (click anywhere on the page)
  useEffect(() => {
    if (typeof window === 'undefined' || isAudioInitialized) return

    const handleFirstInteraction = () => {
      initializeAudio()
      // Remove the event listener after first interaction
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }

    // Listen for any user interaction to initialize audio
    document.addEventListener('click', handleFirstInteraction, { once: true })
    document.addEventListener('touchstart', handleFirstInteraction, { once: true })
    document.addEventListener('keydown', handleFirstInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [initializeAudio, isAudioInitialized])

  // Play new order sound based on current settings
  const playNewOrderSound = useCallback(() => {
    // Check if sound notifications are enabled
    if (!settings.soundNotifications.newOrders) {
      return
    }

    // Don't play sound if sound type is 'off'
    if (settings.soundNotifications.soundType === 'off') {
      return
    }

    try {
      // Create and play the notification sound
      createNotificationAudio(settings.soundNotifications.soundType)
    } catch (error) {
      console.warn('Error creating notification sound:', error)
    }
  }, [settings.soundNotifications])

  // Play test sound for testing purposes
  const playTestSound = useCallback(() => {
    try {
      // Don't play sound if sound type is 'off'
      if (settings.soundNotifications.soundType === 'off') {
        return
      }
      
      // Initialize audio if not already done
      if (!isAudioInitialized) {
        initializeAudio()
      }
      
      // Create and play the test sound
      createNotificationAudio(settings.soundNotifications.soundType as 'default' | 'gentle' | 'loud')
    } catch (error) {
      console.warn('Error creating test sound:', error)
    }
  }, [settings.soundNotifications, isAudioInitialized, initializeAudio])

  const value: SoundNotificationContextType = {
    playNewOrderSound,
    playTestSound,
    initializeAudio,
    isAudioInitialized
  }

  return (
    <SoundNotificationContext.Provider value={value}>
      {children}
    </SoundNotificationContext.Provider>
  )
}

export function useSoundNotifications() {
  const context = useContext(SoundNotificationContext)
  if (context === undefined) {
    throw new Error('useSoundNotifications must be used within a SoundNotificationProvider')
  }
  return context
}
