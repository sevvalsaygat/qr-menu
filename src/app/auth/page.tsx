'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import PasswordStrengthTooltip from '../../components/ui/password-strength-tooltip'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false)
  const [passwordMatchError, setPasswordMatchError] = useState('')
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  const validatePasswordMatch = () => {
    if (isSignUp && confirmPassword && password !== confirmPassword) {
      setPasswordMatchError('Passwords do not match')
    } else {
      setPasswordMatchError('')
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  // Show loading while checking auth or redirecting
  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const formPassword = formData.get('password') as string
    const formConfirmPassword = formData.get('confirmPassword') as string
    const restaurantName = formData.get('restaurantName') as string

    // Validate password match for sign-up
    if (isSignUp && formPassword !== formConfirmPassword) {
      setPasswordMatchError('Passwords do not match')
      setSubmitting(false)
      return
    }

    try {
      if (isSignUp) {
        const result = await signUp(email, formPassword, restaurantName)
        if (result.success) {
          router.push('/dashboard')
        } else {
          setError(result.error || 'Failed to create account')
        }
      } else {
        const result = await signIn(email, formPassword)
        if (result.success) {
          router.push('/dashboard')
        } else {
          setError(result.error || 'Failed to sign in')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Start managing your restaurant menu' 
              : 'Welcome back to QR Menu'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} autoComplete="off" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                disabled={submitting}
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative" style={{ position: 'relative' }}>
                {/* Strong indicator - appears on the right when all criteria are met */}
                {isSignUp && password && (() => {
                  const criteriaMet = [
                    password.length >= 8,
                    /[a-z]/.test(password) || /[A-Z]/.test(password), // More flexible: either lowercase OR uppercase
                    /\d/.test(password),
                    /[!@#$%^&*(),.?":{}|<>]/.test(password)
                  ]
                  const allCriteriaMet = criteriaMet.every(Boolean)
                  
                  return allCriteriaMet ? (
                    <div className="absolute right-12 top-1/2 transform -translate-y-1/2 z-10">
                      <span className="text-green-800 font-semibold text-sm">Strong</span>
                    </div>
                  ) : null
                })()}
                
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  disabled={submitting}
                  minLength={8}
                  className="pr-10"
                  autoComplete="off"
                  value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => {
                  if (!isSignUp) return
                  if (hideTooltipTimeoutRef.current) {
                    clearTimeout(hideTooltipTimeoutRef.current)
                    hideTooltipTimeoutRef.current = null
                  }
                  setShowPasswordTooltip(true)
                }}
                onBlur={() => {
                  if (!isSignUp) return
                  // Delay hiding to allow clicking on tooltip
                  hideTooltipTimeoutRef.current = setTimeout(() => {
                    setShowPasswordTooltip(false)
                    hideTooltipTimeoutRef.current = null
                  }, 200)
                }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
                
                {/* Password Strength Tooltip */}
                {isSignUp && (
                  <PasswordStrengthTooltip
                    password={password}
                    username={username}
                    isVisible={showPasswordTooltip}
                    onClose={() => setShowPasswordTooltip(false)}
                  />
                )}
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative" style={{ position: 'relative' }}>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                    disabled={submitting}
                    minLength={6}
                    className={`pr-10 ${passwordMatchError ? 'border-red-500' : ''}`}
                    autoComplete="off"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={validatePasswordMatch}
                    onFocus={() => setPasswordMatchError('')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={submitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                  
                  {/* Password Match Error Tooltip */}
                  {passwordMatchError && (
                    <div 
                      className="absolute z-50 w-64 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg"
                      style={{
                        top: '50%',
                        right: '100%',
                        marginRight: '12px',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {/* Arrow pointing to the right (towards the input field) */}
                      <div 
                        className="absolute top-1/2 -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent"
                        style={{
                          borderLeftColor: '#fef2f2',
                          transform: 'translateY(-50%)'
                        }}
                      />
                      <div 
                        className="absolute top-1/2 -right-3 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent"
                        style={{
                          borderLeftColor: '#fecaca',
                          transform: 'translateY(-50%)'
                        }}
                      />
                      
                      <div className="text-sm text-red-700 font-medium">
                        {passwordMatchError}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  placeholder="Enter your restaurant name"
                  required
                  disabled={submitting}
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setSuccess('')
                setShowPassword(false)
                setShowConfirmPassword(false)
                setEmail('')
                setPassword('')
                setConfirmPassword('')
                setUsername('')
                setShowPasswordTooltip(false)
                setPasswordMatchError('')
                if (formRef.current) formRef.current.reset()
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={submitting}
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
