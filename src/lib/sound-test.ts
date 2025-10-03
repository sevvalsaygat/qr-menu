// Simple test file to verify sound generation works
import { createNotificationAudio } from './sound-generator'

// Test function that can be called from browser console
export function testSoundGeneration() {
  console.log('Testing sound generation...')
  
  // Test all sound types
  const soundTypes: ('default' | 'gentle' | 'loud')[] = ['default', 'gentle', 'loud']
  
  soundTypes.forEach((type, index) => {
    setTimeout(() => {
      console.log(`Playing ${type} sound...`)
      createNotificationAudio(type)
    }, index * 1000) // Play each sound 1 second apart
  })
  
  console.log('Sound test completed. Check console for any errors.')
}

// Test function to simulate first order detection
export function testFirstOrderSound() {
  console.log('🎯 Testing first order sound detection...')
  console.log('This simulates what should happen when the very first order arrives.')
  
  setTimeout(() => {
    console.log('🎵 Playing notification sound as if first order arrived...')
    createNotificationAudio('default')
    console.log('✅ If you heard the sound, first-order detection should work!')
  }, 500)
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as Window & { testSoundGeneration?: () => void; testFirstOrderSound?: () => void }).testSoundGeneration = testSoundGeneration
  ;(window as Window & { testSoundGeneration?: () => void; testFirstOrderSound?: () => void }).testFirstOrderSound = testFirstOrderSound
}
