// validateOpportunity.js
// Express middleware that validates the request body for creating or
// updating an opportunity. If validation fails it responds with 400 and a
// list of field errors; otherwise it calls next() to continue.

// Required string fields. Each must be present and non-empty after trimming.
const REQUIRED_STRING_FIELDS = [
  "title",
  "description",
  "research_area",
  "faculty_name",
  "department",
  "required_skills",
];

// Helper: checks that a value is a non-empty string once trimmed.
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Helper: checks that a value is a non-negative integer.
// Accepts numbers and numeric strings (e.g. 3 or "3"), rejects 2.5, -1, "abc".
function isNonNegativeInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
}

// Helper: checks that a value is a valid date in YYYY-MM-DD format.
function isValidDate(value) {
  // Must be a string that matches the YYYY-MM-DD pattern.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  // Must also be a real calendar date (rejects e.g. 2025-13-40).
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  // Re-format the parsed date and compare, so dates like 2025-02-30 (which
  // JavaScript "rolls over") are rejected.
  const [year, month, day] = value.split("-").map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

// The validation middleware.
function validateOpportunity(req, res, next) {
  const body = req.body || {};
  const errors = [];

  // 1. Required string fields must be non-empty after trimming.
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(body[field])) {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }

  // 2. positions must be a non-negative integer.
  if (body.positions === undefined || body.positions === null || body.positions === "") {
    errors.push("positions is required");
  } else if (!isNonNegativeInteger(body.positions)) {
    errors.push("positions must be a non-negative integer");
  }

  // 3. deadline must be a valid date (YYYY-MM-DD).
  if (!isValidDate(body.deadline)) {
    errors.push("deadline is required and must be a valid date (YYYY-MM-DD)");
  }

  // 4. status is optional, but if provided must be 'Open' or 'Closed'.
  if (body.status !== undefined) {
    if (body.status !== "Open" && body.status !== "Closed") {
      errors.push("status must be either 'Open' or 'Closed'");
    }
  }

  // If any errors were collected, stop here and respond with 400.
  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  // All good — continue to the controller.
  next();
}

// validateOpportunityUpdate
// Middleware for PUT (partial update). Only the fields present in the body
// are validated, using the same rules as create. At least one updatable
// field must be provided. Fields that are absent are left unchanged.
function validateOpportunityUpdate(req, res, next) {
  const body = req.body || {};
  const errors = [];

  // Validate required string fields ONLY if they are present in the body.
  for (const field of REQUIRED_STRING_FIELDS) {
    if (body[field] !== undefined && !isNonEmptyString(body[field])) {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  // positions: validate only if present.
  if (body.positions !== undefined) {
    if (body.positions === null || body.positions === "") {
      errors.push("positions must be a non-negative integer");
    } else if (!isNonNegativeInteger(body.positions)) {
      errors.push("positions must be a non-negative integer");
    }
  }

  // deadline: validate only if present.
  if (body.deadline !== undefined && !isValidDate(body.deadline)) {
    errors.push("deadline must be a valid date (YYYY-MM-DD)");
  }

  // status: validate only if present.
  if (body.status !== undefined) {
    if (body.status !== "Open" && body.status !== "Closed") {
      errors.push("status must be either 'Open' or 'Closed'");
    }
  }

  // Must update at least one allowed field.
  const updatableFields = [...REQUIRED_STRING_FIELDS, "positions", "deadline", "status"];
  const providedFields = updatableFields.filter(
    (field) => body[field] !== undefined
  );
  if (providedFields.length === 0) {
    errors.push("At least one updatable field must be provided");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation failed", errors });
  }

  next();
}

module.exports = validateOpportunity;
module.exports.validateOpportunityUpdate = validateOpportunityUpdate;
