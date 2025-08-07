import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CategoryDoc, OrderDoc, RestaurantDoc, TableDoc } from '@/types/models';

// Collection path builders
export const usersCol = () => collection(db, 'users');
export const restaurantsCol = () => collection(db, 'restaurants');
export const restaurantDoc = (restaurantId: string) => doc(db, 'restaurants', restaurantId);
export const restaurantSubCol = (restaurantId: string, sub: string) => collection(db, 'restaurants', restaurantId, sub);

// Create restaurant and link to user
export async function createRestaurantForUser({ ownerId, name }: { ownerId: string; name: string }) {
  try {
    const restaurant: Omit<RestaurantDoc, 'createdAt' | 'updatedAt'> & { createdAt?: unknown; updatedAt?: unknown } = {
      ownerId,
      name,
      description: '',
      address: {},
      contactInfo: {},
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        operatingHours: {},
        isActive: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(restaurantsCol(), restaurant);

    await updateDoc(doc(db, 'users', ownerId), {
      restaurantId: ref.id,
    });

    return { id: ref.id, ...restaurant };
  } catch (error) {
    throw new Error('Failed to create restaurant');
  }
}

// Ensure user profile exists
export async function ensureUserProfile(uid: string, data: Record<string, unknown>) {
  try {
    const ref = doc(db, 'users', uid);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true,
        emailVerified: false,
      });
    }
  } catch (error) {
    throw new Error('Failed to ensure user profile');
  }
}

// Queries
export function listenPendingOrders(
  restaurantId: string,
  onNext: Parameters<typeof onSnapshot>[1],
  onError?: Parameters<typeof onSnapshot>[2]
): Unsubscribe {
  const q = query(
    restaurantSubCol(restaurantId, 'orders'),
    where('status', 'in', ['pending', 'confirmed', 'preparing']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, onNext, onError);
}

export async function upsertCategory(
  restaurantId: string,
  categoryId: string | null,
  data: Partial<CategoryDoc>
): Promise<string> {
  try {
    const ref = categoryId
      ? doc(db, 'restaurants', restaurantId, 'categories', categoryId)
      : doc(restaurantSubCol(restaurantId, 'categories'));

    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return ref.id;
  } catch (error) {
    throw new Error('Failed to upsert category');
  }
}

export async function upsertProduct(
  restaurantId: string,
  productId: string | null,
  data: Record<string, unknown>
): Promise<string> {
  try {
    const ref = productId
      ? doc(db, 'restaurants', restaurantId, 'products', productId)
      : doc(restaurantSubCol(restaurantId, 'products'));

    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return ref.id;
  } catch (error) {
    throw new Error('Failed to upsert product');
  }
}

export async function createTable(restaurantId: string, data: Omit<TableDoc, 'restaurantId'>): Promise<string> {
  try {
    const ref = doc(restaurantSubCol(restaurantId, 'tables'));
    await setDoc(ref, {
      ...data,
      restaurantId,
      isActive: data?.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    throw new Error('Failed to create table');
  }
}

export async function createOrder(restaurantId: string, order: Omit<OrderDoc, 'restaurantId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const ref = doc(restaurantSubCol(restaurantId, 'orders'));
    await setDoc(ref, {
      ...order,
      restaurantId,
      status: (order as OrderDoc)?.status ?? 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } satisfies Partial<OrderDoc> as Record<string, unknown>);
    return ref.id;
  } catch (error) {
    throw new Error('Failed to create order');
  }
}

export async function updateOrderStatus(restaurantId: string, orderId: string, status: OrderDoc['status']): Promise<void> {
  try {
    const ref = doc(db, 'restaurants', restaurantId, 'orders', orderId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  } catch (error) {
    throw new Error('Failed to update order status');
  }
}


