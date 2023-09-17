// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { getFunctions } from "firebase/functions";



// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiJ-ngu7DkOdFRNy4GshpweG-6RF5yg8c",
  authDomain: "clone-96d7a.firebaseapp.com",
  projectId: "clone-96d7a",
  appId: "1:315897145001:web:083ffaf3bec4c2afa4ebb8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);
const auth = getAuth(app);

/**
 * Signs the user in with a Google popup.
 * @returns A promise that resolves with the user's credentials.
 */
export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

/**
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */
export function signOut() {
  return auth.signOut();
}

/**
 * Trigger a callback when user auth state changes.
 * @returns A function to unsubscribe callback.
 */
export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
