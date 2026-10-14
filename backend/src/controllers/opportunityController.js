// opportunityController.js
// Request handlers (business logic) for the /api/opportunities routes.
// Each handler uses async/await with try/catch. Database access goes through
// the mysql2 pool using parameterized queries to prevent SQL injection.

const { pool } = require("../config/db");

// Columns we accept from the client when creating a record.
// (id, created_at, updated_at are managed by the database.)
const INSERT_FIELDS = [
  "title",
  "description",
  "research_area",
  "faculty_name",
  "department",
  "required_skills",
  "positions",
  "deadline",
  "status",
];

// Helper: validate that an :id route param is a positive integer.
function parsePositiveIntId(rawId) {
  const num = Number(rawId);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

// createOpportunity
// POST /api/opportunities
// The body has already been validated by validateOpportunity middleware.
async function createOpportunity(req, res, next) {
  try {
    const body = req.body;

    // Trim string values; default status to 'Open' when not provided.
    const values = [
      body.title.trim(),
      body.description.trim(),
      body.research_area.trim(),
      body.faculty_name.trim(),
      body.department.trim(),
      body.required_skills.trim(),
      Number(body.positions),
      body.deadline,
      body.status ? body.status : "Open",
    ];

    // Parameterized INSERT. The ? placeholders are safely bound to `values`.
    const sql = `
      INSERT INTO opportunities
        (${INSERT_FIELDS.join(", ")})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, values);

    // Fetch the freshly inserted row so we return the full record,
    // including DB-managed fields (id, created_at, updated_at).
    const [rows] = await pool.query(
      "SELECT * FROM opportunities WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    // Pass unexpected errors to the centralized error handler.
    next(error);
  }
}

// getAllOpportunities
// GET /api/opportunities
// Returns every opportunity, newest first.
async function getAllOpportunities(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM opportunities ORDER BY created_at DESC, id DESC"
    );
    return res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
}

// getOpportunityById
// GET /api/opportunities/:id
// Returns a single opportunity, or 404 if not found.
async function getOpportunityById(req, res, next) {
  try {
    const id = parsePositiveIntId(req.params.id);

    // 400 if the id is not a positive integer.
    if (id === null) {
      return res
        .status(400)
        .json({ message: "id must be a positive integer" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM opportunities WHERE id = ?",
      [id]
    );

    // 404 if no row matched the id.
    if (rows.length === 0) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// updateOpportunity
// PUT /api/opportunities/:id
// Supports partial updates: only the fields present in the body are changed.
// The body has already been validated by validateOpportunityUpdate.
async function updateOpportunity(req, res, next) {
  try {
    const id = parsePositiveIntId(req.params.id);

    // 400 if the id is not a positive integer.
    if (id === null) {
      return res
        .status(400)
        .json({ message: "id must be a positive integer" });
    }

    const body = req.body;

    // Build the SET clause dynamically, but only from a known whitelist of
    // columns (INSERT_FIELDS). Column names are never taken from user input,
    // and all values are bound as parameters, so this is SQL-injection safe.
    const setClauses = [];
    const values = [];

    for (const field of INSERT_FIELDS) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        // Trim string fields; keep positions numeric; dates/status as given.
        if (field === "positions") {
          values.push(Number(body[field]));
        } else if (typeof body[field] === "string") {
          values.push(body[field].trim());
        } else {
          values.push(body[field]);
        }
      }
    }

    // Confirm the record exists before attempting the update, so we can
    // return a clean 404 rather than a silent "0 rows affected".
    const [existing] = await pool.query(
      "SELECT id FROM opportunities WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    // Parameterized UPDATE. The id is bound last.
    const sql = `UPDATE opportunities SET ${setClauses.join(", ")} WHERE id = ?`;
    await pool.query(sql, [...values, id]);

    // Return the updated record.
    const [rows] = await pool.query(
      "SELECT * FROM opportunities WHERE id = ?",
      [id]
    );
    return res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// deleteOpportunity
// DELETE /api/opportunities/:id
// Removes the record if it exists.
async function deleteOpportunity(req, res, next) {
  try {
    const id = parsePositiveIntId(req.params.id);

    // 400 if the id is not a positive integer.
    if (id === null) {
      return res
        .status(400)
        .json({ message: "id must be a positive integer" });
    }

    const [result] = await pool.query(
      "DELETE FROM opportunities WHERE id = ?",
      [id]
    );

    // affectedRows is 0 when no row matched the id -> 404.
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Opportunity not found" });
    }

    return res
      .status(200)
      .json({ message: "Opportunity deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOpportunity,
  getAllOpportunities,
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
  // Exported so other modules can reuse the id check.
  parsePositiveIntId,
};
