'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '../../../lib/auth'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address')
      setSubmitting(false)
      return
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address')
      setSubmitting(false)
      return
    }

    try {
      // Check if user exists with this email
      const checkResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: trimmedEmail })
      })

      const checkResult = await checkResponse.json()

      if (!checkResult.success || !checkResult.exists) {
        setError(checkResult.error || 'No user found with this email address.')
        return
      }

      // Send password reset email using Firebase Authentication
      console.log('Attempting to send password reset email to:', trimmedEmail)
      const resetResult = await resetPassword(trimmedEmail)
      
      if (!resetResult.success) {
        console.error('Password reset failed:', resetResult.error)
        setError(resetResult.error || 'Failed to send password reset email. Please try again.')
        return
      }

      console.log('Password reset email sent successfully')
      setSuccess(true)
    } catch (error) {
      console.error('Unexpected error during password reset:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email. Please try again.'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  A password reset link has been sent. Please check your inbox.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push('/auth')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled={submitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/auth')}
                className="w-full"
                disabled={submitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

