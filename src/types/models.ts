import type { Timestamp } from 'firebase/firestore';

export type DateLike = Date | Timestamp | { toDate?: () => Date };

export interface SubscriptionInfo {
  plan: string;
  status: string;
  expiresAt: DateLike;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  address: Record<string, unknown>;
}

export interface UserDoc {
  email: string;
  restaurantName: string;
  createdAt: DateLike;
  lastLoginAt: DateLike;
  isActive: boolean;
  emailVerified: boolean;
  restaurantId?: string;
  subscription: SubscriptionInfo;
  profile: UserProfile;
}

export interface RestaurantDoc {
  ownerId: string;
  name: string;
  description?: string;
  address?: Record<string, unknown>;
  contactInfo?: Record<string, unknown>;
  settings: {
    currency: string;
    timezone: string;
    operatingHours: Record<string, unknown>;
    isActive: boolean;
  };
  createdAt: DateLike;
  updatedAt: DateLike;
}

export interface CategoryDoc {
  categoryId?: string;
  restaurantId?: string;
  name: string;
  description?: string;
  displayOrder?: number;
  imageUrl?: string;
  isVisible: boolean;
  createdAt?: DateLike;
  updatedAt?: DateLike;
}

export interface ProductDoc {
  productId?: string;
  restaurantId?: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  isAvailable: boolean;
  isFeatured: boolean;
  allergens?: string[];
  nutritionalInfo?: Record<string, unknown>;
  preparationTime?: number;
  createdAt?: DateLike;
  updatedAt?: DateLike;
}

export interface TableDoc {
  tableId?: string;
  restaurantId: string;
  name: string;
  description?: string;
  qrCode?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  position?: Record<string, unknown>;
  capacity?: number;
  createdAt?: DateLike;
  updatedAt?: DateLike;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  specialInstructions?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderDoc {
  orderId?: string;
  restaurantId: string;
  tableId: string;
  tableName?: string;
  items: OrderItem[];
  summary: {
    subtotal: number;
    tax: number;
    total: number;
    itemCount: number;
  };
  customer?: {
    name?: string;
    phone?: string;
  };
  status: OrderStatus;
  statusHistory?: Array<{
    status: OrderStatus;
    timestamp: DateLike;
    notes?: string;
  }>;
  specialInstructions?: string;
  estimatedTime?: number;
  createdAt?: DateLike;
  updatedAt?: DateLike;
}


