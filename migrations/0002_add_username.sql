-- Migration 0002: add username column to users table
-- Add column (nullable for backward compatibility)
ALTER TABLE users ADD COLUMN username TEXT;

-- Add unique index for usernames (ignore nulls – SQLite treats NULL as distinct)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
