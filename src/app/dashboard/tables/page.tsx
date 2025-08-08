'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { 
  createTable, 
  getTables, 
  updateTable, 
  deleteTable,
  getUserRestaurants,
  createRestaurant 
} from '../../../lib/firestore'
import { getUserData } from '../../../lib/auth'
import { Table } from '../../../types'
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
import { Plus, MoreHorizontal, Edit, Trash2, QrCode, Download, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'

export default function TablesPage() {
  const { user } = useAuth()
  const [tables, setTables] = useState<Table[]>([])
  const [restaurantId, setRestaurantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    isActive: true
  })

  // Load restaurant and tables
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Get user's restaurant
      console.log('Loading restaurants for user:', user!.uid)
      const restaurants = await getUserRestaurants(user!.uid)
      console.log('Found restaurants:', restaurants)
      
      if (restaurants.length === 0) {
        console.log('No restaurants found, creating default restaurant')
        // Try to create a default restaurant for existing users
        await createDefaultRestaurant()
        return
      }
      
      const restaurant = restaurants[0]
      setRestaurantId(restaurant.id)
      
      // Load tables
      const tablesData = await getTables(restaurant.id)
      setTables(tablesData)
    } catch (err) {
      setError('Failed to load tables')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultRestaurant = async () => {
    try {
      console.log('Creating default restaurant for user:', user!.uid)
      const userData = await getUserData(user!.uid)
      console.log('User data:', userData)
      const restaurantName = userData?.restaurantName || 'My Restaurant'
      
      console.log('Creating restaurant with name:', restaurantName)
      const restaurantId = await createRestaurant(user!.uid, {
        name: restaurantName,
        description: `Welcome to ${restaurantName}`,
        settings: {
          currency: 'USD',
          timezone: 'America/New_York',
          isActive: true
        }
      })
      
      console.log('Restaurant created with ID:', restaurantId)
      setRestaurantId(restaurantId)
      setTables([])
      setSuccess('Restaurant setup completed! You can now add tables.')
    } catch (err) {
      console.error('Error creating default restaurant:', err)
      setError('Failed to create restaurant. Please try refreshing the page.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: '',
      isActive: true
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return

    try {
      setSubmitting(true)
      setError('')
      
      const tableData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        isActive: formData.isActive
      }

      await createTable(restaurantId, tableData)
      setSuccess('Table created successfully!')
      setIsCreateDialogOpen(false)
      resetForm()
      loadData()
    } catch (err) {
      setError('Failed to create table')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId || !selectedTable) return

    try {
      setSubmitting(true)
      setError('')
      
      const tableData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        isActive: formData.isActive
      }

      await updateTable(restaurantId, selectedTable.id, tableData)
      setSuccess('Table updated successfully!')
      setIsEditDialogOpen(false)
      setSelectedTable(null)
      resetForm()
      loadData()
    } catch (err) {
      setError('Failed to update table')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurantId || !selectedTable) return

    try {
      setSubmitting(true)
      setError('')
      
      await deleteTable(restaurantId, selectedTable.id)
      setSuccess('Table deleted successfully!')
      setIsDeleteDialogOpen(false)
      setSelectedTable(null)
      loadData()
    } catch (err) {
      setError('Failed to delete table')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const generateQRCode = async (table: Table) => {
    try {
      const menuUrl = `${window.location.origin}/menu/${restaurantId}/${table.id}`
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrCodeDataUrl)
      setSelectedTable(table)
      setIsQRDialogOpen(true)
    } catch (err) {
      setError('Failed to generate QR code')
      console.error(err)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedTable) return
    
    const link = document.createElement('a')
    link.download = `table-${selectedTable.name}-qr.png`
    link.href = qrCodeUrl
    link.click()
  }

  const openEditDialog = (table: Table) => {
    setSelectedTable(table)
    setFormData({
      name: table.name,
      description: table.description || '',
      capacity: table.capacity?.toString() || '',
      isActive: table.isActive
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (table: Table) => {
    setSelectedTable(table)
    setIsDeleteDialogOpen(true)
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
          <h1 className="text-3xl font-bold">Tables</h1>
          <p className="text-gray-600 mt-1">
            Manage your restaurant tables and generate QR codes
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Table</DialogTitle>
              <DialogDescription>
                Add a new table to your restaurant
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Table Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Table 1, VIP Table"
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
                  placeholder="Optional description"
                  disabled={submitting}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Number of seats"
                  min="1"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  disabled={submitting}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Table
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

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tables yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first table to start generating QR codes for customer orders
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    {table.description && (
                      <CardDescription className="mt-1">
                        {table.description}
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
                      <DropdownMenuItem onClick={() => openEditDialog(table)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateQRCode(table)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(table)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  {table.capacity && (
                    <span>Seats: {table.capacity}</span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    table.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {table.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => generateQRCode(table)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update table information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Table Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Table 1, VIP Table"
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
                placeholder="Optional description"
                disabled={submitting}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Number of seats"
                min="1"
                disabled={submitting}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                disabled={submitting}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Table
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTable?.name}"? This action cannot be undone.
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

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for {selectedTable?.name}</DialogTitle>
            <DialogDescription>
              Customers can scan this QR code to view the menu and place orders
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="border rounded-lg"
              />
            )}
            
            <div className="text-center text-sm text-gray-600">
              <p>Menu URL:</p>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {window.location.origin}/menu/{restaurantId}/{selectedTable?.id}
              </code>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={downloadQRCode}>
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
