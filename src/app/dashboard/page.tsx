'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { QrCode, Users, ShoppingBag, BarChart3, Plus } from 'lucide-react'

export default function DashboardHome() {
  const router = useRouter()
  const { user, userData } = useAuth()

  const quickActions = [
    {
      title: 'Manage Tables',
      description: 'Add and manage your restaurant tables',
      icon: QrCode,
      href: '/dashboard/tables',
      color: 'bg-blue-500'
    },
    {
      title: 'Menu Categories',
      description: 'Organize your menu items',
      icon: ShoppingBag,
      href: '/dashboard/categories',
      color: 'bg-green-500'
    },
    {
      title: 'Products',
      description: 'Add and edit menu items',
      icon: Plus,
      href: '/dashboard/products',
      color: 'bg-purple-500'
    },
    {
      title: 'Orders',
      description: 'View and manage orders',
      icon: BarChart3,
      href: '/dashboard/orders',
      color: 'bg-orange-500'
    }
  ]

  const stats = [
    { label: 'Total Tables', value: '0', icon: QrCode },
    { label: 'Menu Items', value: '0', icon: ShoppingBag },
    { label: 'Today\'s Orders', value: '0', icon: Users },
    { label: 'Revenue', value: '$0', icon: BarChart3 }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back!
        </h2>
        <p className="text-gray-600 mt-2">
          Manage your restaurant {userData?.restaurantName} from your dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <stat.icon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className={`inline-flex p-3 rounded-lg ${action.color} w-fit`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => router.push(action.href)}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to set up your QR menu system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create your first table</h4>
                <p className="text-sm text-gray-600">Add tables and generate QR codes for customers to scan</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Set up menu categories</h4>
                <p className="text-sm text-gray-600">Organize your menu with categories like Appetizers, Main Courses, etc.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add menu items</h4>
                <p className="text-sm text-gray-600">Add products with descriptions, prices, and images</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Start receiving orders</h4>
                <p className="text-sm text-gray-600">Customers can now scan QR codes and place orders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
