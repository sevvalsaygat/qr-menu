import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore'
import { db } from './firebase'
import { 
  Restaurant, 
  Table, 
  Category, 
  Product, 
  Order, 
  OrderStatus,
  ApiResponse 
} from '../types'

// Restaurant operations
export const createRestaurant = async (
  userId: string, 
  restaurantData: Omit<Restaurant, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'restaurants'), {
      ownerId: userId,
      ...restaurantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating restaurant:', error)
    throw new Error('Failed to create restaurant')
  }
}

export const getRestaurant = async (restaurantId: string): Promise<Restaurant | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'restaurants', restaurantId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Restaurant
    }
    return null
  } catch (error) {
    console.error('Error getting restaurant:', error)
    throw new Error('Failed to get restaurant')
  }
}

export const getUserRestaurants = async (userId: string): Promise<Restaurant[]> => {
  try {
    const q = query(
      collection(db, 'restaurants'),
      where('ownerId', '==', userId)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Restaurant[]
  } catch (error) {
    console.error('Error getting user restaurants:', error)
    throw new Error('Failed to get restaurants')
  }
}

export const updateRestaurant = async (
  restaurantId: string,
  restaurantData: Partial<Omit<Restaurant, 'id' | 'ownerId' | 'createdAt'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'restaurants', restaurantId), {
      ...restaurantData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating restaurant:', error)
    throw new Error('Failed to update restaurant')
  }
}

// Table operations
export const createTable = async (
  restaurantId: string, 
  tableData: Omit<Table, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'tables'), {
      ...tableData,
      restaurantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating table:', error)
    throw new Error('Failed to create table')
  }
}

export const getTables = async (restaurantId: string): Promise<Table[]> => {
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'tables'),
      orderBy('name')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Table[]
  } catch (error) {
    console.error('Error getting tables:', error)
    throw new Error('Failed to get tables')
  }
}

export const getTable = async (restaurantId: string, tableId: string): Promise<Table | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Table
    }
    return null
  } catch (error) {
    console.error('Error getting table:', error)
    throw new Error('Failed to get table')
  }
}

export const updateTable = async (
  restaurantId: string, 
  tableId: string, 
  tableData: Partial<Omit<Table, 'id' | 'restaurantId' | 'createdAt'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId), {
      ...tableData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating table:', error)
    throw new Error('Failed to update table')
  }
}

export const deleteTable = async (restaurantId: string, tableId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId))
  } catch (error) {
    console.error('Error deleting table:', error)
    throw new Error('Failed to delete table')
  }
}

// Category operations
export const createCategory = async (
  restaurantId: string, 
  categoryData: Omit<Category, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'categories'), {
      ...categoryData,
      restaurantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating category:', error)
    throw new Error('Failed to create category')
  }
}

export const getCategories = async (restaurantId: string): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'categories'),
      orderBy('displayOrder')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[]
  } catch (error) {
    console.error('Error getting categories:', error)
    throw new Error('Failed to get categories')
  }
}

export const getVisibleCategories = async (restaurantId: string): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'categories'),
      where('isVisible', '==', true),
      orderBy('displayOrder')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[]
  } catch (error) {
    console.error('Error getting visible categories:', error)
    throw new Error('Failed to get visible categories')
  }
}

export const updateCategory = async (
  restaurantId: string, 
  categoryId: string, 
  categoryData: Partial<Omit<Category, 'id' | 'restaurantId' | 'createdAt'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'restaurants', restaurantId, 'categories', categoryId), {
      ...categoryData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating category:', error)
    throw new Error('Failed to update category')
  }
}

export const deleteCategory = async (restaurantId: string, categoryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'categories', categoryId))
  } catch (error) {
    console.error('Error deleting category:', error)
    throw new Error('Failed to delete category')
  }
}

// Product operations
export const createProduct = async (
  restaurantId: string, 
  productData: Omit<Product, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'products'), {
      ...productData,
      restaurantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating product:', error)
    throw new Error('Failed to create product')
  }
}

export const getProducts = async (
  restaurantId: string, 
  categoryId?: string
): Promise<Product[]> => {
  try {
    let q = query(collection(db, 'restaurants', restaurantId, 'products'))
    
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId))
    }
    
    q = query(q, orderBy('name'))
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[]
  } catch (error) {
    console.error('Error getting products:', error)
    throw new Error('Failed to get products')
  }
}

export const getAvailableProducts = async (
  restaurantId: string, 
  categoryId?: string
): Promise<Product[]> => {
  try {
    let q = query(
      collection(db, 'restaurants', restaurantId, 'products'),
      where('isAvailable', '==', true)
    )
    
    if (categoryId) {
      q = query(q, where('categoryId', '==', categoryId))
    }
    
    q = query(q, orderBy('name'))
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[]
  } catch (error) {
    console.error('Error getting available products:', error)
    throw new Error('Failed to get available products')
  }
}

export const getProduct = async (
  restaurantId: string, 
  productId: string
): Promise<Product | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'restaurants', restaurantId, 'products', productId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product
    }
    return null
  } catch (error) {
    console.error('Error getting product:', error)
    throw new Error('Failed to get product')
  }
}

export const updateProduct = async (
  restaurantId: string, 
  productId: string, 
  productData: Partial<Omit<Product, 'id' | 'restaurantId' | 'createdAt'>>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'restaurants', restaurantId, 'products', productId), {
      ...productData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating product:', error)
    throw new Error('Failed to update product')
  }
}

export const deleteProduct = async (restaurantId: string, productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'restaurants', restaurantId, 'products', productId))
  } catch (error) {
    console.error('Error deleting product:', error)
    throw new Error('Failed to delete product')
  }
}

// Order operations
export const createOrder = async (
  restaurantId: string, 
  orderData: Omit<Order, 'id' | 'restaurantId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'restaurants', restaurantId, 'orders'), {
      ...orderData,
      restaurantId,
      status: 'pending' as OrderStatus,
      statusHistory: [{
        status: 'pending' as OrderStatus,
        timestamp: serverTimestamp(),
        notes: 'Order placed'
      }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating order:', error)
    throw new Error('Failed to create order')
  }
}

export const getOrders = async (
  restaurantId: string, 
  status?: OrderStatus,
  limitCount: number = 50
): Promise<Order[]> => {
  try {
    let q = query(collection(db, 'restaurants', restaurantId, 'orders'))
    
    if (status) {
      q = query(q, where('status', '==', status))
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount))
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[]
  } catch (error) {
    console.error('Error getting orders:', error)
    throw new Error('Failed to get orders')
  }
}

export const getOrder = async (restaurantId: string, orderId: string): Promise<Order | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'restaurants', restaurantId, 'orders', orderId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Order
    }
    return null
  } catch (error) {
    console.error('Error getting order:', error)
    throw new Error('Failed to get order')
  }
}

export const updateOrderStatus = async (
  restaurantId: string, 
  orderId: string, 
  status: OrderStatus, 
  notes: string = ''
): Promise<void> => {
  try {
    const orderRef = doc(db, 'restaurants', restaurantId, 'orders', orderId)
    const orderDoc = await getDoc(orderRef)
    
    if (!orderDoc.exists()) {
      throw new Error('Order not found')
    }
    
    const currentData = orderDoc.data() as Order
    const statusHistory = currentData.statusHistory || []
    
    await updateDoc(orderRef, {
      status,
      statusHistory: [
        ...statusHistory,
        {
          status,
          timestamp: serverTimestamp(),
          notes
        }
      ],
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }
}

// Real-time listeners
export const subscribeToOrders = (
  restaurantId: string, 
  callback: (orders: Order[]) => void, 
  status?: OrderStatus,
  limitCount: number = 50
): Unsubscribe => {
  try {
    let q = query(collection(db, 'restaurants', restaurantId, 'orders'))
    
    if (status) {
      q = query(q, where('status', '==', status))
    }
    
    q = query(q, orderBy('createdAt', 'desc'), limit(limitCount))
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[]
      callback(orders)
    })
  } catch (error) {
    console.error('Error subscribing to orders:', error)
    throw new Error('Failed to subscribe to orders')
  }
}

export const subscribeToPendingOrders = (
  restaurantId: string, 
  callback: (orders: Order[]) => void
): Unsubscribe => {
  return subscribeToOrders(restaurantId, callback, 'pending')
}

export const subscribeToActiveOrders = (
  restaurantId: string, 
  callback: (orders: Order[]) => void
): Unsubscribe => {
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'orders'),
      where('status', 'in', ['pending', 'confirmed', 'preparing']),
      orderBy('createdAt', 'desc'),
      limit(50)
    )
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[]
      callback(orders)
    })
  } catch (error) {
    console.error('Error subscribing to active orders:', error)
    throw new Error('Failed to subscribe to active orders')
  }
}

// Batch operations
export const bulkUpdateProducts = async (
  restaurantId: string, 
  updates: Array<{ productId: string; data: Partial<Product> }>
): Promise<void> => {
  try {
    const batch = writeBatch(db)
    
    updates.forEach(({ productId, data }) => {
      const productRef = doc(db, 'restaurants', restaurantId, 'products', productId)
      batch.update(productRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error bulk updating products:', error)
    throw new Error('Failed to bulk update products')
  }
}

// Utility functions
export const generateOrderNumber = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}
