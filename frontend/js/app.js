// app.js
// Frontend logic for the University Research Opportunity Portal.
// Fetches opportunities from the API and renders them as Bootstrap cards.
// Handles: list view, details modal, add/edit form, close, delete,
// loading/empty states, client-side validation, and alerts.

// --- Element references -------------------------------------------------

const listContainer = document.getElementById("opportunity-list");
const alertContainer = document.getElementById("alert-container");

// The details modal is created once and reused for every "View Details" click.
const detailsModalEl = document.getElementById("detailsModal");
const detailsModal = new bootstrap.Modal(detailsModalEl);
const detailsModalBody = document.getElementById("detailsModalBody");
const detailsModalTitle = document.getElementById("detailsModalLabel");

// The add/edit form modal, also created once and reused.
const formModalEl = document.getElementById("formModal");
const formModal = new bootstrap.Modal(formModalEl);
const form = document.getElementById("opportunity-form");
const formModalTitle = document.getElementById("formModalLabel");

// The form fields we read from / write to. Keyed by API field name.
const formFields = {
  id: document.getElementById("field-id"),
  title: document.getElementById("field-title"),
  research_area: document.getElementById("field-research_area"),
  description: document.getElementById("field-description"),
  faculty_name: document.getElementById("field-faculty_name"),
  department: document.getElementById("field-department"),
  required_skills: document.getElementById("field-required_skills"),
  positions: document.getElementById("field-positions"),
  deadline: document.getElementById("field-deadline"),
  status: document.getElementById("field-status"),
};

// The "+ Add New Opportunity" button in the navbar.
const addNewBtn = document.getElementById("add-new-btn");

// --- Small utilities ----------------------------------------------------

// escapeHtml
// Prevents HTML injection when inserting API data into the page.
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// formatDate
// Turns a date value from the API into a plain YYYY-MM-DD string.
// Uses local date parts (not toISOString, which converts to UTC and can
// shift the day by one in timezones ahead of/behind UTC).
function formatDate(value) {
  if (!value) return "";
  // If the value already starts with a YYYY-MM-DD date, keep it as-is.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// showAlert(message, type)
// Reusable Bootstrap alert that appears top-right and auto-dismisses.
// type is a Bootstrap contextual class: "success" or "danger".
function showAlert(message, type = "success") {
  const wrapper = document.createElement("div");
  wrapper.className = `alert alert-${type} alert-dismissible fade show shadow-sm`;
  wrapper.setAttribute("role", "alert");
  wrapper.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(wrapper);

  // Auto-dismiss after 4 seconds using Bootstrap's Alert instance.
  setTimeout(() => {
    const instance = bootstrap.Alert.getOrCreateInstance(wrapper);
    instance.close();
  }, 4000);
}

// Expose showAlert globally so later phases can reuse it.
window.showAlert = showAlert;

// --- Rendering ----------------------------------------------------------

// Returns the Bootstrap badge class for a status value.
function statusBadgeClass(status) {
  // Green for Open, red for Closed.
  return status === "Open" ? "bg-success" : "bg-danger";
}

// renderLoading
// Shows a centered spinner while data is being fetched.
function renderLoading() {
  listContainer.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading opportunities...</p>
    </div>
  `;
}

// renderEmpty
// Friendly message shown when there are no opportunities.
function renderEmpty() {
  listContainer.innerHTML = `
    <div class="col-12">
      <div class="alert alert-info text-center" role="alert">
        No opportunities found.
      </div>
    </div>
  `;
}

// cardTemplate
// Builds the HTML for a single opportunity card.
function cardTemplate(item) {
  return `
    <div class="col-sm-6 col-lg-4">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">${escapeHtml(item.title)}</h5>
            <span class="badge ${statusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
          </div>
          <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(item.research_area)}</h6>
          <ul class="list-unstyled small mb-3">
            <li><strong>Faculty:</strong> ${escapeHtml(item.faculty_name)}</li>
            <li><strong>Department:</strong> ${escapeHtml(item.department)}</li>
            <li><strong>Positions:</strong> ${escapeHtml(item.positions)}</li>
            <li><strong>Deadline:</strong> ${formatDate(item.deadline)}</li>
          </ul>

          <!-- Action buttons. mt-auto pushes them to the bottom of the card. -->
          <div class="mt-auto d-flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              data-action="view"
              data-id="${escapeHtml(item.id)}"
            >
              View Details
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              data-action="edit"
              data-id="${escapeHtml(item.id)}"
            >
              Edit
            </button>
            ${
              item.status === "Open"
                ? `<button
                     type="button"
                     class="btn btn-outline-warning btn-sm"
                     data-action="close"
                     data-id="${escapeHtml(item.id)}"
                   >
                     Close Opportunity
                   </button>`
                : ""
            }
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              data-action="delete"
              data-id="${escapeHtml(item.id)}"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// renderList
// Renders an array of opportunities as cards (or the empty state).
function renderList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    renderEmpty();
    return;
  }
  listContainer.innerHTML = items.map(cardTemplate).join("");
}

// --- Details modal ------------------------------------------------------

// Builds a definition list showing every field of an opportunity.
function detailsTemplate(item) {
  const rows = [
    ["ID", item.id],
    ["Title", item.title],
    ["Description", item.description],
    ["Research Area", item.research_area],
    ["Faculty", item.faculty_name],
    ["Department", item.department],
    ["Required Skills", item.required_skills],
    ["Positions", item.positions],
    ["Deadline", formatDate(item.deadline)],
    ["Status", item.status],
    ["Created At", item.created_at],
    ["Updated At", item.updated_at],
  ];

  return `
    <dl class="row mb-0">
      ${rows
        .map(
          ([label, value]) => `
        <dt class="col-sm-4">${escapeHtml(label)}</dt>
        <dd class="col-sm-8">${escapeHtml(value)}</dd>
      `
        )
        .join("")}
    </dl>
  `;
}

// openDetails
// Fetches a single opportunity by id and shows it in the modal.
async function openDetails(id) {
  try {
    detailsModalTitle.textContent = "Opportunity Details";
    detailsModalBody.innerHTML = `
      <div class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;
    detailsModal.show();

    const item = await window.api.getOne(id);
    detailsModalTitle.textContent = item.title;
    detailsModalBody.innerHTML = detailsTemplate(item);
  } catch (error) {
    detailsModal.hide();
    showAlert(error.message, "danger");
  }
}

// --- Data loading -------------------------------------------------------

// loadOpportunities
// Fetches all opportunities and renders them, with loading + error handling.
async function loadOpportunities() {
  renderLoading();
  try {
    const items = await window.api.getAll();
    renderList(items);
  } catch (error) {
    renderEmpty();
    showAlert(`Could not load opportunities. ${error.message}`, "danger");
  }
}

// --- Add / Edit form ----------------------------------------------------

// String fields that are required and must be non-empty after trimming.
const REQUIRED_STRING_FIELDS = [
  "title",
  "research_area",
  "description",
  "faculty_name",
  "department",
  "required_skills",
];

// clearValidation
// Removes the Bootstrap "is-invalid" markers from every field so the form
// starts clean each time it is opened.
function clearValidation() {
  Object.values(formFields).forEach((el) => {
    if (el) el.classList.remove("is-invalid");
  });
}

// resetForm
// Clears all field values and validation state.
function resetForm() {
  form.reset();
  formFields.id.value = "";
  clearValidation();
}

// markInvalid
// Adds the "is-invalid" class so Bootstrap shows the field's invalid-feedback.
function markInvalid(fieldName) {
  const el = formFields[fieldName];
  if (el) el.classList.add("is-invalid");
}

// validateForm
// Client-side validation mirroring the server rules. Returns true if valid.
// Marks each failing field so its inline invalid-feedback appears.
function validateForm(values) {
  clearValidation();
  let valid = true;

  // Required non-empty strings.
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!values[field] || values[field].trim().length === 0) {
      markInvalid(field);
      valid = false;
    }
  }

  // positions: non-negative integer.
  const positionsNum = Number(values.positions);
  if (
    values.positions === "" ||
    !Number.isInteger(positionsNum) ||
    positionsNum < 0
  ) {
    markInvalid("positions");
    valid = false;
  }

  // deadline: a valid date (the date input already constrains format).
  if (!values.deadline || Number.isNaN(new Date(values.deadline).getTime())) {
    markInvalid("deadline");
    valid = false;
  }

  // status: must be Open or Closed.
  if (values.status !== "Open" && values.status !== "Closed") {
    markInvalid("status");
    valid = false;
  }

  return valid;
}

// readForm
// Collects the current field values into a plain object.
function readForm() {
  return {
    id: formFields.id.value,
    title: formFields.title.value,
    research_area: formFields.research_area.value,
    description: formFields.description.value,
    faculty_name: formFields.faculty_name.value,
    department: formFields.department.value,
    required_skills: formFields.required_skills.value,
    positions: formFields.positions.value,
    deadline: formFields.deadline.value,
    status: formFields.status.value,
  };
}

// openCreateForm
// Prepares the modal for creating a brand new opportunity.
function openCreateForm() {
  resetForm();
  formModalTitle.textContent = "Add New Opportunity";
  formFields.status.value = "Open";
  formModal.show();
}

// openEditForm
// Fetches the opportunity by id and pre-fills the form for editing.
async function openEditForm(id) {
  try {
    const item = await window.api.getOne(id);
    resetForm();
    formModalTitle.textContent = "Edit Opportunity";

    formFields.id.value = item.id;
    formFields.title.value = item.title;
    formFields.research_area.value = item.research_area;
    formFields.description.value = item.description;
    formFields.faculty_name.value = item.faculty_name;
    formFields.department.value = item.department;
    formFields.required_skills.value = item.required_skills;
    formFields.positions.value = item.positions;
    formFields.deadline.value = formatDate(item.deadline);
    formFields.status.value = item.status;

    formModal.show();
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

// handleSubmit
// Validates, then creates (POST) or updates (PUT) depending on whether the
// hidden id field is set. Refreshes the list and shows a success alert.
async function handleSubmit(event) {
  event.preventDefault();

  const values = readForm();
  if (!validateForm(values)) {
    return; // inline feedback already shown; block submission
  }

  // Build the payload the API expects (strings trimmed, positions numeric).
  const payload = {
    title: values.title.trim(),
    research_area: values.research_area.trim(),
    description: values.description.trim(),
    faculty_name: values.faculty_name.trim(),
    department: values.department.trim(),
    required_skills: values.required_skills.trim(),
    positions: Number(values.positions),
    deadline: values.deadline,
    status: values.status,
  };

  try {
    if (values.id) {
      // Editing an existing record.
      await window.api.update(values.id, payload);
      formModal.hide();
      showAlert("Opportunity updated successfully.", "success");
    } else {
      // Creating a new record.
      await window.api.create(payload);
      formModal.hide();
      showAlert("Opportunity created successfully.", "success");
    }
    // Always refresh from the API so the UI never shows stale data.
    await loadOpportunities();
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

// --- Close / Delete actions --------------------------------------------

// closeOpportunity
// Confirms, then PUTs status "Closed", refreshes, and alerts.
async function closeOpportunity(id) {
  if (!window.confirm("Mark this opportunity as Closed?")) return;
  try {
    await window.api.update(id, { status: "Closed" });
    showAlert("Opportunity closed.", "success");
    await loadOpportunities();
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

// deleteOpportunity
// Confirms, then DELETEs, refreshes, and alerts.
async function deleteOpportunity(id) {
  if (!window.confirm("Delete this opportunity? This cannot be undone.")) return;
  try {
    const result = await window.api.remove(id);
    showAlert((result && result.message) || "Opportunity deleted.", "success");
    await loadOpportunities();
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

// --- Event wiring -------------------------------------------------------

// Use event delegation so dynamically-created buttons work without
// re-attaching listeners after each render.
listContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");

  if (action === "view") {
    openDetails(id);
  } else if (action === "edit") {
    openEditForm(id);
  } else if (action === "close") {
    closeOpportunity(id);
  } else if (action === "delete") {
    deleteOpportunity(id);
  }
});

// Navbar "+ Add New Opportunity" opens the empty create form.
addNewBtn.addEventListener("click", openCreateForm);

// Form submit (create or update).
form.addEventListener("submit", handleSubmit);

// Load the list as soon as the page is ready.
document.addEventListener("DOMContentLoaded", loadOpportunities);
