import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

const employeeFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const existingEmployeeApp = getApps().find(
  (app) => app.name === "employee-auth"
);

const employeeApp =
  existingEmployeeApp ||
  initializeApp(
    employeeFirebaseConfig,
    "employee-auth"
  );

export const employeeAuth = getAuth(employeeApp);

export async function createEmployeeFirebaseAccount({
  email,
  password,
  displayName,
}) {
  try {
    const credential =
      await createUserWithEmailAndPassword(
        employeeAuth,
        email,
        password
      );

    const firebaseUser = credential.user;

    if (displayName?.trim()) {
      await updateProfile(firebaseUser, {
        displayName: displayName.trim(),
      });
    }

    const uid = firebaseUser.uid;

    await signOut(employeeAuth);

    return {
      uid,
      email: firebaseUser.email,
      displayName:
        firebaseUser.displayName ||
        displayName ||
        "",
    };
  } catch (error) {
    try {
      await signOut(employeeAuth);
    } catch {
      // Ignore secondary-auth sign-out errors.
    }

    throw error;
  }
}