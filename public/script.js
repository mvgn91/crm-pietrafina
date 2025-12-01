// script.js (Módulo de Administración/Gestión)

import { auth, getAppDisplayName } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  elements,
  renderAdminGrid,
  showProspectDetailsModal,
  populateClassificationSelects,
  switchToEditView,
  switchToDisplayView,
  closeDetailModal,
  addNewNoteToView,
  openWhatsappModal,
  closeWhatsappModal,
  populateMaterialsCheckboxes,
  generateWhatsappMessage,
  showSnackbar,
  showConfirmationModal,
  openAddProspectModal,
  closeAddProspectModal,
  initFollowUpNotePicker,
  initEditDatePicker, // NUEVO: Importar el nuevo inicializador
} from "./ui.js";
import {
  subscribeToProspects,
  addProspect,
  updateProspect,
  deleteProspect,
  addFollowUpNote,
  checkIfProspectExists,
} from "./api.js";

const CLASSIFICATIONS = [
  "Despacho de Arquitectos",
  "Diseño de Interiores",
  "Constructoras",
  "Distribuidores de Acabados",
  "Mueblerías",
  "Showrooms de Baños / Cocinas",
  "Hoteles / Desarrolladores de Hospitalidad",
  "Cruceros / Espacios Comerciales de Lujo",
  "Pisos y Recubrimientos",
  "Corporativos / Oficinas",
  "Proyectos Holísticos / Wellness",
  "Otro",
];

const WHATSAPP_CONFIG = {
  messageTemplate: `¡Hola, {contactName}!\n\nComo acordamos, te comparto los siguientes materiales de Pietrafina:\n\n{materialsList}\n\nQuedo atento a tus comentarios.\n\nSaludos cordiales,\n{userName}\nPietra Fina`,
  materials: [
    { name: "CATALOGO DE PRODUCTOS", url: "https://kutt.it/catalogopf" },
    { name: "LOOKBOOK DE OBRAS", url: "https://kutt.it/lookbook" },
    {
      name: "SELECCION DE MATERIALES PREMIUM",
      url: "https://kutt.it/materialespremium",
    },
  ],
};

let allProspects = [];
let prospectsUnsubscribe = null;
let currentProspectIdForModal = null;
let currentUserName = "Admin";

const ESTATUS_CONSOLIDADOS = {
  PENDIENTE: "Pendiente de Correo",
  PROSPECCION: "En Prospección",
  INTERESADO: "Interesado",
  RECHAZADO: "Rechazado",
  CONVERTIDO: "Convertido a cliente",
  CLIENTE: "Ya es nuestro cliente",
};

function getGroupIcon(groupName) {
  if (groupName.includes("Pendientes")) return "mail";
  if (groupName.includes("Activos")) return "zap";
  if (groupName.includes("Archivo")) return "archive";
  return "circle";
}

function handleShowProspectDetails(prospectId) {
  currentProspectIdForModal = prospectId;
  const prospect = allProspects.find((p) => p.id === prospectId);
  if (prospect) showProspectDetailsModal(prospect);
}

async function handleAddProspectSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const prospectData = Object.fromEntries(formData.entries());

  const duplicateCheck = await checkIfProspectExists(prospectData);

  if (duplicateCheck.isDuplicate) {
    showSnackbar(
      `Ya existe un prospecto con el mismo ${duplicateCheck.field}.`,
      "error",
    );
    return;
  }

  try {
    prospectData.status = prospectData.status || "Pendiente de Correo";
    await addProspect(prospectData);
    showSnackbar("¡Prospecto agregado!", "success");
    event.target.reset();
    closeAddProspectModal();
  } catch (error) {
    showSnackbar("Error al guardar el prospecto.", "error");
  }
}

async function handleUpdateProspectSubmit(event) {
  event.preventDefault();
  if (!currentProspectIdForModal) return;
  const formData = new FormData(event.target);
  const updatedData = Object.fromEntries(formData.entries());

  const nextFollowUpDate = updatedData.nextFollowUpDate
    ? updatedData.nextFollowUpDate
    : null;

  const dataToSend = {
    ...updatedData,
    nextFollowUpDate: nextFollowUpDate,
  };

  try {
    await updateProspect(currentProspectIdForModal, dataToSend);
    showSnackbar("Prospecto actualizado.", "success");
    closeDetailModal();
  } catch (error) {
    showSnackbar("No se pudo actualizar el prospecto.", "error");
  }
}

async function handleDeleteProspect() {
  if (!currentProspectIdForModal) return;
  const confirmed = await showConfirmationModal(
    "Eliminar Prospecto",
    "¿Seguro que quieres eliminar este prospecto? Esta acción es irreversible.",
    "Eliminar",
    "btn-danger",
  );

  if (confirmed) {
    try {
      await deleteProspect(currentProspectIdForModal);
      showSnackbar("Prospecto eliminado.", "success");
      closeDetailModal();
    } catch (error) {
      showSnackbar("Error al eliminar el prospecto.", "error");
    }
  }
}

async function handleAddNoteSubmit(event) {
  event.preventDefault();
  const noteText = elements.addNoteTextarea.value.trim();
  const nextFollowUpDate = elements.nextFollowupInput.value.trim() || null;

  if (!noteText || !currentProspectIdForModal) {
    showSnackbar("La nota de seguimiento es requerida.", "error");
    return;
  }

  const prospect = allProspects.find((p) => p.id === currentProspectIdForModal);
  if (!prospect) return;

  const noteObject = {
    note: noteText,
    date: new Date().toISOString(),
    user: currentUserName,
  };

  const updatePayload = {};

  try {
    if (nextFollowUpDate) {
      const dateParts = nextFollowUpDate.split("-");
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

      const isArchived = [
        "Rechazado",
        "Convertido a cliente",
        "Ya es nuestro cliente",
      ].includes(prospect.status);

      if (prospect.status !== "En Prospección" && !isArchived) {
        updatePayload.status = "En Prospección";
      }
      updatePayload.nextFollowUpDate = nextFollowUpDate;

      const followUpNote = {
        note: `Seguimiento reagendado para el ${formattedDate}.`,
        date: new Date().toISOString(),
        user: "Sistema (Reagendamiento)",
      };
      await addFollowUpNote(currentProspectIdForModal, followUpNote);
      addNewNoteToView(followUpNote);
      showSnackbar(`Seguimiento agendado para el ${formattedDate}.`, "info");
    }

    await addFollowUpNote(currentProspectIdForModal, noteObject);
    addNewNoteToView(noteObject);
    showSnackbar("Nota de seguimiento guardada.", "success");

    if (Object.keys(updatePayload).length > 0) {
      await updateProspect(currentProspectIdForModal, updatePayload);
    }
  } catch (error) {
    console.error("Error al guardar nota o actualizar prospecto:", error);
    showSnackbar(
      "No se pudo guardar la nota o actualizar el prospecto.",
      "error",
    );
  }
}

async function handleMarkAsSent(prospectId) {
  const confirmed = await showConfirmationModal(
    "Confirmar Envío",
    "¿Confirmas que se envió la campaña inicial? El prospecto pasará a 'En Prospección'.",
    "Marcar como Enviado",
    "btn-primary",
  );

  if (confirmed) {
    try {
      await updateProspect(prospectId, {
        status: "En Prospección",
        lastUpdated: new Date().toISOString(),
      });
      const noteObject = {
        note: "Campaña de Alianza Estratégica enviada, Contacto en Prospección.",
        date: new Date().toISOString(),
        user: currentUserName,
      };
      await addFollowUpNote(prospectId, noteObject);
      showSnackbar("Prospecto movido a Prospección.", "success");
    } catch (error) {
      showSnackbar("Error al actualizar estatus.", "error");
    }
  }
}

function handleOpenWhatsappModal(prospect) {
  openWhatsappModal(prospect);
  populateMaterialsCheckboxes(WHATSAPP_CONFIG.materials);
  updateWhatsappMessage();
}

function updateWhatsappMessage() {
  const selectedMaterials = Array.from(
    document.querySelectorAll(".material-checkbox:checked"),
  ).map((checkbox) => ({ name: checkbox.dataset.name, url: checkbox.value }));
  const prospectId = elements.whatsappSendBtn.dataset.prospectId;
  const prospect = allProspects.find((p) => p.id === prospectId);
  if (!prospect) return;
  const contactName = prospect.contactPerson || prospect.businessName;
  generateWhatsappMessage(
    WHATSAPP_CONFIG.messageTemplate,
    contactName,
    currentUserName,
    selectedMaterials,
  );
}

async function handleSendWhatsapp() {
  const { prospectId, prospectPhone } = elements.whatsappSendBtn.dataset;
  let phone = prospectPhone.replace(/[\s-()]/g, "");
  if (!phone.startsWith("52") && phone.length < 11) {
    phone = `52${phone}`;
  }

  const message = elements.whatsappMessageTextarea.value;
  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
  );

  const selectedMaterialsNames = Array.from(
    document.querySelectorAll(".material-checkbox:checked"),
  )
    .map((cb) => cb.dataset.name)
    .join(", ");

  if (selectedMaterialsNames || message.trim().length > 0) {
    const noteContent = selectedMaterialsNames
      ? `Se envió WhatsApp con materiales: ${selectedMaterialsNames}`
      : "Se envió un mensaje de WhatsApp (sin materiales seleccionados).";

    const noteObject = {
      note: noteContent,
      date: new Date().toISOString(),
      user: currentUserName,
    };
    try {
      await addFollowUpNote(prospectId, noteObject);
      showSnackbar("Nota de WhatsApp registrada.", "info");
    } catch (error) {
      console.error("Error al guardar nota de WhatsApp:", error);
      showSnackbar("Error al registrar la nota de WhatsApp.", "error");
    }
  }
  closeWhatsappModal();
}

function attachToggleEventListeners() {
  document
    .querySelectorAll(".prospect-section-header-toggle")
    .forEach((toggle) => {
      const newToggle = toggle.cloneNode(true);
      toggle.parentNode.replaceChild(newToggle, toggle);
      newToggle.addEventListener("click", () => {
        const target = document.querySelector(newToggle.dataset.target);
        target?.classList.toggle("hidden");
        newToggle.querySelector(".toggle-icon")?.classList.toggle("rotate-180");
      });
    });
}

function handleAdminScreenRender() {
  const filterStatus = document.getElementById("statusFilter")?.value || "all";
  const searchTerm =
    document.getElementById("searchFilter")?.value?.toLowerCase() || "";
  const sortOrder = document.getElementById("sortFilter")?.value || "default";

  let filteredProspects = allProspects.filter(
    (p) =>
      (filterStatus === "all" || p.status === filterStatus) &&
      (!searchTerm ||
        p.businessName?.toLowerCase().includes(searchTerm) ||
        p.contactPerson?.toLowerCase().includes(searchTerm)),
  );

  if (sortOrder !== "default") {
    filteredProspects.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.createdAt || 0);
      const dateB = new Date(b.lastUpdated || b.createdAt || 0);
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
    renderAdminGrid(filteredProspects, getGroupIcon, false);
  } else {
    const groups = {
      "Pendientes de Correo": [ESTATUS_CONSOLIDADOS.PENDIENTE],
      Activos: [
        ESTATUS_CONSOLIDADOS.PROSPECCION,
        ESTATUS_CONSOLIDADOS.INTERESADO,
        "Seguimiento agendado",
        "No contesta",
      ],
      Archivo: [
        ESTATUS_CONSOLIDADOS.RECHAZADO,
        ESTATUS_CONSOLIDADOS.CONVERTIDO,
        ESTATUS_CONSOLIDADOS.CLIENTE,
      ],
    };

    const groupedData = Object.fromEntries(
      Object.entries(groups).map(([name, statuses]) => {
        return [
          name,
          filteredProspects.filter((p) => statuses.includes(p.status)),
        ];
      }),
    );

    renderAdminGrid(groupedData, getGroupIcon, true);
  }

  attachToggleEventListeners();
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// ✨ CORRECCIÓN: Simplificado para el nuevo layout
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 1. Guarda el nombre del usuario para que navigation.js lo use
    currentUserName = getAppDisplayName(user);
    try {
      sessionStorage.setItem("pf_currentUserName", currentUserName);
    } catch {}

    // 2. Inicia la suscripción a los datos de prospectos
    if (prospectsUnsubscribe) prospectsUnsubscribe();
    prospectsUnsubscribe = subscribeToProspects((prospects) => {
      allProspects = prospects;
      handleAdminScreenRender(); // Renderiza los datos cuando lleguen
    });
  } else {
    // Si no hay usuario, redirige al login
    if (prospectsUnsubscribe) prospectsUnsubscribe();
    window.location.href = "index.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  populateClassificationSelects(CLASSIFICATIONS);
  initFollowUpNotePicker();
  initEditDatePicker(); // NUEVO: Llamar al inicializador para el modal de edición

  document
    .getElementById("add-prospect-btn")
    ?.addEventListener("click", openAddProspectModal);
  document
    .getElementById("add-prospect-close-btn")
    ?.addEventListener("click", closeAddProspectModal);
  document
    .getElementById("add-prospect-form")
    ?.addEventListener("submit", handleAddProspectSubmit);

  document
    .getElementById("admin-prospects-cards-container")
    ?.addEventListener("click", (e) => {
      const detailsBtn = e.target.closest(".view-details-btn");
      if (detailsBtn) return handleShowProspectDetails(detailsBtn.dataset.id);

      const whatsappBtn = e.target.closest(".whatsapp-btn");
      if (whatsappBtn) {
        const prospect = allProspects.find(
          (p) => p.id === whatsappBtn.dataset.id,
        );
        if (prospect) handleOpenWhatsappModal(prospect);
      }

      const sentBtn = e.target.closest(".mark-as-sent-btn");
      if (sentBtn) return handleMarkAsSent(sentBtn.dataset.id);
    });

  document
    .getElementById("detail-close-btn")
    ?.addEventListener("click", closeDetailModal);
  document
    .getElementById("edit-prospect-btn")
    ?.addEventListener("click", () => {
      const prospect = allProspects.find(
        (p) => p.id === currentProspectIdForModal,
      );
      if (prospect) switchToEditView(prospect);
    });
  document
    .getElementById("delete-prospect-btn")
    ?.addEventListener("click", handleDeleteProspect);
  document
    .getElementById("cancel-edit-btn")
    ?.addEventListener("click", switchToDisplayView);
  document
    .getElementById("edit-prospect-form")
    ?.addEventListener("submit", handleUpdateProspectSubmit);
  document
    .getElementById("add-note-form")
    ?.addEventListener("submit", handleAddNoteSubmit);

  elements.whatsappCloseBtn?.addEventListener("click", closeWhatsappModal);
  elements.whatsappSendBtn?.addEventListener("click", handleSendWhatsapp);
  elements.materialsCheckboxContainer?.addEventListener(
    "change",
    updateWhatsappMessage,
  );

  document.addEventListener("followup:dateSelected", async (e) => {
    if (!currentProspectIdForModal) return;
    const dateStr = e.detail?.dateStr;
    if (!dateStr) return;
    try {
      const [y, m, d] = dateStr.split("-");
      const formattedDate = `${d}/${m}/${y}`;

      const followUpNote = {
        note: `Seguimiento reagendado para el ${formattedDate}.`,
        date: new Date().toISOString(),
        user: "Sistema (Reagendamiento)",
      };
      await addFollowUpNote(currentProspectIdForModal, followUpNote);
      addNewNoteToView(followUpNote);
      await updateProspect(currentProspectIdForModal, {
        nextFollowUpDate: dateStr,
      });
      showSnackbar(`Seguimiento agendado para el ${formattedDate}.`, "success");
    } catch (error) {
      console.error("Error al reagendar:", error);
      showSnackbar("No se pudo reagendar el seguimiento.", "error");
    }
  });

  document
    .getElementById("statusFilter")
    ?.addEventListener("change", handleAdminScreenRender);
  document
    .getElementById("searchFilter")
    ?.addEventListener("input", handleAdminScreenRender);
  document
    .getElementById("sortFilter")
    ?.addEventListener("change", handleAdminScreenRender);
});

