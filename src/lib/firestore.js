import { collection, doc, setDoc, getDoc, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Collection path builders
export const usersCol = () => collection(db, 'users');
export const restaurantsCol = () => collection(db, 'restaurants');
export const restaurantDoc = (restaurantId) => doc(db, 'restaurants', restaurantId);
export const restaurantSubCol = (restaurantId, sub) => collection(db, 'restaurants', restaurantId, sub);

// Create restaurant and link to user
export async function createRestaurantForUser({ ownerId, name }) {
  const restaurant = {
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
}

// Ensure user profile exists
export async function ensureUserProfile(uid, data) {
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
}

// Queries
export function listenPendingOrders(restaurantId, cb, errCb) {
  const q = query(
    restaurantSubCol(restaurantId, 'orders'),
    where('status', 'in', ['pending', 'confirmed', 'preparing']),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, cb, errCb);
}

export async function upsertCategory(restaurantId, categoryId, data) {
  const ref = categoryId
    ? doc(db, 'restaurants', restaurantId, 'categories', categoryId)
    : doc(restaurantSubCol(restaurantId, 'categories'));

  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return ref.id;
}

export async function upsertProduct(restaurantId, productId, data) {
  const ref = productId
    ? doc(db, 'restaurants', restaurantId, 'products', productId)
    : doc(restaurantSubCol(restaurantId, 'products'));

  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return ref.id;
}

export async function createTable(restaurantId, data) {
  const ref = doc(restaurantSubCol(restaurantId, 'tables'));
  await setDoc(ref, {
    ...data,
    restaurantId,
    isActive: data?.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createOrder(restaurantId, order) {
  const ref = doc(restaurantSubCol(restaurantId, 'orders'));
  await setDoc(ref, {
    ...order,
    restaurantId,
    status: order?.status ?? 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrderStatus(restaurantId, orderId, status) {
  const ref = doc(db, 'restaurants', restaurantId, 'orders', orderId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}


