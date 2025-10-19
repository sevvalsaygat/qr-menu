'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { 
  createCategory, 
  getCategories, 
  updateCategory, 
  deleteCategory,
  getUserRestaurants,
  createRestaurant,
  getProductsByCategory,
  getCategoryProductCounts
} from '../../../lib/firestore'
import { getUserData } from '../../../lib/auth'
import { Category, Product } from '../../../types'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Label } from '../../../components/ui/label'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '../../../components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { Switch } from '../../../components/ui/switch'
import { Textarea } from '../../../components/ui/textarea'
import { Plus, MoreHorizontal, Edit, Trash2, ShoppingBag, Loader2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react'

export default function CategoriesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLastCategoryWarningOpen, setIsLastCategoryWarningOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([])

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: '',
    isVisible: true
  })

  const createDefaultRestaurant = useCallback(async () => {
    try {
      const userData = await getUserData(user!.uid)
      const restaurantName = userData?.restaurantName || 'My Restaurant'
      
      const restaurantId = await createRestaurant(user!.uid, {
        name: restaurantName,
        description: `Welcome to ${restaurantName}`,
        settings: {
          currency: '$',
          timezone: 'America/New_York',
          isActive: true
        }
      })
      
      setRestaurantId(restaurantId)
      setCategories([])
      setProductCounts({})
      setSuccess('Restaurant setup completed! You can now add categories.')
    } catch (err) {
      setError('Failed to create restaurant. Please try refreshing the page.')
      console.error(err)
    }
  }, [user])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get user's restaurant
      const restaurants = await getUserRestaurants(user!.uid)
      if (restaurants.length === 0) {
        // Try to create a default restaurant for existing users
        await createDefaultRestaurant()
        return
      }
      
      const restaurant = restaurants[0]
      setRestaurantId(restaurant.id)
      
      // Load categories and product counts in parallel
      const [categoriesData, productCountsData] = await Promise.all([
        getCategories(restaurant.id),
        getCategoryProductCounts(restaurant.id)
      ])
      
      setCategories(categoriesData)
      setProductCounts(productCountsData)
    } catch (err) {
      setError('Failed to load categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, createDefaultRestaurant])

  // Load restaurant and categories
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      displayOrder: '',
      isVisible: true
    })
  }

  const getNextDisplayOrder = () => {
    if (categories.length === 0) return 1
    const maxOrder = Math.max(...categories.map(c => c.displayOrder))
    return maxOrder + 1
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return

    try {
      setSubmitting(true)
      setError('')
      
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : getNextDisplayOrder(),
        isVisible: formData.isVisible
      }

      await createCategory(restaurantId, categoryData)
      setSuccess('Category created successfully!')
      setIsCreateDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError('Failed to create category')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId || !selectedCategory) return

    try {
      setSubmitting(true)
      setError('')
      
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : selectedCategory.displayOrder,
        isVisible: formData.isVisible
      }

      await updateCategory(restaurantId, selectedCategory.id, categoryData)
      setSuccess('Category updated successfully!')
      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      resetForm()
      loadData()
    } catch (err) {
      setError('Failed to update category')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurantId || !selectedCategory) return

    try {
      setSubmitting(true)
      setError('')
      
      // Delete the category (this will also delete any products in the category)
      await deleteCategory(restaurantId, selectedCategory.id)
      
      // Reorder remaining categories to fill the gap
      await reorderCategoriesAfterDelete(selectedCategory.displayOrder)
      
      const productCount = categoryProducts.length
      const successMessage = productCount > 0 
        ? `Category and ${productCount} product${productCount !== 1 ? 's' : ''} deleted successfully!`
        : 'Category deleted successfully!'
      
      setSuccess(successMessage)
      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
      setCategoryProducts([])
      loadData()
    } catch (err) {
      setError('Failed to delete category')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }


  const reorderCategoriesAfterDelete = useCallback(async (deletedDisplayOrder: number) => {
    try {
      // Get categories that need to be reordered (those with higher display order than deleted)
      const categoriesToReorder = categories.filter(
        cat => cat.displayOrder > deletedDisplayOrder && cat.id !== selectedCategory?.id
      )

      // Update display orders to fill the gap
      const updatePromises = categoriesToReorder.map(category => 
        updateCategory(restaurantId, category.id, {
          displayOrder: category.displayOrder - 1
        })
      )

      await Promise.all(updatePromises)
    } catch (err) {
      console.error('Error reordering categories after delete:', err)
      // Don't throw error here as the main delete operation succeeded
    }
  }, [categories, selectedCategory, restaurantId])

  const toggleVisibility = async (category: Category) => {
    try {
      await updateCategory(restaurantId, category.id, {
        isVisible: !category.isVisible
      })
      loadData()
    } catch (err) {
      setError('Failed to update category visibility')
      console.error(err)
    }
  }

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.displayOrder - b.displayOrder)
    const currentIndex = sortedCategories.findIndex(c => c.id === category.id)
    
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === sortedCategories.length - 1)
    ) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const targetCategory = sortedCategories[targetIndex]

    try {
      // Swap display orders
      await Promise.all([
        updateCategory(restaurantId, category.id, { displayOrder: targetCategory.displayOrder }),
        updateCategory(restaurantId, targetCategory.id, { displayOrder: category.displayOrder })
      ])
      loadData()
    } catch (err) {
      setError('Failed to reorder categories')
      console.error(err)
    }
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder.toString(),
      isVisible: category.isVisible
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = async (category: Category) => {
    try {
      setSelectedCategory(category)
      
      // Check if this is the last remaining category
      if (categories.length <= 1) {
        setIsLastCategoryWarningOpen(true)
        return
      }
      
      // Load category products to show appropriate message
      const products = await getProductsByCategory(restaurantId, category.id)
      setCategoryProducts(products)
      
      // Show delete confirmation dialog with appropriate message
      setIsDeleteDialogOpen(true)
    } catch (err) {
      setError('Failed to check category products')
      console.error(err)
    }
  }

  const handleCategoryClick = (category: Category) => {
    // Navigate to products page with category filter
    router.push(`/dashboard/products?category=${category.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600 mt-1">
            Organize your menu items into categories
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your menu items
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Appetizers, Main Courses, Desserts"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this category"
                  disabled={submitting}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  placeholder={`Default: ${getNextDisplayOrder()}`}
                  min="1"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVisible"
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                  disabled={submitting}
                />
                <Label htmlFor="isVisible">Visible to customers</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Category
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {error.includes('Failed to create restaurant') && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError('')
                    loadData()
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first category to start organizing your menu items
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((category, index) => (
              <Card 
                key={category.id} 
                className="relative hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-md transition-colors"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {!category.isVisible && (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {productCounts[category.id] || 0} product{(productCounts[category.id] || 0) !== 1 ? 's' : ''}
                        <span className="text-xs text-blue-600 ml-2">Click to view products</span>
                      </div>
                      {category.description && (
                        <CardDescription className="mt-1">
                          {category.description}
                        </CardDescription>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleVisibility(category)}>
                          {category.isVisible ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show
                            </>
                          )}
                        </DropdownMenuItem>
                        {index > 0 && (
                          <DropdownMenuItem onClick={() => moveCategory(category, 'up')}>
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Move Up
                          </DropdownMenuItem>
                        )}
                        {index < categories.length - 1 && (
                          <DropdownMenuItem onClick={() => moveCategory(category, 'down')}>
                            <ArrowDown className="h-4 w-4 mr-2" />
                            Move Down
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(category)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span>Order: {category.displayOrder}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      category.isVisible 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toggleVisibility(category)}
                    >
                      {category.isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this category"
                disabled={submitting}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">Display Order</Label>
              <Input
                id="edit-displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                min="1"
                disabled={submitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isVisible"
                checked={formData.isVisible}
                onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
                disabled={submitting}
              />
              <Label htmlFor="edit-isVisible">Visible to customers</Label>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              {categoryProducts.length > 0 ? (
                <>
                  Deleting this category will also delete {categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''} inside it. This action cannot be undone.
                  <br />
                  <br />
                  Are you sure you want to delete it?
                </>
              ) : (
                <>
                  This category is empty. Are you sure you want to delete it?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Last Category Warning Dialog */}
      <Dialog open={isLastCategoryWarningOpen} onOpenChange={setIsLastCategoryWarningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot Delete Last Category</DialogTitle>
            <DialogDescription>
              At least one category must exist. You cannot delete this category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <strong>At least one category must exist.</strong>
                <br />
                You cannot delete this category as it is the last remaining category in your restaurant.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Suggestion:</strong> Create a new category first, then you can delete this one if needed.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setIsLastCategoryWarningOpen(false)}
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
