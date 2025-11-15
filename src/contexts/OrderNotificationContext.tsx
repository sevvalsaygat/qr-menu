'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { Order } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { onSnapshot, collection, query, where, orderBy, DocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getUserRestaurants } from '@/lib/firestore'
import { useSoundNotifications } from './SoundNotificationContext'

interface OrderNotificationContextType {
  pendingOrders: Order[]
  confirmedOrders: Order[]
  completedOrders: Order[]
  totalPendingCount: number
  totalConfirmedCount: number
  totalCompletedCount: number
  totalActiveOrders: number
  isLoading: boolean
  error: string | null
  refreshOrders: () => void
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined)

export function OrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, userData } = useAuth()
  const { playNewOrderSound } = useSoundNotifications()
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([])
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previousOrderCountRef = useRef<number>(0)
  const hasInitializedRef = useRef<boolean>(false)
  const previousOrderIdsRef = useRef<Set<string>>(new Set())

  // Helper function to convert Firestore document to Order
  const docToOrder = (doc: DocumentSnapshot): Order => {
    const data = doc.data()
    return {
      id: doc.id,
      restaurantId: data?.restaurantId || '',
      tableId: data?.tableId || '',
      tableName: data?.tableName || '',
      items: data?.items || [],
      summary: data?.summary || { subtotal: 0, tax: 0, total: 0, itemCount: 0 },
      customer: data?.customer,
      specialInstructions: data?.specialInstructions,
      isCompleted: data?.isCompleted || false,
      isCancelled: data?.isCancelled || false,
      cancelledAt: data?.cancelledAt,
      cancelledBy: data?.cancelledBy,
      createdAt: data?.createdAt
    }
  }

  // Calculate totals
  const totalPendingCount = pendingOrders.length
  const totalConfirmedCount = confirmedOrders.length
  const totalCompletedCount = completedOrders.length
  const totalActiveOrders = totalPendingCount + totalConfirmedCount

  const refreshOrders = () => {
    // This will trigger the useEffect to re-fetch orders
    setIsLoading(true)
  }

  useEffect(() => {
    if (!user || !userData) {
      setIsLoading(false)
      return
    }

    // Reset initialization flags when user changes
    hasInitializedRef.current = false
    previousOrderCountRef.current = 0

    // Get the restaurant ID from user's restaurants
    const setupOrderListeners = async () => {
      try {
        const restaurants = await getUserRestaurants(user.uid)
        if (restaurants.length === 0) {
          setIsLoading(false)
          return
        }
        
        const restaurantId = restaurants[0].id // Use the first restaurant

    // Set up real-time listener for all active orders (pending + confirmed)
    const unsubscribeActiveOrders = onSnapshot(
      query(
        collection(db, 'restaurants', restaurantId, 'orders'),
        where('isCompleted', '==', false),
        where('isCancelled', '==', false),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const orders: Order[] = []
        snapshot.forEach((doc) => {
          orders.push(docToOrder(doc))
        })
        
        // For now, we'll treat all active orders as "pending" since we don't have a status field
        // In a real implementation, you might want to add a status field to distinguish between pending/confirmed
        setPendingOrders(orders)
        setConfirmedOrders([]) // Empty for now since we don't have status differentiation
        
        // Check if new orders have arrived or existing orders have been updated
        const currentOrderCount = orders.length
        const currentOrderIds = new Set(orders.map(order => order.id))
        // Mark as initialized after first load
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true
          previousOrderIdsRef.current = currentOrderIds
        } else {
          const newOrders = orders.filter(order => !previousOrderIdsRef.current.has(order.id))
          if (newOrders.length > 0) {
            playNewOrderSound()
          }
        }
        
        // Update tracking references
        previousOrderCountRef.current = currentOrderCount
        previousOrderIdsRef.current = currentOrderIds
        
        setIsLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Error fetching active orders:', error)
        setError('Failed to load orders')
        setIsLoading(false)
      }
    )

    // Set up real-time listener for completed orders
    const unsubscribeCompleted = onSnapshot(
      query(
        collection(db, 'restaurants', restaurantId, 'orders'),
        where('isCompleted', '==', true),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const orders: Order[] = []
        snapshot.forEach((doc) => {
          orders.push(docToOrder(doc))
        })
        setCompletedOrders(orders)
      },
      (error) => {
        console.error('Error fetching completed orders:', error)
      }
    )

        // Cleanup listeners on unmount
        return () => {
          unsubscribeActiveOrders()
          unsubscribeCompleted()
        }
      } catch (error) {
        console.error('Error setting up order listeners:', error)
        setError('Failed to load orders')
        setIsLoading(false)
      }
    }

    const cleanup = setupOrderListeners()
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [user, userData, playNewOrderSound])

  const value: OrderNotificationContextType = {
    pendingOrders,
    confirmedOrders,
    completedOrders,
    totalPendingCount,
    totalConfirmedCount,
    totalCompletedCount,
    totalActiveOrders,
    isLoading,
    error,
    refreshOrders
  }

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  )
}

export function useOrderNotifications() {
  const context = useContext(OrderNotificationContext)
  if (context === undefined) {
    throw new Error('useOrderNotifications must be used within an OrderNotificationProvider')
  }
  return context
}
