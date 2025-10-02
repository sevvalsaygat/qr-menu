// Test utility functions for order notifications
import { createOrder } from './firestore'
import { Order } from '../types'

// Test function to create a sample order for testing notifications
export const createTestOrder = async (restaurantId: string, tableId: string): Promise<string> => {
  const testOrderData = {
    tableId,
    tableName: `Table ${tableId.slice(-2)}`,
    items: [
      {
        productId: 'test-product-1',
        name: 'Test Burger',
        price: 12.99,
        quantity: 1,
        subtotal: 12.99
      },
      {
        productId: 'test-product-2',
        name: 'Test Fries',
        price: 4.99,
        quantity: 2,
        subtotal: 9.98
      }
    ],
    summary: {
      subtotal: 22.97,
      tax: 0,
      total: 22.97,
      itemCount: 3
    },
    customer: {
      name: 'Test Customer'
    },
    specialInstructions: 'This is a test order for notification testing'
  }

  return await createOrder(restaurantId, testOrderData)
}

// Test function to create multiple test orders
export const createMultipleTestOrders = async (restaurantId: string, tableId: string, count: number = 3): Promise<string[]> => {
  const orderIds: string[] = []
  
  for (let i = 0; i < count; i++) {
    const orderId = await createTestOrder(restaurantId, tableId)
    orderIds.push(orderId)
    
    // Add a small delay between orders to see the notification updates
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return orderIds
}
