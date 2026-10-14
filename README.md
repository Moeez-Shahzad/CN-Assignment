# University Research Opportunity Portal

A full-stack web application for managing university research opportunities.
Faculty can post research positions, and students can browse the openings and
view their details. The app is a complete CRUD system built on a REST API
backed by a MySQL database, with a simple Bootstrap frontend.

**GitHub Repository: https://github.com/Moeez-Shahzad/CN-Assignment**
## Features

- Create, read, update, and delete research opportunities (full CRUD).
- Browse all opportunities as responsive cards with a colored status badge
  (green for **Open**, red for **Closed**).
- View every detail of an opportunity in a modal.
- Add / edit opportunities through a single reusable modal form with
  client-side validation and inline error messages.
- Close an opportunity (Open → Closed) with one click.
- Delete an opportunity with a confirmation prompt.
- Server-side validation with clear error messages and correct HTTP status
  codes (200, 201, 400, 404, 500).
- No hard-coded data anywhere: everything is read from and written to MySQL
  through the API.

## Tech Stack

- **Backend:** Node.js, Express, mysql2 (promise API), dotenv, cors
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5 (via CDN), served as static
  files by Express
- **Dev tooling:** nodemon
- **API testing:** Postman (collection included)

## Folder Structure

```
research-opportunity-portal/
  backend/                       # Express REST API
    src/
      config/
        db.js                    # MySQL connection pool + startup test
      controllers/
        opportunityController.js # CRUD request handlers
      middleware/
        validateOpportunity.js   # Request body validation
      routes/
        opportunityRoutes.js     # /api/opportunities route definitions
    server.js                    # App entry point
    package.json
  frontend/                      # Static frontend served by Express
    index.html                   # Page layout, navbar, modals
    css/
      style.css                  # Small custom styles
    js/
      api.js                     # fetch wrappers for the API
      app.js                     # UI logic (render, forms, actions)
  database/
    schema.sql                   # MySQL database + table schema
  postman/
    Research_Opportunity_Portal_API.postman_collection.json
  README.md
  .gitignore
  .env.example                   # Template for backend/.env (no secrets)
```

## Prerequisites

- **Node.js** v18 or newer (includes npm)
- **MySQL** v8.0+ running locally (or a reachable MySQL server)
- A MySQL user with permission to create a database and table

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/<username>/research-opportunity-portal.git
cd research-opportunity-portal
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create your environment file

Copy the template and fill in your real MySQL credentials. The `.env` file is
git-ignored and must never be committed.

```bash
# from the backend/ folder
cp ../.env.example .env
```

Then edit `backend/.env`:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=research_portal
DB_PORT=3306
PORT=3000
```

### 4. Create the database and table

Run the schema file once. From the **project root**:

```bash
mysql -u root -p < database/schema.sql
```

Replace `root` with your MySQL username if different; you'll be prompted for
the password. This creates the `research_portal` database and the
`opportunities` table.

> Alternatively, open any MySQL client and run `SOURCE database/schema.sql;`.

### 5. Start the server

From the `backend/` folder:

```bash
npm run dev     # development, auto-reloads on changes (nodemon)
# or
npm start       # plain start
```

You should see:

```
Server running at http://localhost:3000
Database connected successfully.
```

### 6. Open the frontend

Open your browser at:

```
http://localhost:3000/
```

The frontend is served by the same Express server, so no separate step is
needed. A quick health check is available at
`http://localhost:3000/api/health` (returns `{"status":"ok"}`).

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint                 | Description                     | Success | Errors        |
| ------ | ------------------------ | ------------------------------- | ------- | ------------- |
| GET    | /api/health              | Health check                    | 200     | —             |
| POST   | /api/opportunities       | Create a research opportunity   | 201     | 400, 500      |
| GET    | /api/opportunities       | List all opportunities (newest) | 200     | 500           |
| GET    | /api/opportunities/:id   | Get a single opportunity        | 200     | 400, 404, 500 |
| PUT    | /api/opportunities/:id   | Update an opportunity           | 200     | 400, 404, 500 |
| DELETE | /api/opportunities/:id   | Delete an opportunity           | 200     | 400, 404, 500 |

### Field reference

| Field            | Type    | Rules                                        |
| ---------------- | ------- | -------------------------------------------- |
| title            | string  | required, non-empty                          |
| description      | string  | required, non-empty                          |
| research_area    | string  | required, non-empty                          |
| faculty_name     | string  | required, non-empty                          |
| department       | string  | required, non-empty                          |
| required_skills  | string  | required, non-empty                          |
| positions        | integer | required, >= 0                               |
| deadline         | date    | required, format YYYY-MM-DD                  |
| status           | enum    | optional, 'Open' or 'Closed' (default 'Open')|

`id`, `created_at`, and `updated_at` are managed by the database.

### Example requests and responses

**Create — `POST /api/opportunities`**

Request body:

```json
{
  "title": "AI Research Assistant",
  "description": "Assist with training deep learning models.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch, Git",
  "positions": 2,
  "deadline": "2026-12-31",
  "status": "Open"
}
```

Response `201 Created`:

```json
{
  "id": 1,
  "title": "AI Research Assistant",
  "description": "Assist with training deep learning models.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, PyTorch, Git",
  "positions": 2,
  "deadline": "2026-12-31T00:00:00.000Z",
  "status": "Open",
  "created_at": "2026-01-01T10:00:00.000Z",
  "updated_at": "2026-01-01T10:00:00.000Z"
}
```

**List — `GET /api/opportunities`** → `200 OK` with an array of records
(newest first).

**Get one — `GET /api/opportunities/1`** → `200 OK` with a single record, or
`404 Not Found`:

```json
{ "message": "Opportunity not found" }
```

**Update — `PUT /api/opportunities/1`** (partial updates allowed)

Request body:

```json
{ "positions": 4, "status": "Closed" }
```

Response `200 OK` with the full updated record.

**Delete — `DELETE /api/opportunities/1`** → `200 OK`:

```json
{ "message": "Opportunity deleted successfully" }
```

**Validation error — `400 Bad Request`**

```json
{
  "message": "Validation failed",
  "errors": [
    "title is required and must be a non-empty string",
    "positions must be a non-negative integer"
  ]
}
```

**Server error — `500 Internal Server Error`**

```json
{ "message": "Internal server error" }
```

## API Testing (Postman)

A ready-to-run Postman collection is included at
`postman/Research_Opportunity_Portal_API.postman_collection.json`.

1. Make sure the server is running (see Setup) and the database is reachable.
2. Open Postman → **Import** → select the collection file.
3. The collection defines two variables: `baseUrl`
   (`http://localhost:3000`) and `id`. The first "Create" request saves the new
   record's `id` into the `id` variable, which later single-record requests
   reuse — so run the requests **in order** (top to bottom).
4. Run them one by one and check the green **Test Results**, or use the
   **Collection Runner** (collection → **Run**) to execute all requests at once.

The collection covers: create x3, list, get one, update, close (Open→Closed),
delete, get-after-delete (404), and an invalid create (400).

> **Bruno users:** Bruno can import a Postman v2.1 collection via
> **Import Collection → Postman Collection**. After importing, confirm the
> `baseUrl` variable is set to `http://localhost:3000`, then run the requests
> top to bottom just like in Postman.

## Security Notes

- Real credentials live only in `backend/.env`, which is git-ignored. The
  committed `.env.example` contains placeholders only.
- All database queries use parameterized statements (prepared `?`
  placeholders) to prevent SQL injection.
- The API validates all input server-side; the frontend validation is a
  convenience layer on top.

## Troubleshooting

- **"Database connection failed"** on startup: check that MySQL is running and
  that the values in `backend/.env` are correct. The server still starts so the
  health route works, but API calls that hit the DB will fail until it connects.
- **Port already in use:** change `PORT` in `backend/.env`.
- **Empty page / "No opportunities found":** the table is empty — create one
  from the frontend "Add New Opportunity" button or via Postman.
