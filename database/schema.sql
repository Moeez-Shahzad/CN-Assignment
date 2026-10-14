-- schema.sql
-- Database schema for the University Research Opportunity Portal.
-- Run this file once to create the database and the `opportunities` table.

-- 1. Create the database only if it does not already exist, then select it.
CREATE DATABASE IF NOT EXISTS research_portal;
USE research_portal;

-- 2. Create the `opportunities` table.
--    Each row is a single research opportunity offered by a faculty member.
CREATE TABLE IF NOT EXISTS opportunities (
  -- Auto-incrementing primary key.
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Short title of the opportunity.
  title VARCHAR(200) NOT NULL,

  -- Longer description of the work involved.
  description TEXT NOT NULL,

  -- Research area / field (e.g. "Machine Learning").
  research_area VARCHAR(100) NOT NULL,

  -- Name of the faculty member offering the opportunity.
  faculty_name VARCHAR(100) NOT NULL,

  -- Department the opportunity belongs to.
  department VARCHAR(100) NOT NULL,

  -- Skills required, stored as a plain string (e.g. "Python, Statistics").
  required_skills VARCHAR(500) NOT NULL,

  -- Number of available positions. Must be zero or more.
  positions INT NOT NULL CHECK (positions >= 0),

  -- Application deadline (date only, no time).
  deadline DATE NOT NULL,

  -- Whether the opportunity is still accepting applications.
  status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',

  -- Row creation timestamp, set automatically on insert.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Last update timestamp, refreshed automatically on every update.
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
