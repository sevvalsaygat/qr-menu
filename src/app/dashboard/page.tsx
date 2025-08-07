'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import { logOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut, User, Building } from 'lucide-react';

export default function DashboardPage() {
  const { user, userData, loading, isRedirecting } = useRequireAuth({
    requireEmailVerification: true
  });

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back!</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your account details and verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Verified</p>
                  <p className="text-sm text-gray-600">
                    {user?.emailVerified ? '✅ Verified' : '❌ Not verified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Account Created</p>
                  <p className="text-sm text-gray-600">
                    {userData?.createdAt ? (
                      typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt && userData.createdAt.toDate
                        ? userData.createdAt.toDate().toLocaleDateString()
                        : userData.createdAt instanceof Date
                        ? userData.createdAt.toLocaleDateString()
                        : 'N/A'
                    ) : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Restaurant Information
                </CardTitle>
                <CardDescription>
                  Your restaurant details and subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">Restaurant Name</p>
                  <p className="text-sm text-gray-600">{userData?.restaurantName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Subscription</p>
                  <p className="text-sm text-gray-600">
                    {userData?.subscription?.plan || 'No subscription'} 
                    {userData?.subscription?.status === 'active' && ' (Active)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Trial Expires</p>
                  <p className="text-sm text-gray-600">
                    {userData?.subscription?.expiresAt ? (
                      typeof userData.subscription.expiresAt === 'object' && 'toDate' in userData.subscription.expiresAt && userData.subscription.expiresAt.toDate
                        ? userData.subscription.expiresAt.toDate().toLocaleDateString()
                        : userData.subscription.expiresAt instanceof Date
                        ? userData.subscription.expiresAt.toLocaleDateString()
                        : 'N/A'
                    ) : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Complete these steps to set up your QR menu system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-200 rounded-full">
                        <span className="text-sm font-medium text-blue-800">1</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Create your first table</h4>
                      <p className="text-sm text-gray-600">Generate QR codes for your restaurant tables</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                        <span className="text-sm font-medium text-gray-600">2</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Build your menu</h4>
                      <p className="text-sm text-gray-600">Add categories and products to your digital menu</p>
                    </div>
                  </div>

                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                        <span className="text-sm font-medium text-gray-600">3</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Start receiving orders</h4>
                      <p className="text-sm text-gray-600">Print QR codes and monitor orders in real-time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}