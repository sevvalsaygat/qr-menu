'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '../../hooks/useAuth'
import { logOut } from '../../lib/auth'
import { Button } from '../../components/ui/button'
import { LogOut, User } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shouldRedirect, loading, user, userData } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (shouldRedirect && !loading) {
      router.push('/auth')
    }
  }, [shouldRedirect, loading, router])

  const handleSignOut = async () => {
    const result = await logOut()
    if (result.success) {
      router.push('/auth')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (shouldRedirect) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                QR Menu Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{userData?.restaurantName}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
