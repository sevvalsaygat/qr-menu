'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface CartDrawerProps {
  onCheckout?: (customerInfo: { specialInstructions?: string }) => void
  isCheckoutLoading?: boolean
}

export function CartDrawer({ onCheckout, isCheckoutLoading = false }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, getTotalItems, getTotalPrice, isOpen, setIsOpen, isAnimating } = useCart()
  const [specialInstructions, setSpecialInstructions] = useState('')

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const handleCheckout = () => {
    if (onCheckout && items.length > 0) {
      onCheckout({
        specialInstructions: specialInstructions.trim() || undefined
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className={`fixed top-4 right-4 z-50 h-14 px-6 rounded-full shadow-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold transition-all duration-200 hover:scale-105 ${isAnimating ? 'cart-pulse-smooth' : ''}`}
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="h-6 w-6 mr-2" />
          <span className="text-lg">Cart</span>
          {totalItems > 0 && (
            <Badge
              variant="secondary"
              className={`absolute -right-2 -top-2 h-7 w-7 rounded-full p-0 text-sm font-bold bg-yellow-400 text-black border-2 border-white ${isAnimating ? 'cart-bounce-smooth' : ''}`}
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Your Order</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription>
            Review your selected items and place your order
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="space-y-6 p-4">
                {/* Cart Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card key={item.product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ${item.product.price.toFixed(2)} each
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-8 w-8 p-0"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="font-medium">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                {/* Customer Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="special-instructions">Special Instructions (Optional)</Label>
                    <Textarea
                      id="special-instructions"
                      placeholder="Any special requests or dietary requirements..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="space-y-4 pb-8">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total ({totalItems} items)</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    className="w-full mb-4"
                    size="lg"
                    disabled={items.length === 0 || isCheckoutLoading}
                  >
                    {isCheckoutLoading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
