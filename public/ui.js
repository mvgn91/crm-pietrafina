import { STATUS_META, getStatusBadgeClass, groupProspects } from "./status-model.js";
// ui.js

// Nota Importante: Las funciones de control de UI (modales, snackbar, etc.) se definen aquí
// y se EXPORTAN para ser utilizadas por script.js y prospeccion-script.js sin re-declaraciones.

export const elements = {
  // Elementos Comunes
  adminScreen: document.getElementById("admin-screen"),
  adminProspectsCardsContainer: document.getElementById(
    "admin-prospects-cards-container",
  ),
  adminNoProspectsDiv: document.getElementById("admin-no-prospects"),
  prospeccionCardsContainer: document.getElementById(
    "prospeccion-cards-container",
  ),

  // Selectores y Filtros
  classificationSelect: document.getElementById("classification"), // Add Prospect Modal
  editClassificationSelect: document.getElementById("edit-classification"), // Edit Prospect View

  // Modales
  detailCallBtn: document.getElementById("detail-call-btn"),
  detailModal: document.getElementById("detail-modal"),
  detailModalContent: document.getElementById("detail-modal-content"),
  detailDisplayView: document.getElementById("detail-display-view"),
  detailEditView: document.getElementById("detail-edit-view"),

  // Detalle del Prospecto (Display View)
  detailBusinessName: document.getElementById("detail-businessName"),
  detailStatus: document.getElementById("detail-status"),
  detailContactPerson: document.getElementById("detail-contactPerson"),
  detailEmail: document.getElementById("detail-email"),
  detailPhone: document.getElementById("detail-phone"),
  detailClassification: document.getElementById("detail-classification"),
  detailObservations: document.getElementById("detail-observations"),
  detailFollowUpNotes: document.getElementById("detail-followUpNotes"),
  detailNextFollowUpDate: document.getElementById("detail-nextFollowUpDate"),

  // Formulario de Edición
  editProspectForm: document.getElementById("edit-prospect-form"),
  editBusinessName: document.getElementById("edit-businessName"),
  editContactPerson: document.getElementById("edit-contactPerson"),
  editEmail: document.getElementById("edit-email"),
  editPhone: document.getElementById("edit-phone"),
  editStatus: document.getElementById("edit-status"),
  editObservations: document.getElementById("edit-observations"),
  editNextFollowUpDate: document.getElementById("edit-nextFollowUpDate"),

  // Formulario para Añadir Nota
  addNoteForm: document.getElementById("add-note-form"),
  addNoteTextarea: document.getElementById("add-note-textarea"),
  nextFollowupInput: document.getElementById("next-followup-input"),

  // Modal de WhatsApp
  whatsappModal: document.getElementById("whatsapp-modal"),
  whatsappProspectName: document.getElementById("whatsapp-prospect-name"),
  materialsCheckboxContainer: document.getElementById(
    "materials-checkbox-container",
  ),
  whatsappMessageTextarea: document.getElementById("whatsapp-message-textarea"),
  whatsappSendBtn: document.getElementById("whatsapp-send-btn"),
  whatsappCloseBtn: document.getElementById("whatsapp-close-btn"),
};

/**
 * Normaliza un teléfono a dígitos con código de país (52 para México).
 * Devuelve "" cuando no hay un número utilizable, para no dibujar enlaces rotos.
 */
export const normalizePhone = (rawPhone) => {
  if (!rawPhone) return "";
  let digits = String(rawPhone).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `52${digits}`;
  if (digits.length < 10) return "";
  return digits;
};

const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: userTimezone,
  });
};

const formatFollowUpDate = (dateString) => {
  if (!dateString) return "No agendado";
  try {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleDateString("es-MX", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: userTimezone,
    });
  } catch (e) {
    return "Fecha inválida";
  }
};

// Ronda 4: "null", "undefined" y vacío son dato faltante en la UI.
// No se escribe nada en Firestore; solo se decide qué se muestra.
const MISSING_DATA = new Set(["", "null", "undefined", "n/a", "na", "-"]);
export const displayValue = (value, fallback = "") => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return MISSING_DATA.has(text.toLowerCase()) ? fallback : text;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

export const createProspectRowHTML = (prospect) => {
  const statusBadgeClass = getStatusBadgeClass(prospect.status);
  const businessName = escapeHtml(displayValue(prospect.businessName, "Sin nombre"));
  const contactPerson = displayValue(prospect.contactPerson);
  const classification = escapeHtml(displayValue(prospect.classification, "Sin clasificación"));
  const status = escapeHtml(displayValue(prospect.status, "Sin estatus"));
  const phone = normalizePhone(prospect.phone);
  const callName =
    displayValue(prospect.contactPerson) ||
    displayValue(prospect.businessName, "el negocio");
  const callLabel = escapeHtml(`Llamar a ${callName}`);

  const callButton = phone
    ? `<a class="btn btn-success btn-sm call-btn" href="tel:+${phone}" title="${callLabel}" aria-label="${callLabel}"><i data-lucide="phone" class="w-4 h-4 flex-shrink-0"></i><span class="action-label">${callLabel}</span></a>`
    : `<button type="button" class="btn btn-secondary btn-sm call-btn" disabled title="Sin teléfono registrado" aria-label="${callLabel}"><i data-lucide="phone" class="w-4 h-4 flex-shrink-0"></i><span class="action-label">${callLabel}</span></button>`;

  const canMarkSent = prospect.status === "Pendiente de Correo";
  const markSentButton = `<button type="button" class="btn btn-secondary btn-sm mark-as-sent-btn" data-id="${escapeHtml(prospect.id)}" title="Marcar como enviado" ${canMarkSent ? "" : "disabled"}><i data-lucide="send" class="w-4 h-4 flex-shrink-0"></i><span class="action-label">Marcar enviado</span></button>`;

  return `
    <div class="prospect-row">
        <div class="prospect-cell" data-label="Prospecto">
            <p class="font-bold text-gray-900 truncate">${businessName}</p>
            ${contactPerson ? `<p class="text-xs text-gray-500 truncate">${escapeHtml(contactPerson)}</p>` : ""}
        </div>
        <div class="prospect-cell" data-label="Clase">
            <span class="truncate">${classification}</span>
        </div>
        <div class="prospect-cell" data-label="Estatus">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass}">${status}</span>
        </div>
        <div class="prospect-cell" data-label="Seguimiento">
            <div class="flex items-center justify-end md:justify-start">
                <i data-lucide="calendar" class="w-4 h-4 mr-2 flex-shrink-0 ${prospect.nextFollowUpDate ? "text-red-500" : "text-gray-400"}"></i>
                <span class="truncate ${prospect.nextFollowUpDate ? "font-semibold text-gray-800" : "text-gray-500"}">${formatFollowUpDate(prospect.nextFollowUpDate)}</span>
            </div>
        </div>
        <div class="prospect-cell prospect-actions-cell" data-label="Acciones">
            <div class="prospect-actions-grid">
                ${callButton}
                ${markSentButton}
                <button type="button" class="btn btn-secondary btn-sm whatsapp-btn" data-id="${escapeHtml(prospect.id)}" title="Enviar WhatsApp"><i data-lucide="message-circle" class="w-4 h-4 flex-shrink-0"></i><span class="action-label">WhatsApp</span></button>
                <button type="button" class="btn btn-primary btn-sm view-details-btn" data-id="${escapeHtml(prospect.id)}" title="Ver detalles"><i data-lucide="eye" class="w-4 h-4 flex-shrink-0"></i><span class="action-label">Detalles</span></button>
            </div>
        </div>
    </div>
  `;
};

const GRID_PAGE_SIZE = 10;
let gridState = null;
let paginationBound = false;

// Los manejadores de filtros llaman a resetGridPage antes de volver a renderizar.
export const resetGridPage = () => {
  if (gridState) gridState.page = 1;
};

const getPaginationElement = (container) =>
  document.getElementById(
    container.id === "prospeccion-cards-container"
      ? "prospeccion-pagination"
      : "admin-pagination",
  ) || container;

const bindPagination = (paginationEl) => {
  if (!paginationEl || paginationBound) return;
  paginationBound = true;
  paginationEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-action]");
    if (!button || button.disabled || !gridState) return;
    gridState.page += button.dataset.pageAction === "next" ? 1 : -1;
    renderGridPage();
  });
};

const renderGridPage = () => {
  if (!gridState) return;
  const container =
    document.getElementById("admin-prospects-cards-container") ||
    document.getElementById("prospeccion-cards-container");
  const noProspectsDiv =
    document.getElementById("admin-no-prospects") ||
    document.getElementById("prospeccion-no-prospects");
  if (!container || !noProspectsDiv) return;

  const { data, getGroupIcon, isGrouped, view, pageSize } = gridState;
  const allProspects = isGrouped ? Object.values(data).flat() : data;
  const total = allProspects.length;
  const paginationEl = getPaginationElement(container);
  bindPagination(paginationEl);

  if (!total) {
    container.innerHTML = "";
    if (paginationEl) paginationEl.innerHTML = "";
    noProspectsDiv.classList.remove("hidden");
    return;
  }
  noProspectsDiv.classList.add("hidden");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (gridState.page > totalPages) gridState.page = totalPages;
  if (gridState.page < 1) gridState.page = 1;
  const start = (gridState.page - 1) * pageSize;
  const pageProspects = allProspects.slice(start, start + pageSize);

  const renderList = (prospects) => `
      <div class="prospect-list-container">
          <div class="prospect-list-header">
              <div class="prospect-header-cell">Prospecto</div>
              <div class="prospect-header-cell">Clasificación</div>
              <div class="prospect-header-cell">Estatus</div>
              <div class="prospect-header-cell">Seguimiento</div>
              <div class="prospect-header-cell text-right">Acciones</div>
          </div>
          <div class="prospect-list-body">
              ${prospects.map(createProspectRowHTML).join("")}
          </div>
      </div>`;

  if (isGrouped) {
    const groupedPage = groupProspects(pageProspects, view);
    container.innerHTML = Object.entries(groupedPage)
      .filter(([, prospects]) => prospects.length > 0)
      .map(([groupName, prospects]) => {
        const safeGroupId = groupName.replace(/[\s()\/]/g, "-");
        return `
          <section class="mb-4 md:mb-8">
            <div class="prospect-section-header-toggle flex justify-between items-center cursor-pointer p-2 mb-2" data-target="#group-${safeGroupId}">
              <h2 class="flex items-center text-lg font-playfair font-bold text-black md:text-xl">
                <i data-lucide="${escapeHtml(getGroupIcon(groupName))}" class="w-5 h-5 mr-3 text-red-600"></i>
                ${escapeHtml(groupName)} (${prospects.length})
              </h2>
              <i data-lucide="chevron-down" class="toggle-icon transition-transform"></i>
            </div>
            <div id="group-${safeGroupId}">${renderList(prospects)}</div>
          </section>`;
      })
      .join("");
  } else {
    container.innerHTML = renderList(pageProspects);
  }

  if (paginationEl) {
    const buttons = totalPages > 1
      ? `<button type="button" class="btn btn-secondary btn-sm" data-page-action="prev" ${gridState.page === 1 ? "disabled" : ""}>Anterior</button>`
        + `<button type="button" class="btn btn-secondary btn-sm" data-page-action="next" ${gridState.page === totalPages ? "disabled" : ""}>Siguiente</button>`
      : "";
    const status = `<span class="page-status">Página ${gridState.page} de ${totalPages} · ${total} prospectos</span>`;
    paginationEl.innerHTML = `<nav class="grid-pagination" aria-label="Paginación de prospectos">${buttons}${status}</nav>`;
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
  document.dispatchEvent(new CustomEvent("pf:grid-pagechange", {
    detail: { page: gridState.page, totalPages },
  }));
};

export const renderAdminGrid = (data, getGroupIcon, isGrouped, options = {}) => {
  gridState = {
    data,
    getGroupIcon,
    isGrouped,
    view: options.view || "management",
    pageSize: options.pageSize || GRID_PAGE_SIZE,
    page: options.resetPage ? 1 : gridState?.page || 1,
  };
  renderGridPage();
};

/**
 * Dibuja un estado de espera/error en lugar del estado vacío real.
 * Se usa mientras no llega el primer snapshot del servidor y cuando el
 * listener se cae, para que "0 prospectos" nunca sea un estado fingido.
 * @param {string} message
 * @param {{isError?: boolean}} [options]
 */
export const renderProspectsStatus = (message, { isError = false } = {}) => {
  const listContainer =
    document.getElementById("admin-prospects-cards-container") ||
    document.getElementById("prospeccion-cards-container");
  const noProspectsDiv =
    document.getElementById("admin-no-prospects") ||
    document.getElementById("prospeccion-no-prospects");
  const statsContainer = document.getElementById("stats-cards-container");

  const statusHTML = `
    <div class="${isError ? "bg-red-50 border-red-200" : "bg-white border-gray-200"} rounded-lg border p-10 text-center shadow-sm">
      <div class="flex items-center justify-center gap-3 ${isError ? "text-red-600" : "text-gray-500"}">
        ${
          isError
            ? '<i data-lucide="wifi-off" class="w-6 h-6"></i>'
            : '<span class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-600"></span>'
        }
        <p class="text-lg font-semibold">${message}</p>
      </div>
    </div>
  `;

  if (listContainer) {
    listContainer.innerHTML = statusHTML;
    noProspectsDiv?.classList.add("hidden");
  }
  if (statsContainer) {
    statsContainer.innerHTML = `<div class="sm:col-span-2 lg:col-span-4">${statusHTML}</div>`;
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
};

export const showProspectDetailsModal = (prospect) => {
  if (!elements.detailModal) return;

  elements.detailBusinessName.textContent = displayValue(prospect.businessName, "Sin nombre");
  elements.detailStatus.textContent = displayValue(prospect.status, "Sin estatus");
  elements.detailStatus.className = `text-xs font-semibold px-2.5 py-1 rounded-full inline-block ${getStatusBadgeClass(prospect.status)}`;
  elements.detailContactPerson.textContent = displayValue(prospect.contactPerson, "Sin contacto");
  elements.detailEmail.textContent = displayValue(prospect.email, "Sin correo");
  elements.detailPhone.textContent = displayValue(prospect.phone, "Sin teléfono");
  const phone = normalizePhone(prospect.phone);
  if (elements.detailCallBtn) {
    const callLabel = `Llamar a ${displayValue(prospect.contactPerson) || displayValue(prospect.businessName, "el negocio")}`;
    const detailCallLabel = document.getElementById("detail-call-label");
    if (detailCallLabel) detailCallLabel.textContent = callLabel;
    if (typeof elements.detailCallBtn.setAttribute === "function") {
      elements.detailCallBtn.setAttribute("aria-label", callLabel);
      elements.detailCallBtn.title = callLabel;
    }
    if (phone) {
      elements.detailCallBtn.href = `tel:+${phone}`;
      elements.detailCallBtn.classList.remove("hidden");
    } else {
      if (typeof elements.detailCallBtn.removeAttribute === "function") {
        elements.detailCallBtn.removeAttribute("href");
      } else {
        elements.detailCallBtn.href = "";
      }
      elements.detailCallBtn.classList.add("hidden");
    }
  }
  elements.detailClassification.textContent = prospect.classification;
  elements.detailObservations.textContent =
    prospect.observations || "Sin observaciones.";
  elements.detailNextFollowUpDate.textContent = formatFollowUpDate(
    prospect.nextFollowUpDate,
  );

  elements.detailFollowUpNotes.innerHTML = "";
  if (prospect.followUpNotes && prospect.followUpNotes.length > 0) {
    const sortedNotes = [...prospect.followUpNotes].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    sortedNotes.forEach(addNewNoteToView);
  } else {
    elements.detailFollowUpNotes.innerHTML = `<p class="text-sm text-gray-500 italic">No hay notas de seguimiento.</p>`;
  }

  switchToDisplayView();
  elements.detailModal.classList.add("is-open");
};

export const closeDetailModal = () => {
  if (elements.detailModal) elements.detailModal.classList.remove("is-open");
};

export const switchToEditView = (prospect) => {
  if (elements.detailDisplayView && elements.detailEditView) {
    elements.editBusinessName.value = displayValue(prospect.businessName);
    elements.editContactPerson.value = displayValue(prospect.contactPerson);
    elements.editEmail.value = displayValue(prospect.email);
    elements.editPhone.value = displayValue(prospect.phone);
    elements.editClassificationSelect.value = prospect.classification;
    elements.editStatus.value = prospect.status;
    elements.editObservations.value = prospect.observations;
    // CAMBIO: Usar flatpickr para setear la fecha
    const editPicker =
      document.getElementById("edit-nextFollowUpDate")?._flatpickr;
    if (editPicker) {
      editPicker.setDate(prospect.nextFollowUpDate || "");
    } else {
      elements.editNextFollowUpDate.value = prospect.nextFollowUpDate || "";
    }
    elements.detailDisplayView.classList.add("hidden");
    elements.detailEditView.classList.remove("hidden");
  }
};

export const switchToDisplayView = () => {
  if (elements.detailDisplayView && elements.detailEditView) {
    elements.detailDisplayView.classList.remove("hidden");
    elements.detailEditView.classList.add("hidden");
    elements.editProspectForm?.reset();
    elements.addNoteForm?.reset();
  }
};

export const populateClassificationSelects = (classifications) => {
  const selects = [
    elements.classificationSelect,
    elements.editClassificationSelect,
  ];
  selects.forEach((select) => {
    if (select) {
      select.innerHTML = '<option value="">Selecciona clasificación</option>';
      classifications.forEach((c) => {
        const option = document.createElement("option");
        option.value = c;
        option.textContent = c;
        select.appendChild(option);
      });
    }
  });
};

export const addNewNoteToView = (note) => {
  const noteElement = document.createElement("div");
  noteElement.className = "note-item";
  noteElement.innerHTML = `
    <p class="text-sm text-gray-800">${note.note}</p>
    <p class="text-xs text-gray-500 mt-1 text-right">
      <strong>${note.user}</strong> - ${formatDate(note.date)}
    </p>`;

  const noNotesMessage = elements.detailFollowUpNotes.querySelector("p");
  if (noNotesMessage && noNotesMessage.textContent.includes("No hay notas")) {
    elements.detailFollowUpNotes.innerHTML = "";
  }
  elements.detailFollowUpNotes.prepend(noteElement);
};

// El nombre del modal nunca queda vacío: si no hay persona de contacto se
// muestra el negocio (caso Estudio Arki3d) y, como último recurso, "prospecto".
export const whatsappGreetingName = (prospect = {}) =>
  displayValue(prospect.contactPerson) ||
  displayValue(prospect.businessName) ||
  "prospecto";

export const openWhatsappModal = (prospect) => {
  if (elements.whatsappProspectName) {
    elements.whatsappProspectName.textContent = whatsappGreetingName(prospect);
  }
  elements.whatsappSendBtn.dataset.prospectId = prospect.id;
  elements.whatsappSendBtn.dataset.prospectPhone = prospect.phone;
  elements.whatsappModal.classList.add("is-open");
};

export const closeWhatsappModal = () => {
  elements.whatsappModal.classList.remove("is-open");
};

export const populateMaterialsCheckboxes = (materials) => {
  elements.materialsCheckboxContainer.innerHTML = "";
  materials.forEach((material) => {
    const checkboxId = `material-${material.name.replace(/\s+/g, "-")}`;
    const label = document.createElement("label");
    label.className = "material-checkbox-label";
    label.setAttribute("for", checkboxId);
    label.innerHTML = `
        <input type="checkbox" id="${checkboxId}" value="${material.url}" data-name="${material.name}" class="material-checkbox">
        <span class="text-sm font-medium text-gray-800">${material.name}</span>`;
    elements.materialsCheckboxContainer.appendChild(label);
  });
};

export const showSnackbar = (message, type = "info") => {
  const snackbar = document.createElement("div");
  snackbar.className = `snackbar ${type}`;
  snackbar.innerHTML = `<i data-lucide="${type === "error" ? "alert-triangle" : "check-circle"}"></i><span>${message}</span>`;
  document.body.appendChild(snackbar);
  if (typeof lucide !== "undefined") lucide.createIcons();

  setTimeout(() => {
    snackbar.classList.add("show");
  }, 10);

  setTimeout(() => {
    snackbar.classList.remove("show");
    snackbar.addEventListener("transitionend", () => snackbar.remove());
  }, 3000);
};

export const showConfirmationModal = (
  title,
  message,
  actionText,
  buttonClass = "btn-primary",
) => {
  const confirmModal = document.getElementById("confirm-modal");
  const titleEl = document.getElementById("confirm-modal-title");
  const messageEl = document.getElementById("confirm-modal-message");
  const actionBtn = document.getElementById("confirm-action-btn");
  const cancelBtn = document.getElementById("confirm-cancel-btn");

  titleEl.textContent = title;
  messageEl.textContent = message;
  actionBtn.textContent = actionText;

  actionBtn.className = `btn ${buttonClass}`;

  confirmModal.classList.add("is-open");

  return new Promise((resolve) => {
    const close = () => {
      confirmModal.classList.remove("is-open");
      actionBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    actionBtn.onclick = () => {
      close();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      close();
      resolve(false);
    };
  });
};

export const openAddProspectModal = () => {
  const modal = document.getElementById("add-prospect-modal");
  if (modal) modal.classList.add("is-open");
};

export const closeAddProspectModal = () => {
  const modal = document.getElementById("add-prospect-modal");
  if (modal) modal.classList.remove("is-open");
};

export const initFollowUpNotePicker = () => {
  const input = elements.nextFollowupInput;
  if (!input) return;

  if (input._flatpickr) {
    input._flatpickr.destroy();
  }

  flatpickr(input, {
    dateFormat: "Y-m-d",
    minDate: "today",
    altInput: true,
    altFormat: "F j, Y",
    appendTo: document.body,
    static: true,
    // NUEVO: Deshabilitar fines de semana
    disable: [
      function (date) {
        // return true para deshabilitar
        return date.getDay() === 0 || date.getDay() === 6;
      },
    ],
    onChange: (selectedDates, dateStr) => {
      const event = new CustomEvent("followup:dateSelected", {
        detail: { dateStr },
      });
      document.dispatchEvent(event);
    },
  });
};

// NUEVO: Función para inicializar el picker en el formulario de "Editar"
export const initEditDatePicker = () => {
  const input = document.getElementById("edit-nextFollowUpDate");
  if (!input) return;

  // Nos aseguramos de que sea tipo texto para que flatpickr funcione bien
  input.type = "text";
  input.placeholder = "Selecciona fecha...";

  if (input._flatpickr) {
    input._flatpickr.destroy();
  }

  flatpickr(input, {
    dateFormat: "Y-m-d",
    minDate: "today",
    altInput: true,
    altFormat: "F j, Y",
    appendTo: document.body, // Evita problemas de z-index en el modal
    static: true,
    // NUEVO: Deshabilitar fines de semana
    disable: [
      function (date) {
        return date.getDay() === 0 || date.getDay() === 6;
      },
    ],
  });
};

// --- Helper Functions para el Planificador ---

/**
 * Obtiene el lunes de la semana de una fecha dada.
 * @param {Date} d - La fecha de referencia (ej. "hoy").
 * @returns {Date} La fecha del lunes de esa semana a las 00:00.
 */
const getWeekMonday = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 (Dom) - 6 (Sab)
  // Si es Domingo (0), retrocede 6 días. Si es Martes (2), retrocede 1 día (1-2 = -1).
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

/**
 * Compara dos fechas (Date objects) ignorando la hora.
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// --- Fin Helper Functions ---

// --- Dashboard helpers (Charts & Stats) ---
let _statusChart = null;
let _timeChart = null;

// Chart.js dibuja en canvas: sus colores no se pueden cambiar desde CSS.
const applyChartTheme = () => {
  if (typeof Chart === "undefined") return;
  const dark = document.documentElement.dataset.theme === "dark";
  Chart.defaults.color = dark ? "#e5e7eb" : "#6b7280";
  Chart.defaults.borderColor = dark ? "#3f4551" : "#e5e7eb";
  _statusChart?.update();
  _timeChart?.update();
};
if (typeof window !== "undefined") {
  window.addEventListener("themechange", applyChartTheme);
  applyChartTheme();
}

export const renderStatsCards = (stats) => {
  const container = document.getElementById("stats-cards-container");
  if (!container) return;
  const { totalProspects = 0, newThisMonth = 0, convertedProspects = 0, conversionRate = 0 } = stats || {};
  container.innerHTML = `
    <div class="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Total</p>
      <p class="mt-1 text-3xl font-bold text-gray-900">${totalProspects}</p>
    </div>
    <div class="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Nuevos (Mes)</p>
      <p class="mt-1 text-3xl font-bold text-gray-900">${newThisMonth}</p>
    </div>
    <div class="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Convertidos</p>
      <p class="mt-1 text-3xl font-bold text-gray-900">${convertedProspects}</p>
    </div>
    <div class="rounded-lg bg-white border border-gray-200 p-4 shadow-sm">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Tasa de Conversión</p>
      <p class="mt-1 text-3xl font-bold text-gray-900">${conversionRate}%</p>
    </div>
  `;
};

export const renderProspectsByStatusChart = (prospects = []) => {
  const ctx = document.getElementById("prospectsByStatusChart");
  if (!ctx || typeof Chart === "undefined") return;

  const totals = new Map();
  for (const p of prospects) {
    const status = p.status || 'Sin estatus';
    totals.set(status, (totals.get(status) || 0) + 1);
  }
  const labels = [...Object.keys(STATUS_META), ...[...totals.keys()].filter(s => !STATUS_META[s])]
    .filter(status => totals.has(status));
  const colors = labels.map(status => STATUS_META[status]?.color || '#6b7280');
  const counts = labels.map(status => totals.get(status));

  if (_statusChart) {
    _statusChart.data.labels = labels;
    _statusChart.data.datasets[0].data = counts;
    _statusChart.data.datasets[0].backgroundColor = colors;
    _statusChart.update();
    return;
  }
  _statusChart = new Chart(ctx, {
    plugins: [{
      id: 'statusCounts',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        chart.getDatasetMeta(0).data.forEach((arc, index) => {
          if (!chart.getDataVisibility(index)) return;
          const { x, y } = arc.tooltipPosition();
          const value = String(chart.data.datasets[0].data[index]);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#1f2937';
          ctx.strokeText(value, x, y);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(value, x, y);
        });
        ctx.restore();
      },
    }],
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: "Prospectos",
          data: counts,
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
      },
      maintainAspectRatio: false,
    },
  });
};

export const renderProspectsOverTimeChart = (prospects = []) => {
  const ctx = document.getElementById("prospectsOverTimeChart");
  if (!ctx || typeof Chart === "undefined") return;

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("es-MX", { month: "short" }) + " " + String(d.getFullYear()).slice(-2) });
  }

  const counts = months.map(({ key }) => {
    return prospects.filter((p) => {
      const raw = p.creationDate || p.createdAt || p.created_at || null;
      if (!raw) return false;
      const d = new Date(raw);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return k === key;
    }).length;
  });

  if (_timeChart) {
    _timeChart.data.labels = months.map((m) => m.label);
    _timeChart.data.datasets[0].data = counts;
    _timeChart.update();
    return;
  }

  _timeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: "Nuevos Prospectos",
          data: counts,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
      maintainAspectRatio: false,
    },
  });
};

export const renderWeeklyPlanner = (prospects) => {
  const container = document.getElementById("weekly-planner-container");
  if (!container) return;

  // --- 1. Configuración de Fechas (Lunes a Viernes) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = getWeekMonday(today);
  const weekDates = []; // [Lunes, Martes, Miércoles, Jueves, Viernes]
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDates.push(day);
  }

  // --- 2. Distribución de Prospectos ---
  const plannerData = {
    overdue: [],
    days: [[], [], [], [], []], // 5 arrays para Lu, Ma, Mi, Ju, Vi
  };

  const mondayUtc = Date.UTC(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate(),
  );

  prospects.forEach((p) => {
    if (!p.nextFollowUpDate) return;

    // Convertir fecha de seguimiento (YYYY-MM-DD) a UTC para comparar
    const dateParts = p.nextFollowUpDate.split("-");
    const followUpDate = new Date(
      Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]),
    );
    const followUpTime = followUpDate.getTime();

    // A. Atrasados (antes del lunes de esta semana)
    if (followUpTime < mondayUtc) {
      plannerData.overdue.push(p);
      return;
    }

    // B. Durante la semana (Lunes a Viernes)
    for (let i = 0; i < 5; i++) {
      const weekDayTime = Date.UTC(
        weekDates[i].getFullYear(),
        weekDates[i].getMonth(),
        weekDates[i].getDate(),
      );
      if (followUpTime === weekDayTime) {
        plannerData.days[i].push(p);
        return;
      }
    }
    // C. Próximos (después del viernes) o fines de semana
    // (Estos prospectos no se mostrarán en el planner de esta semana)
  });

  // --- 3. Renderizado del HTML ---

  const createProspectCard = (prospect) => `
        <div class="planner-prospect-card view-details-btn" data-id="${prospect.id}">
            <h4 class="font-bold text-sm text-gray-800 truncate">${escapeHtml(displayValue(prospect.businessName, "Sin nombre"))}</h4>
            ${displayValue(prospect.contactPerson) ? `<p class="text-xs text-gray-500 truncate">${escapeHtml(displayValue(prospect.contactPerson))}</p>` : ""}
        </div>
    `;

  // Función interna para crear columnas (simplificada de la versión anterior)
  const createDayColumn = (
    title,
    date,
    prospects,
    columnClass = "",
    isExpanded = false,
  ) => {
    const dateFormatted = date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    });
    const hasTasks = prospects.length > 0;
    const safeTitle = title.replace(/[\s()\/]/g, "-");
    const emptyClass = !hasTasks ? "is-empty" : "";
    const tasksClass = hasTasks ? "has-tasks" : "";
    const expandedListClass = isExpanded ? "is-expanded" : "";
    const rotatedIconClass = isExpanded ? "is-rotated" : "";

    return `
            <div class="planner-day-column ${columnClass} ${emptyClass} ${tasksClass}">
                <div class="planner-day-header" ${hasTasks ? `data-target="#planner-list-${safeTitle}"` : ""}>
                    <div>
                        <h3 class="font-bold text-gray-800">${title.charAt(0).toUpperCase() + title.slice(1)}</h3>
                        <p class="text-xs text-gray-500">${dateFormatted}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        ${hasTasks ? `<span class="planner-task-count">${prospects.length}</span>` : ""}
                        ${hasTasks ? `<i data-lucide="chevron-down" class="planner-toggle-icon ${rotatedIconClass} w-5 h-5"></i>` : ""}
                    </div>
                </div>
                <div class="planner-prospects-list is-collapsible ${expandedListClass}" id="planner-list-${safeTitle}">
                    ${hasTasks ? prospects.map(createProspectCard).join("") : ""}
                </div>
            </div>
        `;
  };

  let html = '<div class="weekly-planner">';

  // Renderizar Atrasados (siempre primero y expandido)
  if (plannerData.overdue.length > 0) {
    const isExpanded = true;
    html += `
            <div class="planner-day-column is-overdue has-tasks">
                <div class="planner-day-header" data-target="#planner-list-atrasados">
                    <div>
                        <h3 class="font-bold text-red-700">Atrasados</h3>
                        <p class="text-xs text-red-500">Requieren atención</p>
                    </div>
                     <div class="flex items-center gap-2">
                        <span class="planner-task-count">${plannerData.overdue.length}</span>
                        <i data-lucide="chevron-down" class="planner-toggle-icon ${isExpanded ? "is-rotated" : ""} w-5 h-5"></i>
                    </div>
                </div>
                <div class="planner-prospects-list is-collapsible ${isExpanded ? "is-expanded" : ""}" id="planner-list-atrasados">
                    ${plannerData.overdue.map(createProspectCard).join("")}
                </div>
            </div>
        `;
  }

  // Renderizar Lunes a Viernes
  weekDates.forEach((date, i) => {
    const dayName = date.toLocaleDateString("es-ES", { weekday: "long" });
    const dayProspects = plannerData.days[i];
    const isToday = isSameDay(date, today);
    const columnClass = isToday ? "is-today" : "";
    // Expandir "Hoy", o "Lunes" si no hay atrasados
    const isExpanded =
      isToday || (i === 0 && plannerData.overdue.length === 0);

    html += createDayColumn(
      dayName,
      date,
      dayProspects,
      columnClass,
      isExpanded,
    );
  });

  html += "</div>";
  container.innerHTML = html;

  if (typeof lucide !== "undefined") lucide.createIcons();
};

