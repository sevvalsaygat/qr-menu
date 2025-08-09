'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useRequireAuth } from '../../hooks/useAuth'
import { logOut } from '../../lib/auth'
import { Button } from '../../components/ui/button'
import { LogOut, User, Home, QrCode, ShoppingBag, BarChart3 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shouldRedirect, loading, user, userData } = useRequireAuth()
  const router = useRouter()
  const pathname = usePathname()

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

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tables', href: '/dashboard/tables', icon: QrCode },
    { name: 'Categories', href: '/dashboard/categories', icon: ShoppingBag },
    { name: 'Orders', href: '/dashboard/orders', icon: BarChart3 }
  ]

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

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center space-x-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
