// Test utility functions for order update notifications
import { createOrMergeOrderForTable } from './firestore'

// Test function to create an initial order and then add items to it
export const testOrderUpdates = async (restaurantId: string, tableId: string): Promise<void> => {
  console.log('🧪 Starting order update notification test...')
  
  try {
    // Create initial order
    const initialOrderData = {
      tableId,
      tableName: `Table ${tableId.slice(-2)}`,
      items: [
        {
          productId: 'test-product-1',
          name: 'Test Burger',
          price: 12.99,
          quantity: 1,
          subtotal: 12.99
        }
      ],
      summary: {
        subtotal: 12.99,
        tax: 0,
        total: 12.99,
        itemCount: 1
      },
      customer: {
        name: 'Test Customer'
      },
      specialInstructions: 'Initial order for testing',
      isCancelled: false
    }

    console.log('📝 Creating initial order...')
    const orderId = await createOrMergeOrderForTable(restaurantId, initialOrderData)
    console.log(`✅ Initial order created: ${orderId}`)

    // Wait a moment for the notification to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Add items to the existing order
    const additionalItemsData = {
      tableId,
      tableName: `Table ${tableId.slice(-2)}`,
      items: [
        {
          productId: 'test-product-2',
          name: 'Test Fries',
          price: 4.99,
          quantity: 2,
          subtotal: 9.98
        },
        {
          productId: 'test-product-3',
          name: 'Test Drink',
          price: 2.99,
          quantity: 1,
          subtotal: 2.99
        }
      ],
      summary: {
        subtotal: 12.97,
        tax: 0,
        total: 12.97,
        itemCount: 3
      },
      customer: {
        name: 'Test Customer'
      },
      specialInstructions: 'Adding more items to existing order',
      isCancelled: false
    }

    console.log('📝 Adding items to existing order...')
    const updatedOrderId = await createOrMergeOrderForTable(restaurantId, additionalItemsData)
    console.log(`✅ Order updated: ${updatedOrderId}`)

    // Wait for notification processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('🎉 Order update test completed! Check console for notification logs.')

  } catch (error) {
    console.error('❌ Error in order update test:', error)
    throw error
  }
}

// Test function to create multiple updates to the same order
export const testMultipleOrderUpdates = async (restaurantId: string, tableId: string): Promise<void> => {
  console.log('🧪 Starting multiple order updates test...')
  
  try {
    // First update
    await testOrderUpdates(restaurantId, tableId)
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Second update with different items
    const secondUpdateData = {
      tableId,
      tableName: `Table ${tableId.slice(-2)}`,
      items: [
        {
          productId: 'test-product-4',
          name: 'Test Dessert',
          price: 6.99,
          quantity: 1,
          subtotal: 6.99
        }
      ],
      summary: {
        subtotal: 6.99,
        tax: 0,
        total: 6.99,
        itemCount: 1
      },
      customer: {
        name: 'Test Customer'
      },
      specialInstructions: 'Adding dessert to order',
      isCancelled: false
    }

    console.log('📝 Adding dessert to order...')
    const finalOrderId = await createOrMergeOrderForTable(restaurantId, secondUpdateData)
    console.log(`✅ Final order update: ${finalOrderId}`)

    console.log('🎉 Multiple order updates test completed!')

  } catch (error) {
    console.error('❌ Error in multiple order updates test:', error)
    throw error
  }
}
