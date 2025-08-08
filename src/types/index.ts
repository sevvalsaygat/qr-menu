import { User } from 'firebase/auth'
import { Timestamp, FieldValue } from 'firebase/firestore'

// User types
export interface UserData {
  email: string
  restaurantName: string
  createdAt: Timestamp | FieldValue
  lastLoginAt?: Timestamp | FieldValue
  isActive: boolean
  emailVerified: boolean
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    address?: Address
  }
  subscription?: {
    plan: string
    status: string
    expiresAt: Timestamp | FieldValue
  }
}

export interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isEmailVerified: boolean
}

// Restaurant types
export interface Restaurant {
  id: string
  ownerId: string
  name: string
  description?: string
  address?: Address
  contactInfo?: ContactInfo
  settings: RestaurantSettings
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

export interface RestaurantSettings {
  currency: string
  timezone: string
  operatingHours?: OperatingHours
  isActive: boolean
}

export interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
}

export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
}

export interface OperatingHours {
  [key: string]: {
    open: string
    close: string
    isOpen: boolean
  }
}

// Table types
export interface Table {
  id: string
  restaurantId: string
  name: string
  description?: string
  qrCode?: string
  qrCodeUrl?: string
  isActive: boolean
  position?: Position
  capacity?: number
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

export interface Position {
  x: number
  y: number
}

// Category types
export interface Category {
  id: string
  restaurantId: string
  name: string
  description?: string
  displayOrder: number
  imageUrl?: string
  isVisible: boolean
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

// Product types
export interface Product {
  id: string
  restaurantId: string
  categoryId: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  images?: string[]
  isAvailable: boolean
  isFeatured: boolean
  allergens?: string[]
  nutritionalInfo?: NutritionalInfo
  preparationTime?: number
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

export interface NutritionalInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
}

// Order types
export interface Order {
  id: string
  restaurantId: string
  tableId: string
  tableName: string
  items: OrderItem[]
  summary: OrderSummary
  customer?: CustomerInfo
  status: OrderStatus
  statusHistory: StatusHistoryEntry[]
  specialInstructions?: string
  estimatedTime?: number
  createdAt: Timestamp | FieldValue
  updatedAt: Timestamp | FieldValue
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  specialInstructions?: string
}

export interface OrderSummary {
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

export interface CustomerInfo {
  name?: string
  phone?: string
}

export interface StatusHistoryEntry {
  status: OrderStatus
  timestamp: Timestamp | FieldValue
  notes?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'

// Cart types (for customer interface)
export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  specialInstructions?: string
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Form types
export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  restaurantName: string
}

export interface SignInFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ResetPasswordFormData {
  email: string
}

export interface TableFormData {
  name: string
  description?: string
  capacity?: number
  isActive: boolean
}

export interface CategoryFormData {
  name: string
  description?: string
  displayOrder: number
  isVisible: boolean
}

export interface ProductFormData {
  name: string
  description?: string
  price: number
  categoryId: string
  isAvailable: boolean
  isFeatured: boolean
  preparationTime?: number
  allergens?: string[]
}
