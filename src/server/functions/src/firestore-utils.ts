/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable valid-jsdoc */
import * as admin from "firebase-admin";

try {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Додати новий товар
 */
async function addProduct(product: {
  id: string;
  name: string;
  price: number;
  discount?: number;
  images: string[];
  categoryId: string;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  description: string;
  specs: Record<string, string>;
}) {
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    discount: product.discount || 0,
    images: product.images,
    image: product.images[0] || "",
    categoryId: product.categoryId,
    inStock: product.inStock ?? true,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    description: product.description,
    specs: product.specs,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await db.collection("products").doc(product.id).set(productData);
  return productData;
}

/**
 * Оновити існуючий товар
 */
async function updateProduct(
  productId: string,
  updates: Partial<{
    name: string;
    price: number;
    discount: number;
    images: string[];
    categoryId: string;
    inStock: boolean;
    rating: number;
    reviews: number;
    description: string;
    specs: Record<string, string>;
  }>
) {
  await db.collection("products").doc(productId).update({
    ...updates,
    updatedAt: admin.firestore.Timestamp.now(),
  });
}

/**
 * Видалити товар
 */
async function deleteProduct(productId: string) {
  await db.collection("products").doc(productId).delete();
}

/**
 * Отримати всі товари
 */
async function getAllProducts() {
  const snapshot = await db.collection("products").get();
  return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

/**
 * Отримати товари за категорією
 */
async function getProductsByCategory(categoryId: string) {
  const snapshot = await db
    .collection("products")
    .where("categoryId", "==", categoryId)
    .get();
  return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

/**
 * Додати нову категорію
 */
async function addCategory(category: {
  id: string;
  name: string;
  icon: string;
  color: string;
}) {
  const categoryData = {
    ...category,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await db.collection("categories").doc(category.id).set(categoryData);
  return categoryData;
}

/**
 * Отримати всі категорії
 */
async function getAllCategories() {
  const snapshot = await db.collection("categories").get();
  return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

/**
 * Додати новий банер
 */
async function addBanner(banner: {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  backgroundColor: string;
  isActive: boolean;
  order: number;
}) {
  const bannerData = {
    ...banner,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  };

  await db.collection("banners").doc(banner.id).set(bannerData);
  return bannerData;
}

/**
 * Отримати активні банери
 */
async function getActiveBanners() {
  const snapshot = await db
    .collection("banners")
    .where("isActive", "==", true)
    .orderBy("order", "asc")
    .get();
  return snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

export {
  addProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductsByCategory,
  addCategory,
  getAllCategories,
  addBanner,
  getActiveBanners,
};
