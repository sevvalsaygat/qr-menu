'use client'

import { useState, useEffect, useRef } from 'react'
import { calculatePasswordStrength, PasswordStrengthResult } from '../../lib/password-strength'
import { Check } from 'lucide-react'

interface PasswordStrengthTooltipProps {
  password: string
  username?: string
  isVisible: boolean
  onClose: () => void
}

export default function PasswordStrengthTooltip({ 
  password, 
  username, 
  isVisible,
  onClose
}: PasswordStrengthTooltipProps) {
  const [strength, setStrength] = useState<PasswordStrengthResult>({
    score: 0,
    level: 'weak',
    feedback: [],
    isValid: false,
    criteria: {
      minLength: false,
      hasLowercase: false,
      hasUppercase: false,
      hasNumbers: false,
      hasSpecialChars: false,
      notContainsUsername: false,
      notCommonPassword: false
    }
  })

  const [isClosing, setIsClosing] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (password) {
      const result = calculatePasswordStrength(password, username)
      setStrength(result)
    } else {
      setStrength({
        score: 0,
        level: 'weak',
        feedback: [],
        isValid: false,
        criteria: {
          minLength: false,
          hasLowercase: false,
          hasUppercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
          notContainsUsername: false,
          notCommonPassword: false
        }
      })
    }
  }, [password, username])

  // Click outside to close - only when password is strong
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        // Only allow closing when password is strong (all criteria met)
        if (strength.isValid && !isClosing) {
          setIsClosing(true)
          // Wait for animation to complete before actually closing
          setTimeout(() => {
            onClose()
          }, 300) // Match the animation duration
        }
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose, strength.isValid, isClosing])

  // Reset closing state when tooltip becomes visible again
  useEffect(() => {
    if (isVisible) {
      setIsClosing(false)
    }
  }, [isVisible])

  if (!isVisible || !password) {
    return null
  }

  // Calculate progress steps based on criteria (4 steps total)
  const getProgressSteps = () => {
    const criteriaMet = [
      strength.criteria.minLength,
      strength.criteria.hasLowercase || strength.criteria.hasUppercase, // More flexible: either lowercase OR uppercase
      strength.criteria.hasNumbers,
      strength.criteria.hasSpecialChars
    ]
    
    const metCount = criteriaMet.filter(Boolean).length
    
    // Determine the current color based on progress
    const getCurrentColor = () => {
      if (metCount === 0) return 'bg-gray-300'
      if (metCount === 1) return 'bg-orange-400'
      if (metCount === 2) return 'bg-yellow-500'
      if (metCount === 3) return 'bg-green-500'
      if (metCount === 4) return 'bg-green-700'
      return 'bg-gray-300'
    }
    
    const currentColor = getCurrentColor()
    
    const steps = [
      { 
        met: metCount >= 1, 
        color: metCount >= 1 ? currentColor : 'bg-gray-300'
      },
      { 
        met: metCount >= 2, 
        color: metCount >= 2 ? currentColor : 'bg-gray-300'
      },
      { 
        met: metCount >= 3, 
        color: metCount >= 3 ? currentColor : 'bg-gray-300'
      },
      { 
        met: metCount >= 4, 
        color: metCount >= 4 ? currentColor : 'bg-gray-300'
      }
    ]
    return steps
  }

  const progressSteps = getProgressSteps()
  const completedSteps = progressSteps.filter(step => step.met).length

  const getStrengthTitle = () => {
    if (completedSteps === 0) return 'Weak Password'
    if (completedSteps === 1) return 'Weak Password'
    if (completedSteps === 2) return 'Average Password'
    if (completedSteps === 3) return 'Good Password'
    return 'Strong Password'
  }

  const getStrengthTitleColor = () => {
    if (completedSteps === 0) return 'text-red-600'
    if (completedSteps === 1) return 'text-orange-600'
    if (completedSteps === 2) return 'text-yellow-600'
    if (completedSteps === 3) return 'text-green-600'
    return 'text-green-700'
  }

  const criteriaList = [
    {
      key: 'case',
      label: 'Upper & lower case letters',
      met: strength.criteria.hasLowercase || strength.criteria.hasUppercase // More flexible: either lowercase OR uppercase
    },
    {
      key: 'symbol',
      label: 'A symbol (#$&)',
      met: strength.criteria.hasSpecialChars
    },
    {
      key: 'length',
      label: 'A longer password',
      met: strength.criteria.minLength
    }
  ]

  return (
    <div
      ref={tooltipRef}
      className={`absolute z-50 w-72 p-4 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
        isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        top: '50%',
        right: '100%',
        marginRight: '12px',
        transform: isClosing ? 'translateY(-50%) scale(0.95)' : 'translateY(-50%) scale(1)',
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {/* Arrow pointing to the right (towards password field) */}
      <div 
        className="absolute top-1/2 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent"
        style={{
          borderLeftColor: '#ffffff',
          transform: 'translateY(-50%)'
        }}
      />
      <div 
        className="absolute top-1/2 -right-3 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent"
        style={{
          borderLeftColor: '#e5e7eb',
          transform: 'translateY(-50%)'
        }}
      />
      
      {/* Title */}
      <div className="mb-3">
        <h3 className={`text-lg font-bold ${getStrengthTitleColor()}`}>
          {getStrengthTitle()}
        </h3>
      </div>

      {/* Progress Steps */}
      <div className="mb-4">
        <div className="flex space-x-1">
          {progressSteps.map((step, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-sm transition-all duration-300 ${step.color}`}
            />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-800">It&apos;s better to have:</div>
        <div className="space-y-1">
          {criteriaList.map((criterion) => (
            <div key={criterion.key} className="flex items-center space-x-2 text-sm">
              {criterion.met ? (
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                </div>
              )}
              <span 
                className={`${
                  criterion.met 
                    ? 'text-gray-400 line-through' 
                    : 'text-blue-600'
                }`}
              >
                {criterion.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
