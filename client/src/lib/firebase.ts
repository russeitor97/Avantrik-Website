/**
 * Firebase Auth para la nube de la app "Reportes de Servicio".
 *
 * Firestore ahora exige usuario autenticado (reglas: request.auth != null),
 * así que el login del portal también inicia sesión en Firebase con las
 * mismas credenciales (los 5 correos existen en Firebase Authentication).
 *
 * La sesión queda persistida en el navegador (IndexedDB) y la página
 * estática /portal/reportes/ — que usa el SDK compat 10.12 con la misma
 * config — la reutiliza automáticamente por ser el mismo origen. Por eso
 * este paquete se fija en la versión 10.12.0.
 *
 * La config es pública por diseño; la seguridad la ponen las reglas.
 */
import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6XFIWY30BvFnja7OKbc47VlhefjZsATg",
  authDomain: "avantrik-reportes.firebaseapp.com",
  projectId: "avantrik-reportes",
  storageBucket: "avantrik-reportes.firebasestorage.app",
  messagingSenderId: "698602968065",
  appId: "1:698602968065:web:3bf8da147167130ccddc00",
};

function app() {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

/** Inicia sesión en Firebase con las mismas credenciales del portal. */
export async function firebaseSignIn(email: string, password: string) {
  const auth = getAuth(app());
  await setPersistence(auth, browserLocalPersistence);
  await signInWithEmailAndPassword(auth, email, password);
}

/** Cierra la sesión de Firebase (al cerrar sesión del portal). */
export async function firebaseSignOut() {
  try {
    await signOut(getAuth(app()));
  } catch {
    // sin sesión de Firebase que cerrar
  }
}
