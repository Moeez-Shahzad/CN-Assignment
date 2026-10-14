// api.js
// A small module that talks to the backend REST API using fetch().
// Every function returns parsed JSON on success, or throws an Error whose
// message is the server's error message (so the UI can display it).

// Relative base URL. Because the frontend is served by the same Express
// server, we don't need an absolute host here.
const BASE_URL = "/api/opportunities";

// handleResponse
// Shared helper that turns a fetch Response into usable data, or throws a
// helpful Error when the response is not OK (status outside 200-299).
async function handleResponse(response) {
  // Some responses (e.g. a 204) may have no JSON body; guard against that.
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    // Prefer the server's message. If the server sent a list of validation
    // errors, join them so the user sees exactly what went wrong.
    let message = (data && data.message) || `Request failed (${response.status})`;
    if (data && Array.isArray(data.errors) && data.errors.length > 0) {
      message += ": " + data.errors.join(", ");
    }
    throw new Error(message);
  }

  return data;
}

// getAll -> GET /api/opportunities  (returns an array)
async function getAll() {
  const response = await fetch(BASE_URL);
  return handleResponse(response);
}

// getOne -> GET /api/opportunities/:id  (returns one object)
async function getOne(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  return handleResponse(response);
}

// create -> POST /api/opportunities  (returns the created object)
async function create(data) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// update -> PUT /api/opportunities/:id  (returns the updated object)
async function update(id, data) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// remove -> DELETE /api/opportunities/:id  (returns {message})
async function remove(id) {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  return handleResponse(response);
}

// Expose the API functions on a single global object so other scripts
// (loaded with plain <script> tags) can use them.
window.api = { getAll, getOne, create, update, remove };
