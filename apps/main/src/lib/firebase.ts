import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let appInstance: ReturnType<typeof initializeApp> | null = null;
let authInstance: Auth | null = null;

function getConfig(): FirebaseOptions {
  const cfg: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } as FirebaseOptions;

  const requiredKeys: (keyof FirebaseOptions)[] = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missing = requiredKeys.filter((k) => !cfg[k] || String(cfg[k]).trim() === "");
  if (missing.length) {
    throw new Error(
      `Firebase config missing env vars: ${missing.join(", ")}. Ensure NEXT_PUBLIC_* envs are set.`
    );
  }
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
  return authInstance;
}

export async function getIdToken(forceRefresh = false) {
  try {
    const user = getFirebaseAuth().currentUser;
    if (!user) return null;
    return user.getIdToken(forceRefresh);
  } catch (e) {
    // If auth isn't initialized due to missing config, return null
    return null;
  }
}

export default getFirebaseApp;