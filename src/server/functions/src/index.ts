import {onRequest} from "firebase-functions/v2/https";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, Query, FieldValue} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import express, {Request, Response} from "express";
import cors from "cors";
import * as crypto from "crypto";
import {VertexAI} from "@google-cloud/vertexai";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

/**
 * Gets the LiqPay private key from environment
 * @return {string} - LiqPay private key
 */
function getLiqPayPrivateKey(): string {
  return process.env.LIQPAY_PRIVATE_KEY || "";
}

/**
 * Verifies the LiqPay signature for callback security
 * @param {string} data - Base64 encoded payment data
 * @param {string} signature - Signature from LiqPay
 * @return {boolean} - Whether the signature is valid
 */
function verifyLiqPaySignature(data: string, signature: string): boolean {
  const privateKey = getLiqPayPrivateKey();
  const expectedSignature = crypto
    .createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
  return expectedSignature === signature;
}

const app = express();
app.use(cors({origin: true}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "GadgetStore API is running!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/products", async (req: Request, res: Response) => {
  try {
    const {category, limit = 50} = req.query;

    let query: Query = db.collection("products");

    if (category && typeof category === "string") {
      query = query.where("categoryId", "==", category);
    }

    const snapshot = await query.limit(Number(limit)).get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({success: true, data: products});
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
});

app.get("/products/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    return res.json({success: true, data: {id: doc.id, ...doc.data()}});
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch product",
    });
  }
});

app.get("/categories", async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("categories").get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({success: true, data: categories});
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
});

app.get("/banners", async (req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection("banners")
      .where("isActive", "==", true)
      .orderBy("order", "asc")
      .get();

    const banners = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({success: true, data: banners});
  } catch (error) {
    console.error("Error fetching banners:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch banners",
    });
  }
});

app.get("/home", async (req: Request, res: Response) => {
  try {
    const [categoriesSnapshot, productsSnapshot, bannersSnapshot] =
      await Promise.all([
        db.collection("categories").get(),
        db.collection("products").limit(50).get(),
        db.collection("banners").get(),
      ]);

    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    interface ProductWithDiscount {
      id: string;
      discount?: number;
    }

    const allProducts = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductWithDiscount[];

    const featuredProducts = allProducts
      .filter((p) => p.discount && p.discount >= 10)
      .slice(0, 12);

    interface BannerData {
      id: string;
      isActive?: boolean;
      order?: number;
    }

    const allBanners = bannersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BannerData[];

    const banners = allBanners
      .filter((b) => b.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return res.json({
      success: true,
      data: {
        categories,
        featuredProducts,
        banners,
      },
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch home data",
    });
  }
});

app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const {email, password, displayName} = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email та пароль обов'язкові",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Пароль повинен містити мінімум 6 символів",
      });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    await db.collection("users").doc(userRecord.uid).set({
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const customToken = await auth.createCustomToken(userRecord.uid);

    return res.status(201).json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        token: customToken,
      },
      message: "Акаунт успішно створено",
    });
  } catch (error: unknown) {
    console.error("Error registering user:", error);

    let errorMessage = "Помилка реєстрації";
    const err = error as {code?: string};
    if (err.code === "auth/email-already-exists") {
      errorMessage = "Цей email вже використовується";
    } else if (err.code === "auth/invalid-email") {
      errorMessage = "Невірний формат email";
    } else if (err.code === "auth/weak-password") {
      errorMessage = "Пароль занадто простий";
    }

    return res.status(400).json({success: false, error: errorMessage});
  }
});

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email обов'язковий",
      });
    }

    const userRecord = await auth.getUserByEmail(email);

    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const customToken = await auth.createCustomToken(userRecord.uid);

    return res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userData?.displayName,
        token: customToken,
        ...userData,
      },
    });
  } catch (error: unknown) {
    console.error("Error logging in user:", error);

    const err = error as {code?: string};
    if (err.code === "auth/user-not-found") {
      return res.status(404).json({
        success: false,
        error: "Користувача не знайдено",
        code: "USER_NOT_FOUND",
      });
    }

    return res.status(400).json({success: false, error: "Помилка входу"});
  }
});

app.post("/auth/verify", async (req: Request, res: Response) => {
  try {
    const {idToken} = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: "Токен обов'язковий",
      });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userRecord = await auth.getUser(uid);

    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    return res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        ...userData,
      },
    });
  } catch (error: unknown) {
    console.error("Error verifying token:", error);
    return res.status(401).json({
      success: false,
      error: "Недійсний токен",
    });
  }
});

app.get("/auth/user/:uid", async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid as string;

    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    return res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        ...userData,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching user:", error);

    const err = error as {code?: string};
    if (err.code === "auth/user-not-found") {
      return res.status(404).json({
        success: false,
        error: "Користувача не знайдено",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Помилка отримання даних користувача",
    });
  }
});

app.put("/auth/user/:uid", async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid as string;
    const {displayName, photoURL} = req.body;

    const updateData: {displayName?: string; photoURL?: string} = {};
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;

    if (Object.keys(updateData).length > 0) {
      await auth.updateUser(uid, updateData);
    }

    await db.collection("users").doc(uid).update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const userRecord = await auth.getUser(uid);

    return res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      },
      message: "Профіль оновлено",
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      error: "Помилка оновлення профілю",
    });
  }
});

app.get("/orders/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const snapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({success: true, data: orders});
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
});

app.put("/orders/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const {
      customerFirstName,
      customerLastName,
      customerEmail,
      deliveryAddress,
    } = req.body;

    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const updateData: {
      customerFirstName?: string;
      customerLastName?: string;
      customerEmail?: string;
      deliveryAddress?: string;
      updatedAt: ReturnType<typeof FieldValue.serverTimestamp>;
    } = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (customerFirstName !== undefined) {
      updateData.customerFirstName = customerFirstName;
    }
    if (customerLastName !== undefined) {
      updateData.customerLastName = customerLastName;
    }
    if (customerEmail !== undefined) {
      updateData.customerEmail = customerEmail;
    }
    if (deliveryAddress !== undefined) {
      updateData.deliveryAddress = deliveryAddress;
    }

    await orderRef.update(updateData);

    const updatedDoc = await orderRef.get();

    return res.json({
      success: true,
      data: {id: updatedDoc.id, ...updatedDoc.data()},
      message: "Замовлення оновлено",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update order",
    });
  }
});

app.post("/liqpay/callback", async (req: Request, res: Response) => {
  try {
    const {data, signature} = req.body;

    if (!data || !signature) {
      console.error("LiqPay callback: Missing data or signature");
      return res.status(400).json({
        success: false,
        error: "Missing data or signature",
      });
    }

    if (!verifyLiqPaySignature(data, signature)) {
      console.error("LiqPay callback: Invalid signature");
      return res.status(403).json({success: false, error: "Invalid signature"});
    }

    const decodedData = Buffer.from(data, "base64").toString("utf-8");
    const paymentData = JSON.parse(decodedData);

    console.log("LiqPay callback received - FULL RAW DATA:", decodedData);
    console.log("LiqPay callback - ALL KEYS:", Object.keys(paymentData));
    console.log(
      "LiqPay callback - FULL PARSED:",
      JSON.stringify(paymentData, null, 2)
    );

    if (paymentData.status === "success" || paymentData.status === "sandbox") {
      type CartItemType = {
        productId: string;
        productName: string;
        productImage: string;
        quantity: number;
        price: number;
      };

      let parsedUserId = "unknown";
      let parsedDeliveryMethod = "unknown";
      let parsedDeliveryAddress = "";
      let parsedDeliveryCostIncluded: string | null = null;
      let parsedCartItems: CartItemType[] = [];
      let parsedCustomerEmail = "";
      let parsedPromoCode: string | null = null;
      let parsedPromoDiscount = 0;

      if (paymentData.info) {
        try {
          const parsedInfo = JSON.parse(paymentData.info);
          parsedUserId = parsedInfo.userId || "unknown";
          parsedDeliveryMethod = parsedInfo.deliveryMethod || "unknown";
          parsedDeliveryAddress = parsedInfo.deliveryAddress || "";
          parsedDeliveryCostIncluded = parsedInfo.deliveryCostIncluded || null;
          parsedCustomerEmail = parsedInfo.customerEmail || "";
          parsedPromoCode = parsedInfo.promoCode || null;
          parsedPromoDiscount = parsedInfo.promoDiscount || 0;
          if (parsedInfo.cartItems) {
            parsedCartItems = JSON.parse(parsedInfo.cartItems);
          }
        } catch (e) {
          console.error("Error parsing info field:", e);
        }
      }

      const customerEmail = paymentData.sender_email ||
                           parsedCustomerEmail ||
                           "";

      console.log("Customer email found:", customerEmail);
      console.log("sender_email from LiqPay:", paymentData.sender_email);
      console.log("parsedCustomerEmail from params:", parsedCustomerEmail);

      const orderData = {
        orderId: paymentData.order_id,
        userId: parsedUserId,
        customerEmail: customerEmail,
        customerFirstName: paymentData.sender_first_name || "",
        customerLastName: paymentData.sender_last_name || "",
        items: parsedCartItems,
        totalAmount: paymentData.amount,
        promoCode: parsedPromoCode,
        promoDiscount: parsedPromoDiscount,
        deliveryMethod: parsedDeliveryMethod,
        deliveryAddress: parsedDeliveryAddress,
        deliveryCostIncluded: parsedDeliveryCostIncluded,
        paymentMethod: "liqpay",
        status: "paid",
        createdAt: FieldValue.serverTimestamp(),
      };

      await db.collection("orders").doc(paymentData.order_id).set(orderData);

      console.log("Order saved successfully:", paymentData.order_id);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing LiqPay callback:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: "europe-central2",
});

/**
 * Fetches store context from Firestore (categories, products, and AI configs)
 * @return {Promise<string>} - Context string for AI
 */
async function getStoreContext(): Promise<string> {
  try {
    // 1. Отримуємо категорії
    const categoriesSnapshot = await db.collection("categories").get();
    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Отримуємо товари
    const productsSnapshot = await db.collection("products").get();
    const products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 3. Отримуємо AI конфігурації (FAQ, Про нас, Політики)
    const configSnapshot = await db.collection("ai_config").get();

    // Формуємо контекст з ai_config
    const configContext = configSnapshot.docs.map((doc) => {
      const data = doc.data();
      const docId = doc.id;

      // Намагаємося розпарсити JSON рядок, якщо він є
      let parsedContent: string;
      if (data.json_data && typeof data.json_data === "string") {
        try {
          const json = JSON.parse(data.json_data);
          // Перетворюємо назад в красивий рядок для AI
          parsedContent = JSON.stringify(json, null, 2);
        } catch (e) {
          parsedContent = data.json_data; // Якщо не JSON, беремо як є
        }
      } else {
        // Якщо даних немає або інший формат
        parsedContent = JSON.stringify(data, null, 2);
      }

      return `--- РОЗДІЛ: ${docId} ---\n${parsedContent}`;
    }).join("\n\n");

    interface CategoryData {
      id: string;
      name?: string;
    }

    interface ProductData {
      id: string;
      name?: string;
      title?: string;
      price?: number;
      oldPrice?: number;
      description?: string;
      specs?: Record<string, unknown>;
      specifications?: Record<string, unknown>;
      inStock?: boolean;
    }

    // Форматуємо категорії
    const categoriesContext = (categories as CategoryData[])
      .map((cat) => `- ${cat.name || cat.id}`)
      .join("\n");

    // Форматуємо товари (включаючи ціни та характеристики)
    const productsContext = (products as ProductData[])
      .map((prod) => {
        let productInfo = `- ${prod.name || prod.title}`;
        if (prod.price) productInfo += `, Ціна: ${prod.price} грн`;
        if (prod.oldPrice) {
          productInfo += ` (стара ціна: ${prod.oldPrice} грн)`;
        }
        if (prod.description) productInfo += `, Опис: ${prod.description}`;

        if (prod.specs || prod.specifications) {
          const specs = prod.specs || prod.specifications;
          if (typeof specs === "object") {
            const specsStr = Object.entries(specs)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ");
            productInfo += `, Характеристики: ${specsStr}`;
          } else {
            productInfo += `, Характеристики: ${specs}`;
          }
        }
        if (prod.inStock !== undefined) {
          productInfo += `, В наявності: ${prod.inStock ? "Так" : "Ні"}`;
        }
        return productInfo;
      })
      .join("\n");

    // Збираємо все разом
    return `
КОНТЕКСТ МАГАЗИНУ (використовуй цю інформацію для відповідей):

=== КАТЕГОРІЇ ТОВАРІВ ===
${categoriesContext || "Немає категорій"}

=== ТОВАРИ В МАГАЗИНІ ===
${productsContext || "Немає товарів"}

=== ДОДАТКОВА ІНФОРМАЦІЯ (FAQ, Умови, Контакти) ===
Використовуй цю інформацію для відповідей про доставку, гарантію тощо.
${configContext || "Немає додаткової інформації"}
`;
  } catch (error) {
    console.error("Error fetching store context:", error);
    return "";
  }
}

/**
 * Creates a generative model with store context
 * @param {string} storeContext - Context from Firestore
 * @return {object} - Model with context
 */
function createModelWithContext(storeContext: string) {
  const baseInstruction =
      "Ти - корисний AI асистент інтернет-магазину GadgetStore. " +
      "ВАЖЛИВО: Ти працюєш всередині мобільного застосунку GadgetStore. " +
      "Користувач спілкується з тобою безпосередньо через екран " +
      "'AI Асистент' у мобільному додатку. " +
      "GadgetStore - це інтернет-магазин, який працює ВИКЛЮЧНО " +
      "через мобільний застосунок для Android. Сайту у магазину НЕМАЄ. " +
      "Якщо користувач питає про сайт - поясни, що магазин доступний " +
      "тільки через мобільний застосунок, в якому він зараз знаходиться. " +
      "Ти допомагаєш користувачам з питаннями про товари, замовлення, " +
      "доставку та інші питання магазину. " +
      "Відповідай українською мовою, будь ввічливим та корисним. " +
      "Використовуй наданий контекст магазину для точних " +
      "відповідей про товари, ціни та характеристики. " +
      "ВАЖЛИВО ПРО ЦІНИ: Якщо у товару є поле 'discount' і воно більше 0 - " +
      "це знижка у відсотках. ТИ ЗОБОВ'ЯЗАНИЙ порахувати фінальну ціну: " +
      "потрібно відняти цей відсоток від значення 'price'. " +
      "Користувачу називай вже кінцеву розраховану ціну зі знижкою. " +
      "Приклад: якщо price 1000, а discount 10, то ціна буде 900. " +
      "Якщо користувач питає про конкретний товар - " +
      "шукай його в контексті і давай точну інформацію. " +
      "ВАЖЛИВО: Якщо ти НЕ БАЧИШ товару в контексті - " +
      "НЕ КАЖИ, що товару немає в наявності. " +
      "Замість цього скажи: 'Вибачте, я не знайшов детальної " +
      "інформації про цей товар. Спробуйте знайти його через каталог'. " +
      "Це важливо, щоб не вводити користувача в оману. " +
      "Якщо питання не стосується магазину чи товарів - " +
      "все одно намагайся допомогти. " +
      "ВАЖЛИВО: Ніколи не використовуй Markdown форматування " +
      "у своїх відповідях. " +
      "Не використовуй зірочки (*), решітки (#), тире для списків (-), " +
      "жирний або курсивний текст, посилання у форматі [текст](url) тощо. " +
      "Відповідай простим текстом без будь-якого форматування.";

  return vertexAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: baseInstruction + "\n\n" + storeContext,
  });
}

/**
 * Generates a chat title from the first message
 * @param {string} message - The first message
 * @return {string} - Generated title
 */
function generateChatTitle(message: string): string {
  const maxLength = 50;
  const cleaned = message.replace(/\n/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.substring(0, maxLength) + "...";
}

app.get("/chat/conversations/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const snapshot = await db
      .collection("conversations")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const conversations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({success: true, data: conversations});
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch conversations",
    });
  }
});

app.get(
  "/chat/conversations/:userId/:conversationId",
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const conversationId = req.params.conversationId as string;

      const doc = await db
        .collection("conversations")
        .doc(conversationId)
        .get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Conversation not found",
        });
      }

      const data = doc.data();
      if (data?.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      return res.json({success: true, data: {id: doc.id, ...data}});
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch conversation",
      });
    }
  }
);

app.post("/chat/conversations", async (req: Request, res: Response) => {
  try {
    const {userId} = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const conversationRef = await db.collection("conversations").add({
      userId,
      title: "Новий чат",
      messages: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await conversationRef.get();

    return res.status(201).json({
      success: true,
      data: {id: doc.id, ...doc.data()},
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create conversation",
    });
  }
});

app.post("/chat/message", async (req: Request, res: Response) => {
  try {
    const {userId, conversationId, message} = req.body;

    if (!userId || !conversationId || !message) {
      return res.status(400).json({
        success: false,
        error: "userId, conversationId, and message are required",
      });
    }

    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Conversation not found",
      });
    }

    const conversationData = conversationDoc.data();
    if (conversationData?.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
      });
    }

    const existingMessages = conversationData?.messages || [];

    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    const storeContext = await getStoreContext();

    const generativeModel = createModelWithContext(storeContext);

    interface ChatMessage {
      role: string;
      content: string;
      timestamp?: string;
    }

    const chatHistory = existingMessages.map((msg: ChatMessage) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{text: msg.content}],
    }));

    const chat = generativeModel.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const aiResponseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Вибачте, не вдалося отримати відповідь.";

    const aiMessage = {
      role: "assistant",
      content: aiResponseText,
      timestamp: new Date().toISOString(),
    };

    const isFirstMessage = existingMessages.length === 0;
    const updateData: {
      messages: ChatMessage[];
      updatedAt: ReturnType<typeof FieldValue.serverTimestamp>;
      title?: string;
    } = {
      messages: [...existingMessages, userMessage, aiMessage],
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isFirstMessage) {
      updateData.title = generateChatTitle(message);
    }

    await conversationRef.update(updateData);

    return res.json({
      success: true,
      data: {
        userMessage,
        aiMessage,
        title: isFirstMessage ? updateData.title : conversationData?.title,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
});

app.delete(
  "/chat/conversations/:userId/:conversationId",
  async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const conversationId = req.params.conversationId as string;

      const conversationRef = db
        .collection("conversations")
        .doc(conversationId);
      const doc = await conversationRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Conversation not found",
        });
      }

      const data = doc.data();
      if (data?.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      await conversationRef.delete();

      return res.json({success: true, message: "Conversation deleted"});
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete conversation",
      });
    }
  }
);

export const api = onRequest(app);
