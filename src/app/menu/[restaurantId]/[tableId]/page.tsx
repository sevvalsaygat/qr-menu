'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Restaurant, Table, Category, Product, OrderItem, Order } from '@/types'
import { createOrder } from '@/lib/firestore'
import { useCart } from '@/contexts/CartContext'
import { CartProvider } from '@/contexts/CartContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CartDrawer } from '@/components/ui/cart-drawer'
import { Clock, Star, AlertCircle, Utensils, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

function CustomerMenuPageContent() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.restaurantId as string
  const tableId = params.tableId as string

  const { addToCart, clearCart, items: cartItems, getTotalPrice } = useCart()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [table, setTable] = useState<Table | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [orderConfirmation, setOrderConfirmation] = useState<{ orderId: string } | null>(null)

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Load restaurant data
      const restaurantDoc = await getDoc(doc(db, 'restaurants', restaurantId))
      if (!restaurantDoc.exists()) {
        setError('Restaurant not found')
        return
      }

      const restaurantData = { id: restaurantDoc.id, ...restaurantDoc.data() } as Restaurant
      if (!restaurantData.settings?.isActive) {
        setError('This restaurant is currently closed')
        return
      }
      setRestaurant(restaurantData)

      // Load table data
      const tableDoc = await getDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId))
      if (!tableDoc.exists()) {
        setError('Table not found')
        return
      }

      const tableData = { id: tableDoc.id, ...tableDoc.data() } as Table
      if (!tableData.isActive) {
        setError('This table is currently unavailable')
        return
      }
      setTable(tableData)

      // Load categories (only visible ones)
      const categoriesQuery = query(
        collection(db, 'restaurants', restaurantId, 'categories'),
        where('isVisible', '==', true),
        orderBy('displayOrder', 'asc')
      )
      const categoriesSnapshot = await getDocs(categoriesQuery)
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[]
      setCategories(categoriesData)

      // Load products (only available ones)
      const productsQuery = query(
        collection(db, 'restaurants', restaurantId, 'products'),
        where('isAvailable', '==', true)
      )
      const productsSnapshot = await getDocs(productsQuery)
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(productsData)

    } catch (err) {
      console.error('Error loading menu data:', err)
      setError('Failed to load menu. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [restaurantId, tableId])

  const handleCheckout = async (customerInfo: { specialInstructions?: string }) => {
    if (!restaurant || !table) return

    try {
      setIsCheckoutLoading(true)
      
      // Convert cart items to order items
      const orderItems: OrderItem[] = cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      }))

      const subtotal = getTotalPrice()
      const tax = 0 // No tax calculation for now
      const total = subtotal + tax

      const orderData: Omit<Order, 'id' | 'restaurantId' | 'isCompleted' | 'createdAt'> = {
        tableId,
        tableName: table.name,
        items: orderItems,
        summary: {
          subtotal,
          tax,
          total,
          itemCount: orderItems.reduce((sum, item) => sum + item.quantity, 0)
        }
      }

      // Only add special instructions if provided
      if (customerInfo.specialInstructions) {
        orderData.specialInstructions = customerInfo.specialInstructions
      }

      const orderId = await createOrder(restaurantId, orderData)

      // Clear cart and show confirmation
      clearCart()
      setOrderConfirmation({ orderId })
      
    } catch (error) {
      console.error('Error placing order:', error)
      setError('Failed to place order. Please try again.')
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  useEffect(() => {
    loadMenuData()
  }, [loadMenuData])

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Unknown Category'
  }

  const filteredProducts = products.filter(product => {
    if (selectedCategory === 'all') return true
    return product.categoryId === selectedCategory
  })

  const featuredProducts = products.filter(product => product.isFeatured)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Utensils className="h-12 w-12 animate-pulse mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Order confirmation screen
  if (orderConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl">
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Utensils className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-800">Order Placed Successfully!</h1>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="text-xl font-mono font-bold">#{orderConfirmation.orderId.slice(-6).toUpperCase()}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">{table?.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Restaurant</p>
                  <p className="font-medium">{restaurant?.name}</p>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <p className="text-muted-foreground">
                  Your order has been sent to the restaurant. Thank you for your order!
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setOrderConfirmation(null)
                      setSelectedCategory('all')
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Order More Items
                  </Button>
                  <Button 
                    onClick={() => router.push('/')}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 pr-24 md:pr-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
            {restaurant?.description && (
              <p className="text-gray-600 mt-2">{restaurant.description}</p>
            )}
            <div className="flex items-center justify-center mt-3 text-sm text-gray-500">
              <span>Table: {table?.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Featured Items
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.preparationTime && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {product.preparationTime} min
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(product.categoryId)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Separator className="mb-6" />
          </div>
        )}

        {/* Category Navigation */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    {product.isFeatured && (
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.preparationTime && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {product.preparationTime} min
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(product.categoryId)}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => addToCart(product, 1)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items available</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'No menu items are currently available.' 
                : 'No items available in this category.'}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
          <p>Thank you for dining with us!</p>
          <p className="mt-1">Table: {table?.name} • {restaurant?.name}</p>
        </div>

        {/* Cart Drawer */}
        <CartDrawer 
          onCheckout={handleCheckout} 
          isCheckoutLoading={isCheckoutLoading}
        />
      </div>
    </div>
  )
}

export default function CustomerMenuPage() {
  return (
    <CartProvider>
      <CustomerMenuPageContent />
    </CartProvider>
  )
}
