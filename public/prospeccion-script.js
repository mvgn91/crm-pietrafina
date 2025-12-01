// prospeccion-script.js (Módulo de Prospección)

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
  initFollowUpNotePicker,
  initEditDatePicker,
  renderWeeklyPlanner,
} from "./ui.js";
import {
  subscribeToProspects,
  updateProspect,
  addFollowUpNote,
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

const ESTATUS_CONSOLIDADOS = {
  PENDIENTE: "Pendiente de Correo",
  PROSPECCION: "En Prospección",
  INTERESADO: "Interesado",
  RECHAZADO: "Rechazado",
  CONVERTIDO: "Convertido a cliente",
  CLIENTE: "Ya es nuestro cliente",
};

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

function getGroupIcon(groupName) {
  if (groupName.includes("Interesados")) return "heart";
  if (groupName.includes("Prospección Activa")) return "activity";
  if (groupName.includes("Legado")) return "package";
  return "circle";
}

function handleShowProspectDetails(prospectId) {
  currentProspectIdForModal = prospectId;
  const prospect = allProspects.find((p) => p.id === prospectId);
  if (prospect) showProspectDetailsModal(prospect);
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
        ESTATUS_CONSOLIDADOS.RECHAZADO,
        ESTATUS_CONSOLIDADOS.CONVERTIDO,
        ESTATUS_CONSOLIDADOS.CLIENTE,
      ].includes(prospect.status);

      const isNonConsolidatedActive =
        prospect.status === "Seguimiento agendado" ||
        prospect.status === "No contesta";

      if (
        prospect.status !== ESTATUS_CONSOLIDADOS.INTERESADO &&
        !isArchived &&
        !isNonConsolidatedActive
      ) {
        updatePayload.status = ESTATUS_CONSOLIDADOS.INTERESADO;
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

function handleProspeccionRender() {
  const ARCHIVED_PENDING_STATUSES = [
    ESTATUS_CONSOLIDADOS.PENDIENTE,
    ESTATUS_CONSOLIDADOS.RECHAZADO,
    ESTATUS_CONSOLIDADOS.CONVERTIDO,
    ESTATUS_CONSOLIDADOS.CLIENTE,
  ];

  const filterStatus = document.getElementById("statusFilter")?.value || "active";
  const searchTerm = document.getElementById("searchFilter")?.value?.toLowerCase() || "";
  const sortOrder = document.getElementById("sortFilter")?.value || "followup_asc";
  const stagnantFilterToggle = document.getElementById("stagnant-filter-toggle");
  const isStagnantFilterActive = stagnantFilterToggle?.classList.contains('active') || false;

  const statusFilterElement = document.getElementById("statusFilter");
   if (statusFilterElement) {
      statusFilterElement.disabled = isStagnantFilterActive;
      statusFilterElement.classList.toggle("bg-gray-200", isStagnantFilterActive);
  }

  let filteredProspects = allProspects.filter(p => {
      const searchMatch = !searchTerm ||
        p.businessName?.toLowerCase().includes(searchTerm) ||
        p.contactPerson?.toLowerCase().includes(searchTerm);

      if (isStagnantFilterActive) {
          const isStagnant = p.status === ESTATUS_CONSOLIDADOS.PROSPECCION && Array.isArray(p.followUpNotes) && p.followUpNotes.length === 1;
          return isStagnant && searchMatch;
      } else {
          const statusMatch = filterStatus === "active" 
              ? !ARCHIVED_PENDING_STATUSES.includes(p.status)
              : p.status === filterStatus;
          return statusMatch && searchMatch;
      }
  });

  if (sortOrder === "followup_asc") {
    filteredProspects.sort((a, b) => {
      const dateA = a.nextFollowUpDate ? new Date(a.nextFollowUpDate + "T00:00:00").getTime() : 8640000000000000;
      const dateB = b.nextFollowUpDate ? new Date(b.nextFollowUpDate + "T00:00:00").getTime() : 8640000000000000;
      return dateA - dateB;
    });
  } else if (sortOrder !== "default") {
    filteredProspects.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.createdAt || 0);
      const dateB = new Date(b.lastUpdated || b.createdAt || 0);
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    });
  }

  renderWeeklyPlanner(filteredProspects);

  const LEGACY_STATUSES = ["Seguimiento agendado", "No contesta"];

  const groupedData = {
    "Interesados (Seguimiento Agendado)": filteredProspects.filter(p => p.nextFollowUpDate),
    "Prospección Activa (Sin Fecha Agendada)": filteredProspects.filter(p => !p.nextFollowUpDate && p.status === ESTATUS_CONSOLIDADOS.PROSPECCION),
    "Prospectos Legado (Revisar Estatus)": filteredProspects.filter(p => !p.nextFollowUpDate && LEGACY_STATUSES.includes(p.status)),
  };

  const finalGroupedData = Object.fromEntries(Object.entries(groupedData).filter(([, prospects]) => prospects.length > 0));

  renderAdminGrid(finalGroupedData, getGroupIcon, true);

  attachToggleEventListeners();
  if (typeof lucide !== "undefined") lucide.createIcons();
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUserName = getAppDisplayName(user);
    try {
      sessionStorage.setItem("pf_currentUserName", currentUserName);
    } catch {}

    if (prospectsUnsubscribe) prospectsUnsubscribe();
    prospectsUnsubscribe = subscribeToProspects((prospects) => {
      allProspects = prospects;
      handleProspeccionRender();
    });
  } else {
    if (prospectsUnsubscribe) prospectsUnsubscribe();
    window.location.href = "index.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initFollowUpNotePicker();
  initEditDatePicker(); 

  populateClassificationSelects(CLASSIFICATIONS);

  document.getElementById('stagnant-filter-toggle')?.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('active');
      e.currentTarget.setAttribute('aria-checked', e.currentTarget.classList.contains('active'));
      handleProspeccionRender();
  });

  document.getElementById("weekly-planner-container")?.addEventListener("click", (e) => {
      const detailsBtn = e.target.closest(".view-details-btn");
      if (detailsBtn) {
        return handleShowProspectDetails(detailsBtn.dataset.id);
      }

      const toggleHeader = e.target.closest(".planner-day-header");
      if (toggleHeader) {
        const targetId = toggleHeader.dataset.target;
        if (!targetId) return;

        const targetList = document.querySelector(targetId);
        const toggleIcon = toggleHeader.querySelector(".planner-toggle-icon");

        if (targetList) {
          targetList.classList.toggle("is-expanded");
        }
        if (toggleIcon) {
          toggleIcon.classList.toggle("is-rotated");
        }
      }
    });

  document.getElementById("prospeccion-cards-container")?.addEventListener("click", (e) => {
      const detailsBtn = e.target.closest(".view-details-btn");
      if (detailsBtn) return handleShowProspectDetails(detailsBtn.dataset.id);

      const whatsappBtn = e.target.closest(".whatsapp-btn");
      if (whatsappBtn) {
        const prospect = allProspects.find(p => p.id === whatsappBtn.dataset.id);
        if (prospect) handleOpenWhatsappModal(prospect);
      }
    });

  document.getElementById("detail-close-btn")?.addEventListener("click", closeDetailModal);
  document.getElementById("edit-prospect-btn")?.addEventListener("click", () => {
      const prospect = allProspects.find(p => p.id === currentProspectIdForModal);
      if (prospect) switchToEditView(prospect);
    });
  document.getElementById("cancel-edit-btn")?.addEventListener("click", switchToDisplayView);
  document.getElementById("edit-prospect-form")?.addEventListener("submit", handleUpdateProspectSubmit);

  document.getElementById("add-note-form")?.addEventListener("submit", handleAddNoteSubmit);

  elements.whatsappCloseBtn?.addEventListener("click", closeWhatsappModal);
  elements.whatsappSendBtn?.addEventListener("click", handleSendWhatsapp);
  elements.materialsCheckboxContainer?.addEventListener("change", updateWhatsappMessage);

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
      await updateProspect(currentProspectIdForModal, { nextFollowUpDate: dateStr });
      showSnackbar(`Seguimiento agendado para el ${formattedDate}.`, "success");
    } catch (error) {
      console.error("Error al reagendar:", error);
      showSnackbar("No se pudo reagendar el seguimiento.", "error");
    }
  });

  document.getElementById("statusFilter")?.addEventListener("change", handleProspeccionRender);
  document.getElementById("searchFilter")?.addEventListener("input", handleProspeccionRender);
  document.getElementById("sortFilter")?.addEventListener("change", handleProspeccionRender);
});
