// Utility functions for generating notification sounds using Web Audio API

// Global AudioContext instance that persists across calls
let globalAudioContext: AudioContext | null = null

// Initialize AudioContext with proper error handling
function getAudioContext(): AudioContext | null {
  if (!globalAudioContext) {
    try {
      globalAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch (error) {
      console.warn('Failed to create AudioContext:', error)
      return null
    }
  }

  // Resume AudioContext if it's suspended (required after user interaction)
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume().catch(error => {
      console.warn('Failed to resume AudioContext:', error)
    })
  }

  return globalAudioContext
}

// Generate notification sound using Web Audio API
export function createNotificationAudio(type: 'default' | 'gentle' | 'loud'): void {
  const audioContext = getAudioContext()
  if (!audioContext) {
    console.warn('AudioContext not available, cannot play notification sound')
    return
  }

  let frequency: number
  let duration: number
  let volume: number
  
  switch (type) {
    case 'gentle':
      frequency = 800 // Higher pitch, softer
      duration = 0.3
      volume = 0.3
      break
    case 'loud':
      frequency = 600 // Lower pitch, more attention-grabbing
      duration = 0.5
      volume = 0.8
      break
    case 'default':
    default:
      frequency = 700 // Medium pitch
      duration = 0.4
      volume = 0.5
      break
  }

  try {
    // Create oscillator for the sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
    oscillator.type = 'sine'
    
    // Set volume envelope for smooth fade in/out
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
    
    // Play the sound
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
    
    // Clean up the oscillator after it finishes
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      gainNode.disconnect()
    })
    
  } catch (error) {
    console.warn('Error creating notification sound:', error)
  }
}

// Legacy function for backward compatibility (now just calls the new function)
export function generateNotificationSound(type: 'default' | 'gentle' | 'loud'): string {
  createNotificationAudio(type)
  return `sound-${type}`
}
