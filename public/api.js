// api.js

import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  arrayUnion,
  query, // NUEVO: Importar 'query'
  where, // NUEVO: Importar 'where'
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const PROSPECTS_COLLECTION = "prospects";

/**
 * Verifica si ya existe un prospecto con el mismo nombre, email o teléfono.
 * @param {object} prospectData - Datos del nuevo prospecto.
 * @returns {Promise<boolean>} Retorna true si existe un duplicado, false en caso contrario.
 */
export const checkIfProspectExists = async (prospectData) => {
  const { businessName, email, phone } = prospectData;

  // Creamos una consulta OR para buscar por cualquiera de los campos.
  // IMPORTANTE: Los campos de email y phone deben ser únicos y requeridos para esta validación.
  const prospectosRef = collection(db, PROSPECTS_COLLECTION);

  // Como Firestore no soporta consultas OR nativas complejas en campos diferentes sin índices manuales,
  // haremos 3 consultas separadas y verificaremos si alguna retorna resultados.

  try {
    // 1. Verificar por Nombre de Empresa (coincidencia exacta)
    const nameQuery = query(
      prospectosRef,
      where("businessName", "==", businessName.trim()),
    );
    const nameSnapshot = await getDocs(nameQuery);
    if (!nameSnapshot.empty) {
      return { isDuplicate: true, field: "Nombre de Empresa" };
    }

    // 2. Verificar por Email
    const emailQuery = query(prospectosRef, where("email", "==", email.trim()));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      return { isDuplicate: true, field: "Correo Electrónico" };
    }

    // 3. Verificar por Teléfono
    const phoneQuery = query(prospectosRef, where("phone", "==", phone.trim()));
    const phoneSnapshot = await getDocs(phoneQuery);
    if (!phoneSnapshot.empty) {
      return { isDuplicate: true, field: "Teléfono" };
    }

    return { isDuplicate: false };
  } catch (e) {
    console.error("Error al verificar duplicados:", e);
    // En caso de error, asumimos que no hay duplicados para no bloquear la creación,
    // pero logueamos el error. (Se podría cambiar a lanzar un error si la duplicidad es crítica)
    return { isDuplicate: false };
  }
};

export const subscribeToProspects = (callback, onError) => {
  const prospectsCollectionRef = collection(db, PROSPECTS_COLLECTION);
  return onSnapshot(
    prospectsCollectionRef,
    (snapshot) => {
      const allProspects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(allProspects);
    },
    onError,
  );
};

export const addProspect = async (prospectData) => {
  try {
    const timestamp = new Date().toISOString();
    prospectData.createdAt = timestamp;
    prospectData.lastUpdated = timestamp;
    prospectData.status = prospectData.status || "Pendiente de Correo";
    // NUEVO: Asegurarse de que el campo exista, aunque sea nulo, si se usara en el futuro en el formulario de agregar.
    prospectData.nextFollowUpDate = prospectData.nextFollowUpDate || null;
    return await addDoc(collection(db, PROSPECTS_COLLECTION), prospectData);
  } catch (e) {
    console.error("Error al agregar documento:", e);
    throw new Error("Error al agregar prospecto a la base de datos.");
  }
};

export const updateProspect = async (prospectId, updateData) => {
  if (!prospectId) throw new Error("ID de prospecto es requerido.");
  try {
    const prospectRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    updateData.lastUpdated = new Date().toISOString();
    return await updateDoc(prospectRef, updateData);
  } catch (e) {
    console.error(`Error al actualizar prospecto ${prospectId}:`, e);
    throw new Error("Error al actualizar el prospecto.");
  }
};

export const addFollowUpNote = async (prospectId, noteObject) => {
  if (!prospectId) throw new Error("ID de prospecto es requerido.");
  try {
    const prospectRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    return await updateDoc(prospectRef, {
      followUpNotes: arrayUnion(noteObject),
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`Error al agregar nota al prospecto ${prospectId}:`, e);
    throw new Error("Error al guardar la nota.");
  }
};

export const deleteProspect = async (prospectId) => {
  if (!prospectId) throw new Error("ID de prospecto es requerido.");
  try {
    const prospectRef = doc(db, PROSPECTS_COLLECTION, prospectId);
    return await deleteDoc(prospectRef);
  } catch (e) {
    console.error(`Error al eliminar prospecto ${prospectId}:`, e);
    throw new Error("Error al eliminar el prospecto.");
  }
};
