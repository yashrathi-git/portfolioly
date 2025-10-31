import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { env, validateEnv } from "./env";

let appInstance: ReturnType<typeof initializeApp> | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

function getConfig(): FirebaseOptions {
  // Validate environment variables first
  validateEnv();

  const cfg: FirebaseOptions = {
    apiKey: env.FIREBASE_API_KEY!,
    authDomain: env.FIREBASE_AUTH_DOMAIN!,
    projectId: env.FIREBASE_PROJECT_ID!,
    storageBucket: env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID!,
    appId: env.FIREBASE_APP_ID!,
    measurementId: env.FIREBASE_MEASUREMENT_ID,
  };

  return cfg;
}

export function getFirebaseApp() {
  if (appInstance) return appInstance;
  try {
    appInstance = getApps().length ? getApp() : initializeApp(getConfig());
    return appInstance;
  } catch (e) {
    // Defer app init failure to caller to handle gracefully
    throw e;
  }
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  authInstance = getAuth(app);

  // Set auth language to user's preferred language
  if (typeof window !== "undefined") {
    authInstance.languageCode = navigator.language;
  }

  return authInstance;
}

export function getFirestoreDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();
  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}

export async function getIdToken(forceRefresh = false) {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  } catch {
    // If auth isn't initialized due to missing config, return null
    return null;
  }
}

export default getFirebaseApp;
