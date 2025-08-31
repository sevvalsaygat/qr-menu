'use client'

import { useState, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { logOut } from '../lib/auth'
import { Button } from './ui/button'
import { 
  Home, 
  QrCode, 
  ShoppingBag, 
  Plus, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from 'lucide-react'
import { cn } from '../lib/utils'

// Create context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {}
})

export const useSidebar = () => useContext(SidebarContext)

interface SidebarProps {
  className?: string
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Main Content wrapper that responds to sidebar state
export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className={cn(
      "flex-1 transition-all duration-300",
      isCollapsed ? "ml-16" : "ml-56"
    )}>
      <main className="p-8">
        {children}
      </main>
    </div>
  )
}

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const { userData } = useAuth()

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
    { name: 'Products', href: '/dashboard/products', icon: Plus },
    { name: 'Orders', href: '/dashboard/orders', icon: BarChart3 }
  ]

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-56",
      className
    )}>
      {/* Header with Restaurant Name and Collapse Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {userData?.restaurantName || 'QR Menu'}
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <button
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    isCollapsed ? "justify-center" : "justify-start"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section with Settings and Sign Out */}
      <div className="border-t border-gray-200 p-2">
        <ul className="space-y-1">
          {/* Settings */}
          <li>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                pathname === '/dashboard/settings' && "bg-blue-50 text-blue-700 border-r-2 border-blue-700",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
              {!isCollapsed && <span>Settings</span>}
            </button>
          </li>
          
          {/* Sign Out */}
          <li>
            <button
              onClick={handleSignOut}
              className={cn(
                "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed ? "justify-center" : "justify-start"
              )}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}
