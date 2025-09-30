'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEmail as fbUpdateEmail, updatePassword as fbUpdatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { ArrowLeft, Save, User, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { db } from '../../../../lib/firebase'
import { updateUserRestaurantName } from '../../../../lib/auth'

export default function UserSettingsPage() {
  const router = useRouter()
  const { user, userData, refreshUserData } = useAuth()

  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    try {
      setBusinessName(userData?.restaurantName || '')
      setEmail(user?.email || userData?.email || '')
    } finally {
      setLoading(false)
    }
  }, [user?.uid, user?.email, userData?.restaurantName, userData?.email])

  const handleBack = () => {
    router.push('/dashboard/settings')
  }

  const handleVerifyOldPassword = async () => {
    if (!user?.email || !user) return
    if (!oldPassword) {
      setError('Please enter your current password to continue')
      return
    }
    try {
      setSaving(true)
      setError('')
      const credential = EmailAuthProvider.credential(user.email, oldPassword)
      await reauthenticateWithCredential(user, credential)
      setIsPasswordVerified(true)
    } catch {
      setIsPasswordVerified(false)
      setError('Current password is incorrect')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!user?.uid) return
    const trimmedBusiness = businessName.trim()
    const trimmedEmail = email.trim()
    const trimmedNewPassword = newPassword.trim()
    const trimmedConfirm = confirmPassword.trim()

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const updates: Array<Promise<unknown>> = []
      let didChangePassword = false

      if (trimmedBusiness && trimmedBusiness !== userData?.restaurantName) {
        updates.push(updateUserRestaurantName(user.uid, trimmedBusiness))
      }

      if (trimmedEmail && trimmedEmail !== (user.email || '')) {
        // Update Firebase Auth email first
        updates.push(
          fbUpdateEmail(user, trimmedEmail).catch(() => {
            // Surface a friendly error but continue to update Firestore copy
            throw new Error('Failed to update sign-in email. You may need to re-login to change email.')
          })
        )
      }

      // Password change flow
      if (trimmedNewPassword || trimmedConfirm) {
        if (!isPasswordVerified) {
          throw new Error('Please verify your current password first')
        }
        if (!trimmedNewPassword || !trimmedConfirm) {
          throw new Error('Please fill in both new password fields')
        }
        if (trimmedNewPassword !== trimmedConfirm) {
          throw new Error('New password and confirmation do not match')
        }
        updates.push(
          fbUpdatePassword(user, trimmedNewPassword).catch(() => {
            throw new Error('Failed to update password. You may need to re-login to change password.')
          })
        )
        didChangePassword = true
      }

      // Always ensure Firestore user doc reflects latest fields
      updates.push(
        setDoc(doc(db, 'users', user.uid), {
          email: trimmedEmail || user.email || '',
          restaurantName: trimmedBusiness || userData?.restaurantName || ''
        }, { merge: true })
      )

      await Promise.all(updates)

      await refreshUserData()
      setSuccess('Profile updated successfully')
      // If password was changed, reset and hide password fields
      if (didChangePassword) {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setIsPasswordVerified(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)
      }
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError('Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-2">
          <User className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Account Settings</h1>
            <p className="text-gray-600">Manage your account and login preferences</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading profile...</span>
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
        <User className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Account Settings</h1>
          <p className="text-gray-600">Manage your account and login preferences</p>
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
              <User className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
          <CardDescription>
            Update your business name and email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
              maxLength={100}
              className="w-full max-w-md"
            />
          </div>

          

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="old-password">Current Password</Label>
            <div className="flex items-center space-x-2 max-w-md">
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleVerifyOldPassword}
                disabled={saving || !oldPassword}
              >
                Verify
              </Button>
            </div>
            {isPasswordVerified && (
              <p className="text-xs text-green-600">Current password verified</p>
            )}
          </div>

          {isPasswordVerified && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative w-full max-w-md">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative w-full max-w-md">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
            </>
          )}

          <div className="flex space-x-4">
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                (!businessName.trim() && !email.trim() && !(isPasswordVerified && !!newPassword.trim() && !!confirmPassword.trim())) ||
                (isPasswordVerified && !!newPassword && !!confirmPassword && newPassword !== confirmPassword)
              }
              className="flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleBack} disabled={saving}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


