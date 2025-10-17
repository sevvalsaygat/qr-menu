'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface OrderDisplayContextType {
  showCanceledOrders: boolean
  setShowCanceledOrders: (show: boolean) => void
  toggleShowCanceledOrders: () => void
}

const OrderDisplayContext = createContext<OrderDisplayContextType | undefined>(undefined)

export function OrderDisplayProvider({ children }: { children: React.ReactNode }) {
  const [showCanceledOrders, setShowCanceledOrders] = useState<boolean>(true)
  const [mounted, setMounted] = useState(false)

  // Load setting from localStorage on mount
  useEffect(() => {
    const savedSetting = localStorage.getItem('showCanceledOrders')
    if (savedSetting !== null) {
      setShowCanceledOrders(savedSetting === 'true')
    }
    setMounted(true)
  }, [])

  // Save setting to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('showCanceledOrders', showCanceledOrders.toString())
    }
  }, [showCanceledOrders, mounted])

  const toggleShowCanceledOrders = () => {
    setShowCanceledOrders(prev => !prev)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <OrderDisplayContext.Provider value={{ 
      showCanceledOrders, 
      setShowCanceledOrders, 
      toggleShowCanceledOrders 
    }}>
      {children}
    </OrderDisplayContext.Provider>
  )
}

export function useOrderDisplay() {
  const context = useContext(OrderDisplayContext)
  if (context === undefined) {
    throw new Error('useOrderDisplay must be used within an OrderDisplayProvider')
  }
  return context
}

