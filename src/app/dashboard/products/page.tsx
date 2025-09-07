'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../../hooks/useAuth'
import { 
  createProduct, 
  getProducts, 
  updateProduct, 
  deleteProduct,
  getUserRestaurants,
  createRestaurant,
  getCategories
} from '../../../lib/firestore'
import { getUserData } from '../../../lib/auth'
import { Product, Category } from '../../../types'
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { Plus, MoreHorizontal, Edit, Trash2, Package, Loader2, Eye, EyeOff, DollarSign, Filter, Search, X } from 'lucide-react'

export default function ProductsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filter states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
    isFeatured: false,
    preparationTime: '',
    image: null as File | null
  })

  const createDefaultRestaurant = useCallback(async () => {
    try {
      const userData = await getUserData(user!.uid)
      const restaurantName = userData?.restaurantName || 'My Restaurant'
      
      const restaurantId = await createRestaurant(user!.uid, {
        name: restaurantName,
        description: `Welcome to ${restaurantName}`,
        settings: {
          currency: 'USD',
          timezone: 'America/New_York',
          isActive: true
        }
      })
      
      setRestaurantId(restaurantId)
      setProducts([])
      setCategories([])
      setSuccess('Restaurant setup completed! You can now add products.')
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
      
      // Load categories and products
      const [categoriesData, productsData] = await Promise.all([
        getCategories(restaurant.id),
        getProducts(restaurant.id)
      ])
      
      setCategories(categoriesData)
      setProducts(productsData)
    } catch (err) {
      setError('Failed to load products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, createDefaultRestaurant])

  // Load restaurant and products
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  // Handle URL search parameters for category filtering
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategoryFilter(categoryParam)
    }
  }, [searchParams])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      isAvailable: true,
      isFeatured: false,
      preparationTime: '',
      image: null
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return

    // Validate required image
    if (!formData.image) {
      setError('Product image is required')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
        // For now, we'll store the image as a placeholder URL
        // In a real implementation, you would upload to Firebase Storage
        imageUrl: 'placeholder-image-url'
      }

      await createProduct(restaurantId, productData)
      setSuccess('Product created successfully!')
      setIsCreateDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError('Failed to create product')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId || !selectedProduct) return

    try {
      setSubmitting(true)
      setError('')
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        isAvailable: formData.isAvailable,
        isFeatured: formData.isFeatured,
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined
      }

      await updateProduct(restaurantId, selectedProduct.id, productData)
      setSuccess('Product updated successfully!')
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      resetForm()
      loadData()
    } catch (err) {
      setError('Failed to update product')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurantId || !selectedProduct) return

    try {
      setSubmitting(true)
      setError('')
      
      await deleteProduct(restaurantId, selectedProduct.id)
      setSuccess('Product deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
      loadData()
    } catch (err) {
      setError('Failed to delete product')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAvailability = async (product: Product) => {
    try {
      await updateProduct(restaurantId, product.id, {
        isAvailable: !product.isAvailable
      })
      loadData()
    } catch (err) {
      setError('Failed to update product availability')
      console.error(err)
    }
  }

  const toggleFeatured = async (product: Product) => {
    try {
      await updateProduct(restaurantId, product.id, {
        isFeatured: !product.isFeatured
      })
      loadData()
    } catch (err) {
      setError('Failed to update product featured status')
      console.error(err)
    }
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      preparationTime: product.preparationTime?.toString() || '',
      image: null // Reset image for edit dialog
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Unknown Category'
  }

  // Filter products based on selected filters and search query
  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategoryFilter === 'all' || product.categoryId === selectedCategoryFilter
    const availabilityMatch = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && product.isAvailable) ||
      (availabilityFilter === 'unavailable' && !product.isAvailable) ||
      (availabilityFilter === 'featured' && product.isFeatured)
    
    // Search in product name, description, and category name
    const searchMatch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      getCategoryName(product.categoryId).toLowerCase().includes(searchQuery.toLowerCase())
    
    return categoryMatch && availabilityMatch && searchMatch
  })

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
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your menu items and their details
          </p>
          {selectedCategoryFilter !== 'all' && (
            <div className="mt-2 text-sm text-blue-600">
              Showing products from: {getCategoryName(selectedCategoryFilter)}
            </div>
          )}
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={categories.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your menu
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Margherita Pizza, Caesar Salad"
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
                  placeholder="Describe your product..."
                  disabled={submitting}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (file) {
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setError('Image file must be smaller than 5MB')
                        e.target.value = '' // Clear the input
                        return
                      }
                      // Validate file type
                      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                        setError('Please select a valid image file (JPG, PNG, or WebP)')
                        e.target.value = '' // Clear the input
                        return
                      }
                      setError('') // Clear any previous errors
                    }
                    setFormData({ ...formData, image: file })
                  }}
                  required
                  disabled={submitting}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="text-xs text-gray-500">
                  Upload a high-quality image of your product (JPG, PNG, WebP, max 5MB)
                </p>
                {formData.image && (
                  <p className="text-xs text-green-600">
                    ✓ Selected: {formData.image.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Prep Time (min)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    min="1"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                    placeholder="15"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  disabled={submitting}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                    disabled={submitting}
                  />
                  <Label htmlFor="isAvailable">Available to customers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    disabled={submitting}
                  />
                  <Label htmlFor="isFeatured">Featured item</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Product
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

      {/* Filters */}
      {categories.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedCategoryFilter}
                  onValueChange={setSelectedCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={availabilityFilter}
                  onValueChange={setAvailabilityFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="unavailable">Unavailable Only</SelectItem>
                    <SelectItem value="featured">Featured Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Search Bar */}
        <div className="flex justify-start">
          <div className="w-full max-w-md">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-transparent border-gray-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                type="button"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2 text-left">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-gray-600 text-center mb-4">
              You need to create categories before adding products. Categories help organize your menu items.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/categories'}>
              Create Categories First
            </Button>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {products.length === 0 ? 'No products yet' : 'No products found'}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {products.length === 0 
                ? 'Create your first product to start building your menu'
                : searchQuery 
                  ? `No products match &ldquo;${searchQuery}&rdquo;. Try a different search term or adjust your filters.`
                  : 'No products match your current filters. Try adjusting your filters to see more products.'
              }
            </p>
            {products.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {!product.isAvailable && (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      {product.isFeatured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <CardDescription className="mt-1">
                        {product.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleAvailability(product)}>
                        {product.isAvailable ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Make Unavailable
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Make Available
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFeatured(product)}>
                        {product.isFeatured ? 'Remove from Featured' : 'Mark as Featured'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(product)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ${product.price.toFixed(2)}
                    </span>
                    {product.preparationTime && (
                      <span>{product.preparationTime} min</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {getCategoryName(product.categoryId)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toggleAvailability(product)}
                  >
                    {product.isAvailable ? (
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Margherita Pizza, Caesar Salad"
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
                placeholder="Describe your product..."
                disabled={submitting}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-preparationTime">Prep Time (min)</Label>
                <Input
                  id="edit-preparationTime"
                  type="number"
                  min="1"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  placeholder="15"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-categoryId">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                disabled={submitting}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                  disabled={submitting}
                />
                <Label htmlFor="edit-isAvailable">Available to customers</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  disabled={submitting}
                />
                <Label htmlFor="edit-isFeatured">Featured item</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedProduct?.name}&rdquo;? This action cannot be undone.
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
    </div>
  )
}
