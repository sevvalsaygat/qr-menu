'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '../../hooks/useAuth'
import { Sidebar, SidebarProvider, MainContent } from '../../components/sidebar'
import { OrderNotificationProvider } from '../../contexts/OrderNotificationContext'
import { NotificationSettingsProvider } from '../../contexts/NotificationSettingsContext'
import { SoundNotificationProvider } from '../../contexts/SoundNotificationContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { shouldRedirect, loading } = useRequireAuth()
  const router = useRouter()

  useEffect(() => {
    if (shouldRedirect && !loading) {
      router.push('/auth')
    }
  }, [shouldRedirect, loading, router])

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
    <NotificationSettingsProvider>
      <SoundNotificationProvider>
        <OrderNotificationProvider>
          <SidebarProvider>
            <div className="min-h-screen bg-gray-50 flex">
              {/* Sidebar */}
              <Sidebar className="fixed h-full z-30" />
              
              {/* Main Content Area */}
              <MainContent>
                {children}
              </MainContent>
            </div>
          </SidebarProvider>
        </OrderNotificationProvider>
      </SoundNotificationProvider>
    </NotificationSettingsProvider>
  )
}
