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

const getStatusBadgeClass = (status) => {
  const statusClasses = {
    "Pendiente de Correo": "bg-yellow-100 text-yellow-800",
    "En Prospección": "bg-blue-100 text-blue-800",
    Interesado: "bg-green-100 text-green-800",
    Rechazado: "bg-red-100 text-red-800",
    "Convertido a cliente": "bg-purple-100 text-purple-800",
    "Ya es nuestro cliente": "bg-indigo-100 text-indigo-800",
    "Seguimiento agendado": "bg-cyan-100 text-cyan-800",
    "No contesta": "bg-gray-100 text-gray-800",
  };
  return statusClasses[status] || "bg-gray-100 text-gray-800";
};

export const createProspectRowHTML = (prospect) => {
  const statusBadgeClass = getStatusBadgeClass(prospect.status);
  return `
    <div class="prospect-row">
        <div class="prospect-cell" data-label="Prospecto">
            <p class="font-bold text-gray-900 truncate">${prospect.businessName}</p>
            <p class="text-xs text-gray-500 truncate">${prospect.contactPerson}</p>
        </div>
        <div class="prospect-cell" data-label="Clasificación">
            <span class="truncate">${prospect.classification}</span>
        </div>
        <div class="prospect-cell" data-label="Estatus">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeClass}">${prospect.status}</span>
        </div>
        <div class="prospect-cell" data-label="Seguimiento">
            <div class="flex items-center justify-end md:justify-start">
                <i data-lucide="calendar" class="w-4 h-4 mr-2 flex-shrink-0 ${prospect.nextFollowUpDate ? "text-red-500" : "text-gray-400"}"></i>
                <span class="truncate ${prospect.nextFollowUpDate ? "font-semibold text-gray-800" : "text-gray-500"}">${formatFollowUpDate(prospect.nextFollowUpDate)}</span>
            </div>
        </div>
        <div class="prospect-cell prospect-actions-cell">
            ${prospect.status === "Pendiente de Correo" ? `<button class="btn btn-secondary btn-sm mark-as-sent-btn" data-id="${prospect.id}" title="Marcar Enviado"><i data-lucide="send" class="w-4 h-4"></i></button>` : ""}
            <button class="btn btn-secondary btn-sm whatsapp-btn" data-id="${prospect.id}" title="Enviar WhatsApp"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
            <button class="btn btn-primary btn-sm view-details-btn" data-id="${prospect.id}" title="Ver Detalles"><i data-lucide="eye" class="w-4 h-4"></i></button>
        </div>
    </div>
  `;
};

export const renderAdminGrid = (data, getGroupIcon, isGrouped) => {
  const container =
    document.getElementById("admin-prospects-cards-container") ||
    document.getElementById("prospeccion-cards-container");
  const noProspectsDiv =
    document.getElementById("admin-no-prospects") ||
    document.getElementById("prospeccion-no-prospects");

  if (!container || !noProspectsDiv) return;
  container.innerHTML = "";

  const renderList = (prospects) => {
    if (prospects.length === 0) return "";
    return `
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
        </div>
      `;
  };

  if (isGrouped) {
    const hasProspects = Object.values(data).some((group) => group.length > 0);
    if (!hasProspects) {
      noProspectsDiv.classList.remove("hidden");
      return;
    }

    noProspectsDiv.classList.add("hidden");

    for (const groupName in data) {
      if (data[groupName].length > 0) {
        const iconName = getGroupIcon(groupName);
        const section = document.createElement("section");
        section.className = "mb-8";
        // ✨ CORRECCIÓN: Sanitizar el nombre del grupo para crear un ID de CSS válido
        const safeGroupId = groupName.replace(/[\s()\/]/g, "-");

        section.innerHTML = `
          <div class="prospect-section-header-toggle flex justify-between items-center cursor-pointer p-2 mb-2" data-target="#group-${safeGroupId}">
            <h2 class="flex items-center text-xl font-playfair font-bold text-black">
              <i data-lucide="${iconName}" class="w-5 h-5 mr-3 text-red-600"></i>
              ${groupName} (${data[groupName].length})
            </h2>
            <i data-lucide="chevron-down" class="toggle-icon transition-transform"></i>
          </div>
          <div id="group-${safeGroupId}">
            ${renderList(data[groupName])}
          </div>`;
        container.appendChild(section);
      }
    }
  } else {
    if (data.length === 0) {
      noProspectsDiv.classList.remove("hidden");
      return;
    }
    noProspectsDiv.classList.add("hidden");
    container.innerHTML = renderList(data);
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
};

export const showProspectDetailsModal = (prospect) => {
  if (!elements.detailModal) return;

  elements.detailBusinessName.textContent = prospect.businessName;
  elements.detailStatus.textContent = prospect.status;
  elements.detailContactPerson.textContent = prospect.contactPerson;
  elements.detailEmail.textContent = prospect.email;
  elements.detailPhone.textContent = prospect.phone;
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
    elements.editBusinessName.value = prospect.businessName;
    elements.editContactPerson.value = prospect.contactPerson;
    elements.editEmail.value = prospect.email;
    elements.editPhone.value = prospect.phone;
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

export const openWhatsappModal = (prospect) => {
  elements.whatsappProspectName.textContent =
    prospect.contactPerson || prospect.businessName;
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

export const generateWhatsappMessage = (
  template,
  contactName,
  userName,
  materials,
) => {
  const materialsList = materials
    .map((m) => `• ${m.name}: ${m.url}`)
    .join("\n");
  const message = template
    .replace("{contactName}", contactName)
    .replace("{materialsList}", materialsList)
    .replace("{userName}", userName);
  elements.whatsappMessageTextarea.value = message;
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

  const labels = [
    "Pendiente de Correo",
    "En Prospección",
    "Interesado",
    "Seguimiento agendado",
    "No contesta",
    "Rechazado",
    "Convertido a cliente",
    "Ya es nuestro cliente",
  ];
  const colors = [
    "#f59e0b", // amber
    "#3b82f6", // blue
    "#10b981", // green
    "#06b6d4", // cyan
    "#6b7280", // gray
    "#ef4444", // red
    "#8b5cf6", // violet
    "#6366f1", // indigo
  ];
  const counts = labels.map((label) => prospects.filter((p) => (p.status || "").trim() === label).length);

  if (_statusChart) {
    _statusChart.data.labels = labels;
    _statusChart.data.datasets[0].data = counts;
    _statusChart.update();
    return;
  }
  _statusChart = new Chart(ctx, {
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
            <h4 class="font-bold text-sm text-gray-800 truncate">${prospect.businessName}</h4>
            <p class="text-xs text-gray-500 truncate">${prospect.contactPerson}</p>
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

