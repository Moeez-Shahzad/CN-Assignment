// server.js
// Entry point for the University Research Opportunity Portal backend.
// Wires up the server, middleware, static frontend, the health-check route,
// and a database connection test on startup. CRUD logic is added later.

// Load environment variables from the .env file into process.env.
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

// Database connection pool and startup connection test.
const { testConnection } = require("./src/config/db");

// API routes for research opportunities.
const opportunityRoutes = require("./src/routes/opportunityRoutes");

// Create the Express application.
const app = express();

// --- Middleware ---------------------------------------------------------

// Allow requests from other origins (e.g. the frontend during development).
app.use(cors());

// Parse incoming JSON request bodies and make them available on req.body.
app.use(express.json());

// --- Static frontend ----------------------------------------------------

// Serve the frontend folder as static files.
// The frontend lives one level up from backend/, inside frontend/.
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// --- Routes -------------------------------------------------------------

// Simple health-check endpoint used to confirm the server is running.
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Research opportunity endpoints, mounted under /api/opportunities.
app.use("/api/opportunities", opportunityRoutes);

// --- 404 handler --------------------------------------------------------

// Any request that did not match a route above falls through to here.
// Note: this only handles unknown API routes. Unknown non-API paths are
// handled by the static frontend (express.static) above.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Centralized error handler ------------------------------------------

// Express recognizes a middleware with four arguments as an error handler.
// Controllers forward unexpected errors here via next(error).
app.use((err, req, res, next) => {
  // Log the real error server-side for debugging...
  console.error("Unexpected error:", err);
  // ...but return a generic message to the client (don't leak details).
  res.status(500).json({ message: "Internal server error" });
});

// --- Start the server ---------------------------------------------------

// Use the PORT from .env, or fall back to 3000 if it is not set.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  // Test the database connection once the server has started.
  testConnection();
});
