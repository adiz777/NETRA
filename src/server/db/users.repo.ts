import type { IDatabase } from './client.js';
import type { User, UserRole, UserStatus } from '@shared/types/auth.js';

// -----------------------------------------------------------------------------
// DB row definition – reflects the "users" table (including optional username).
// -----------------------------------------------------------------------------
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  username?: string; // new optional username field
}

/**
 * Map a raw database row to the public `User` type used throughout the app.
 */
function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username ?? undefined,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UsersRepository {
  constructor(private db: IDatabase) {}

  /** Insert a new user. Supports optional `username`. */
  async createUser(input: {
    id?: string;
    email: string;
    username?: string; // optional username
    passwordHash: string;
    fullName: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<User> {
    const id = input.id ?? `usr_${crypto.randomUUID().replace(/-/g, '')}`;
    const role = input.role ?? 'investigator';
    const status = input.status ?? 'active';
    const email = input.email.trim().toLowerCase();
    const username = input.username?.trim() ?? null;

    // Build INSERT – include username column only if we have a value.
    const columns = ['id', 'email', 'password_hash', 'full_name', 'role', 'status'];
    const values = [id, email, input.passwordHash, input.fullName, role, status];
    if (username) {
      columns.push('username');
      values.push(username);
    }
    const stmt = this.db.prepare(
      `INSERT INTO users (${columns.map((c) => c).join(', ')})\n       VALUES (${columns.map(() => '?').join(', ')})`
    );
    await stmt.bind(...values).run();

    const user = await this.findById(id);
    if (!user) {
      throw new Error(`Failed to retrieve newly created user with id ${id}`);
    }
    return user;
  }

  /** Find a user by email (case‑insensitive). */
  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const stmt = this.db.prepare(
      `SELECT * FROM users WHERE email = ? COLLATE NOCASE LIMIT 1`
    );
    const row = await stmt.bind(normalized).first<UserRow>();
    return row ? mapRowToUser(row) : null;
  }

  /** Find a user by username (exact match). */
  async findByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM users WHERE username = ? LIMIT 1`
    );
    const row = await stmt.bind(username).first<UserRow>();
    return row ? mapRowToUser(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM users WHERE id = ? LIMIT 1`
    );
    const row = await stmt.bind(id).first<UserRow>();
    return row ? mapRowToUser(row) : null;
  }

  async listUsers(): Promise<User[]> {
    const stmt = this.db.prepare(`SELECT * FROM users ORDER BY created_at DESC`);
    const { results } = await stmt.all<UserRow>();
    return results.map(mapRowToUser);
  }

  async updateUser(
    id: string,
    updates: Partial<{ fullName: string; role: UserRole; status: UserStatus; username: string }>
  ): Promise<User | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fullName = updates.fullName ?? existing.fullName;
    const role = updates.role ?? existing.role;
    const status = updates.status ?? existing.status;
    const username = updates.username ?? existing.username ?? null;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(
      `UPDATE users\n        SET full_name = ?, role = ?, status = ?, updated_at = ?, username = ?\n        WHERE id = ?`
    );
    await stmt.bind(fullName, role, status, now, username, id).run();
    return this.findById(id);
  }
}
