// db.js
// Sets up a MySQL connection pool using the mysql2 promise API.
// Credentials are read from environment variables (.env) so no secrets
// are hard-coded in the source.

const mysql = require("mysql2/promise");

// Create a connection pool. A pool reuses a set of connections instead of
// opening a new one for every query, which is more efficient and reliable.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  // Return DATE / DATETIME / TIMESTAMP columns as plain strings instead of
  // JavaScript Date objects. This avoids timezone conversion that would
  // otherwise shift a stored date like 2026-12-31 by a day when the response
  // is serialized to JSON (toJSON uses UTC).
  dateStrings: true,

  // Pool behaviour settings.
  waitForConnections: true, // queue queries when all connections are busy
  connectionLimit: 10, // max number of connections in the pool
  queueLimit: 0, // unlimited queued requests
});

// testConnection
// Grabs a connection from the pool on startup to confirm the database is
// reachable and the credentials are correct. Logs a clear message either way.
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully.");
    // Always release the connection back to the pool when done.
    connection.release();
  } catch (error) {
    console.error("Database connection failed:");
    console.error(`  ${error.message}`);
    console.error(
      "  Check your .env values (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT) and that MySQL is running."
    );
  }
}

// Export the pool (for running queries) and the test function (for startup).
module.exports = { pool, testConnection };
