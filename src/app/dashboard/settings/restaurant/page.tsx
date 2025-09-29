'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { ArrowLeft, Building, Save, Loader2, CheckCircle, HelpCircle } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import { getUserRestaurants, updateRestaurant } from '../../../../lib/firestore'
import { updateUserRestaurantName } from '../../../../lib/auth'
import { Restaurant } from '../../../../types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select'

export default function RestaurantEditPage() {
  const router = useRouter()
  const { user, refreshUserData } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [currency, setCurrency] = useState<'₺' | '$' | '€'>('$')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load restaurant data
  useEffect(() => {
    const loadRestaurant = async () => {
      if (!user?.uid) return

      try {
        setLoading(true)
        setError('')
        const restaurants = await getUserRestaurants(user.uid)
        if (restaurants.length > 0) {
          const restaurantData = restaurants[0]
          setRestaurant(restaurantData)
          setRestaurantName(restaurantData.name)
          const currentCurrency = restaurantData.settings?.currency || '$'
          if (currentCurrency === '₺' || currentCurrency === '$' || currentCurrency === '€') {
            setCurrency(currentCurrency)
          } else {
            setCurrency('$')
          }
        } else {
          setError('No restaurant found. Please contact support.')
        }
      } catch (err) {
        console.error('Error loading restaurant:', err)
        setError('Failed to load restaurant data')
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [user?.uid])

  // Handle saving restaurant info
  const handleSave = async () => {
    if (!restaurant || !restaurantName.trim() || !user?.uid) return

    try {
      setSaving(true)
      setError('')
      
      const trimmedName = restaurantName.trim()
      
      // Update both restaurant document and user document
      await Promise.all([
        updateRestaurant(restaurant.id, {
          name: trimmedName,
          settings: {
            ...restaurant.settings,
            currency
          }
        }),
        updateUserRestaurantName(user.uid, trimmedName)
      ])

      // Update local state
      setRestaurant(prev => prev ? { ...prev, name: trimmedName, settings: { ...prev.settings, currency } } : null)
      
      // Refresh user data to update sidebar and dashboard
      await refreshUserData()
      
      setSuccess('Changes have been successfully updated!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error updating restaurant name:', err)
      setError('Failed to update restaurant name. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.push('/dashboard/settings')
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center space-x-2">
          <Building className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Restaurant Information</h1>
            <p className="text-gray-600">Update your restaurant details</p>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading restaurant data...</span>
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
        <Building className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Restaurant Information</h1>
          <p className="text-gray-600">Update your restaurant details</p>
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

      {/* Success Message */}
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

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restaurant Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Restaurant Information</span>
          </CardTitle>
          <CardDescription>
            Update your restaurant name and other basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="restaurant-name">Restaurant Name</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-red-600">
                      The restaurant name you set here will be displayed in your customer menus, 
                      order confirmations, and throughout the dashboard. Make sure it accurately 
                      represents your business.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="restaurant-name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter restaurant name"
              maxLength={100}
              className="w-full max-w-md"
            />
          </div>

          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as '₺' | '$' | '€')}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="₺">₺</SelectItem>
                <SelectItem value="$">$</SelectItem>
                <SelectItem value="€">€</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <div className="flex space-x-4">
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !restaurantName.trim() ||
                (restaurantName === restaurant?.name && currency === (restaurant?.settings?.currency || '$'))
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
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
