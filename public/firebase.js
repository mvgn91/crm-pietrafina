// Dentro de firebase.js

// Importa las funciones necesarias de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Tu configuración de Firebase para la aplicación web
// ✨ ¡Estas son tus credenciales de producción! ✨
const firebaseConfig = {
  apiKey: "AIzaSyB2VgG-spKXngIcC5pbP_Knpi3e06c6z4E",
  authDomain: "crm-pietrafina.firebaseapp.com",
  projectId: "crm-pietrafina",
  storageBucket: "crm-pietrafina.firebasestorage.app", // Corregido, puede que sea .app o no, verifica en tu consola
  messagingSenderId: "765972736898",
  appId: "1:765972736898:web:2fef1247ca6a8641607d9b",
  measurementId: "G-FG5ZMLTQLX",
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta las instancias para que otros archivos puedan usarlas
export const db = getFirestore(app);
export const auth = getAuth(app);

// Mapeo centralizado de UID -> Nombre público para la app
export const USER_UID_TO_NAME = {
  kRTRRDQ9k9hFzSqy1S5a53dplN73: "Ricardo",
  UID_DEL_VENDEDOR_2: "Vendedor 2",
  // Agrega más usuarios aquí si es necesario
};

// --- ✨ CORRECCIÓN APLICADA AQUÍ ---
// La función ahora recibe el objeto "user" completo
export const getAppDisplayName = (user) => {
  // 1. Verificamos que el usuario exista y tenga un uid
  if (!user || !user.uid) {
    return "Usuario Desconocido";
  }
  // 2. Usamos user.uid (el texto) para buscar en el mapa
  return USER_UID_TO_NAME[user.uid] || "Usuario Desconocido";
};
