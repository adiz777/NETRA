-- NETRA Cloudflare D1 Database Schema
-- Version: 1.0.0
-- Dialect: Cloudflare D1 (SQLite 3 compatible)

PRAGMA foreign_keys = ON;

--------------------------------------------------------------------------------
-- 1. USERS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                            -- Format: usr_<uuid4>
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,      -- Lowercase normalized email
    password_hash TEXT NOT NULL,                    -- PBKDF2: pbkdf2$100000$<salt_hex>$<hash_hex>
    full_name TEXT NOT NULL,                        -- Display name
    role TEXT NOT NULL CHECK (role IN ('investigator', 'admin')) DEFAULT 'investigator',
    status TEXT NOT NULL CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

--------------------------------------------------------------------------------
-- 2. CASES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,                            -- Format: case_<uuid4>
    title TEXT NOT NULL,                            -- Case title (e.g., 'Operation ShadowEcho')
    description TEXT NOT NULL DEFAULT '',           -- Full operational brief
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'closed')) DEFAULT 'active',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)), -- JSON array of tags: ["osint","synthetic"]
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_cases_owner_id ON cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

--------------------------------------------------------------------------------
-- 3. DOSSIERS TABLE (Synthetic Identity Storage)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dossiers (
    id TEXT PRIMARY KEY,                            -- Format: dos_<uuid4>
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    seed TEXT NOT NULL,                             -- Deterministic generation seed (e.g., 'delta-99')
    generator_params TEXT NOT NULL CHECK (json_valid(generator_params)), -- JSON input parameters
    full_name TEXT NOT NULL,                        -- Synthetic entity primary name
    primary_alias TEXT NOT NULL DEFAULT '',         -- Online handle or primary operational alias
    nationality TEXT NOT NULL,                      -- ISO 3166-1 alpha-2 code
    dossier_data TEXT NOT NULL CHECK (json_valid(dossier_data)), -- Complete 12-domain synthetic payload
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_dossiers_case_id ON dossiers(case_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_seed ON dossiers(seed);
CREATE INDEX IF NOT EXISTS idx_dossiers_full_name ON dossiers(full_name);

--------------------------------------------------------------------------------
-- 4. EVIDENCE TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,                            -- Format: evi_<uuid4>
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,                            -- Evidence artifact title
    type TEXT NOT NULL CHECK (type IN (
        'document', 'network_artifact', 'credential', 
        'communication', 'financial_record', 'raw_json', 'other'
    )),
    content TEXT NOT NULL,                          -- Text body, extracted intelligence, or data URI
    source_url TEXT NOT NULL DEFAULT '',            -- Origin URL or OSINT source
    hash_sha256 TEXT NOT NULL DEFAULT '',           -- Cryptographic integrity digest
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_dossier_id ON evidence(dossier_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);

--------------------------------------------------------------------------------
-- 5. NOTES TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,                            -- Format: not_<uuid4>
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title TEXT NOT NULL DEFAULT '',                 -- Subject or header
    content TEXT NOT NULL,                          -- Markdown note content
    category TEXT NOT NULL CHECK (category IN (
        'observation', 'lead', 'hypothesis', 'interview', 'summary'
    )) DEFAULT 'observation',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_case_id ON notes(case_id);
CREATE INDEX IF NOT EXISTS idx_notes_author_id ON notes(author_id);

--------------------------------------------------------------------------------
-- 6. TIMELINES TABLE (Case & Identity Event Chronology)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS timelines (
    id TEXT PRIMARY KEY,                            -- Format: tle_<uuid4>
    case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
    event_timestamp TEXT NOT NULL,                  -- ISO 8601 synthetic or observed event time
    title TEXT NOT NULL,                            -- Milestone title
    description TEXT NOT NULL DEFAULT '',           -- Detailed event narrative
    category TEXT NOT NULL CHECK (category IN (
        'employment', 'education', 'financial', 'incident', 
        'travel', 'legal', 'social', 'cyber'
    )),
    significance TEXT NOT NULL CHECK (significance IN (
        'low', 'medium', 'high', 'critical'
    )) DEFAULT 'medium',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_timelines_case_id ON timelines(case_id);
CREATE INDEX IF NOT EXISTS idx_timelines_event_timestamp ON timelines(event_timestamp ASC);
CREATE INDEX IF NOT EXISTS idx_timelines_category ON timelines(category);

--------------------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,                            -- Format: aud_<uuid4>
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,                           -- e.g. 'auth.login', 'case.read', 'case.create'
    resource_type TEXT NOT NULL,                    -- 'case', 'dossier', 'user', 'evidence'
    resource_id TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(details)),
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
