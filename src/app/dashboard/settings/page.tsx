'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Settings as SettingsIcon, User, Building, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  const handleEditRestaurantInfo = () => {
    router.push('/dashboard/settings/restaurant')
  }
  const handleEditAccount = () => {
    router.push('/dashboard/settings/user')
  }

  const handleConfigureNotifications = () => {
    router.push('/dashboard/settings/notifications')
  }
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your restaurant settings and preferences</p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Restaurant Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Restaurant Profile</span>
            </CardTitle>
            <CardDescription>
              Update your restaurant information and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Manage your restaurant name, address, contact information, and operating hours.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleEditRestaurantInfo}
              >
                Edit Restaurant Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Settings</span>
            </CardTitle>
            <CardDescription>
              Manage your account and login preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Update your email, password, and account security settings.
              </p>
              <Button variant="outline" className="w-full" onClick={handleEditAccount}>
                Edit Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
            <CardDescription>
              Configure how you receive order notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Set up email alerts, sound notifications, and order update preferences.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleConfigureNotifications}
              >
                Configure Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>
              Manage security settings and data privacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Two-factor authentication, session management, and data export options.
              </p>
              <Button variant="outline" className="w-full">
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
