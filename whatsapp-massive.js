// WhatsApp Material Sender - Integración con Firestore (VERSIÓN DE PRUEBA)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Configuración de Firebase para tu aplicación web
const firebaseConfig = {
    apiKey: "AIzaSyB2VgG-spKXngIcC5pbP_Knpi3e06c6z4E",
    authDomain: "crm-pietrafina.firebaseapp.com",
    projectId: "crm-pietrafina",
    storageBucket: "crm-pietrafina.firebasestorage.app",
    messagingSenderId: "765972736898",
    appId: "1:765972736898:web:3cffb3322601fa5d607d9b",
    measurementId: "G-2BZ0J4T69V"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUserName = "Pietra Fina"; // Default name

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in.
    if (user.uid === "Wv1BcMQlQreQ3doUPccObJdX6cS2") { // Nicolas\'s UID
      currentUserName = "NICOLAS CAPETILLO";
    } else if (user.uid === "n4WFgGtOtDQwYaV9QXy16bDvYE32") { // Francisco\'s UID
      currentUserName = "FRANCISCO CAPETILLO";
    }
  } else {
    // User is signed out.
    currentUserName = "Pietra Fina";
  }
});

document.addEventListener(\'DOMContentLoaded\', function () {
  console.log(\'WhatsApp Massive JS cargado (VERSIÓN DE PRUEBA)\');
  
  const tbody = document.getElementById(\'whatsapp-massive-tbody\');
  const searchInput = document.getElementById(\'whatsapp-massive-search\');
  const modal = document.getElementById(\'whatsapp-massive-modal\');
  const modalClose = document.getElementById(\'whatsapp-massive-modal-close\');
  const modalMessage = document.getElementById(\'whatsapp-massive-message\');
  const modalSend = document.getElementById(\'whatsapp-massive-send-btn\');
  const modalCancel = document.getElementById(\'whatsapp-massive-cancel-btn\');
  const materialsCheckboxContainer = document.getElementById(\'materials-checkbox-container\');

  let selectedProspect = null;
  let prospects = [];

  // Materiales disponibles para envío
  const MATERIALS = [
    {
      name: \'CATALOGO DE PRODUCTOS\',
      url: \'http://bit.ly/3IbX56b\'
    },
    {
      name: \'LOOKBOOK DE OBRAS\',
      url: \'https://bit.ly/4kj5TnW\'
    },
    {
      name: \'SELECCION DE MATERIALES PREMIUM\',
      url: \'https://bit.ly/4etgonw\'
    }
  ];

  // Función para cargar prospectos desde Firestore
  async function loadProspectsFromFirestore() {
    try {
      showLoadingState();
      if (!db) {
        console.warn(\'Firestore no disponible, usando datos de prueba\');
        loadTestData();
        return;
      }
      
      console.log(\'Cargando prospectos desde Firestore...\');
      const snapshot = await getDocs(collection(db, \'prospects\'));
      
      if (snapshot.empty) {
        console.log(\'No se encontraron prospectos en Firestore\');
        prospects = [];
        renderTable(prospects);
        return;
      }
      
      prospects = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        prospects.push({
          id: doc.id,
          businessName: data.businessName || data.nombre || \'Sin nombre\',
          contactPerson: data.contactPerson || data.contacto || \'\',
          phone: data.phone || data.telefono || \'\',
          email: data.email || data.correo || \'\',
          classification: data.classification || data.clasificacion || \'\',
          status: data.status || data.estado || \'\',
          observations: data.observations || data.observaciones || \'\',
          createdAt: data.createdAt || data.fechaCreacion || null
        });
      });
      
      console.log(`${prospects.length} prospectos cargados desde Firestore`);
      renderTable(prospects);
      
    } catch (error) {
      console.error(\'Error cargando prospectos desde Firestore:\', error);
      showToast(\'Error al cargar prospectos desde la base de datos\', \'error\');
      loadTestData();
    }
  }

  // Función para mostrar estado de carga
  function showLoadingState() {
    tbody.innerHTML = `
      <tr>
        <td colspan=\



